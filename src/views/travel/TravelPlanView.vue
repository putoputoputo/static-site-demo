<template>
  <div class="travel plan-page">
    <section class="hero">
      <div class="hero-eyebrow">路线规划 · {{ travelMeta.city }} · 公共交通</div>
      <h1>选起点和终点，排出怎么走</h1>
      <p class="hero-lead">
        出发地和目的地直接打字搜——景点、火车站、机场都能当端点，比如「北京南站 → 颐和园」。
        算法沿路把必去的故宫和长城串进去，最后落在你选的终点。每天几点到、下一段坐什么、大概花多少钱，都在下面。
        长城单独占一天，因为往返就要 2—5 小时，塞不下第二个景点。
      </p>
      <div class="hero-meta">
        <span>{{ planMeta.totalSpots }} 个景点 + {{ planMeta.hubCount }} 个交通枢纽可选</span>
        <span>长城自动选更顺的一段</span>
        <span>三档方案：紧凑 / 标准 / 完整</span>
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">起终点</h2>
      <p class="panel-sub">
        输入框里打字会实时筛，也可以点开列表选。出发地选「北京南站」「首都机场 T3」这类枢纽时，
        第一天第一段就按真实进城时间算；目的地选枢纽时，最后一天会补上「最后一站 → 枢纽」这段。
        住处到第一天第一站、最后一天终点回住处这两段不在计算内（你还没定住哪）。
      </p>

      <div class="planner-grid">
        <div class="field">
          <span class="field-label">出发地</span>
          <PlacePicker v-model="startPlace" placeholder="搜景点 / 火车站 / 机场 / 任意地点" />
        </div>

        <div class="field">
          <span class="field-label">目的地</span>
          <PlacePicker v-model="endPlace" placeholder="搜景点 / 火车站 / 机场 / 任意地点" />
        </div>

        <label class="field">
          <span class="field-label">出发日期</span>
          <select v-model="startDate" class="field-input">
            <option value="">不指定（只排顺序）</option>
            <option v-for="day in festivalDays" :key="day.date" :value="day.date">
              {{ day.date }} {{ day.weekday }} · {{ day.label }}
            </option>
          </select>
        </label>

        <label class="field">
          <span class="field-label">长城段</span>
          <select v-model="wallChoice" class="field-input">
            <option value="auto">自动选（按路线方向）</option>
            <option value="badaling">八达岭（有京张高铁）</option>
            <option value="mutianyu">慕田峪（人少，换乘久）</option>
          </select>
        </label>
      </div>

      <div class="planner-actions">
        <button type="button" class="btn-link" @click="swapEnds">对调起终点</button>
        <span class="planner-hint">改任何一项都会立刻重排，不用再点按钮。</span>
      </div>

      <p v-if="error" class="pending-note">{{ error }}</p>
      <p v-if="activeRoute && startDate && activeRoute.dayCount > festivalDays.length" class="pending-note">
        这套方案要 {{ activeRoute.dayCount }} 天，超过春节 {{ festivalDays.length }} 天假期。
      </p>
    </section>

    <template v-if="activeRoute">
      <div class="pace-tabs">
        <button
          v-for="route in routes"
          :key="route.id"
          type="button"
          class="pace-tab"
          :class="{ on: route.id === activePaceId }"
          @click="activePaceId = route.id"
        >
          <strong>{{ route.name }}</strong>
          <span>{{ route.dayCount }} 天 · {{ route.totalSpots }} 站</span>
          <em>{{ route.desc }}</em>
        </button>
      </div>

      <section class="panel">
        <div class="plan-stats">
          <div class="stat">
            <strong>{{ activeRoute.dayCount }}</strong>
            <span>天</span>
          </div>
          <div class="stat">
            <strong>{{ activeRoute.totalSpots }}</strong>
            <span>个景点</span>
          </div>
          <div class="stat">
            <strong>{{ activeRoute.totalMinutes }}</strong>
            <span>分钟在途与停留</span>
          </div>
          <div class="stat money">
            <strong>{{ activeRoute.totalCost }}</strong>
            <span>元（门票 {{ activeRoute.totalTicket }} + 交通 {{ activeRoute.totalFare }}）</span>
          </div>
        </div>

        <p v-if="result && result.wallNote" class="wall-note">{{ result.wallNote }}</p>

        <ul v-if="activeRoute.warnings.length" class="route-warnings">
          <li v-for="warning in activeRoute.warnings" :key="warning.text" :class="warning.level">
            {{ warning.text }}
          </li>
        </ul>
      </section>

      <section class="panel">
        <h2 class="panel-title">这一天在图上的顺序</h2>
        <p class="panel-sub">
          地图按真实经纬度等比投影，点位颜色按片区区分，折线按当天先后连。点下面的天切换。
          标签小是示意图的代价；要看真实路网，用每张卡片上的「在高德地图看这一天」。
        </p>

        <div class="day-chips">
          <button
            v-for="day in activeRoute.days"
            :key="`chip-${day.index}`"
            type="button"
            class="chip"
            :class="{ on: day.index === activeDay }"
            @click="activeDay = day.index"
          >
            第 {{ day.index }} 天
            <em>{{ dayTitle(day) }}</em>
          </button>
        </div>

        <div class="plan-map-full">
          <TravelMap
            :spots="travelSpots"
            :areas="travelAreas"
            :hubs="activeHubPoints"
            :path-ids="activeDayPathIds"
            :active-id="activeSpotId"
            @pick="openSpot"
          />
        </div>
      </section>

      <div class="plan-days">
        <PlanDay
          v-for="day in activeRoute.days"
          :key="day.index"
          :day="day"
          :active="day.index === activeDay"
          @pick="activeDay = $event"
        />
      </div>

      <section v-if="wallCompare.length" class="panel">
        <h2 class="panel-title">两段长城怎么选</h2>
        <p class="panel-sub">上面这套方案选了 {{ activeRoute.wall ? activeRoute.wall.name : '长城' }}；换成另一段的代价如下。</p>
        <div class="wall-grid">
          <div v-for="item in wallCompare" :key="item.id" class="wall-card" :class="{ on: item.id === (activeRoute.wall && activeRoute.wall.id) }">
            <div class="wall-head">
              <strong>{{ item.name }}</strong>
              <span v-if="item.id === (activeRoute.wall && activeRoute.wall.id)" class="tag must">本方案</span>
            </div>
            <ul class="wall-plans">
              <li v-for="plan in item.plans" :key="plan.id" class="wall-plan">
                <div class="wall-plan-head">
                  <span class="wall-mode">{{ plan.mode }}</span>
                  <span class="wall-cost">{{ plan.roundTripFare }} 元往返</span>
                </div>
                <span class="wall-from">{{ plan.from }}</span>
                <p class="wall-text">{{ plan.text }}</p>
              </li>
            </ul>
          </div>
        </div>
        <p class="source-box">
          长城出城交通整理自各运营方公布信息，核对日期 {{ transitMeta.checkedAt }}。
          京张高铁班次与票价以 12306 当日为准，S2 线班次少，出发前必须对时刻表。
        </p>
      </section>

      <section class="panel">
        <h2 class="panel-title">高德实时路线</h2>
        <p class="panel-sub">
          上面那套是按片区通勤矩阵算的估算。这里直接问高德要真实公交方案（含步行段与换乘次数），拿来对照。
          出发地或目的地是高德搜出来的地点时，会自动算一次。
        </p>

        <div class="amap-actions">
          <button type="button" class="btn-link" :disabled="amapLoading" @click="runAmap">
            {{ amapLoading ? '正在查高德…' : '用高德算这条路' }}
          </button>
          <a v-if="amapLink" :href="amapLink" target="_blank" rel="noopener" class="btn-link ghost">
            在高德地图打开
          </a>
        </div>

        <p v-if="amapError" class="pending-note">{{ amapError }}</p>

        <div v-if="amapPlans.length" class="amap-plans">
          <article v-for="plan in amapPlans" :key="plan.index" class="amap-plan">
            <header>
              <strong>方案 {{ plan.index }}</strong>
              <span class="amap-time">{{ plan.minutes }} 分钟</span>
              <span class="amap-meta">{{ plan.km }} 公里 · {{ plan.transfers > 0 ? `换乘 ${plan.transfers} 次` : '无需换乘' }} · 步行 {{ plan.walkMeters }} 米</span>
              <span v-if="plan.cost" class="amap-cost">{{ plan.cost }} 元</span>
            </header>
            <ol class="amap-steps">
              <li v-for="(segment, index) in plan.segments" :key="index">
                <template v-if="segment.type === 'bus'">
                  {{ segment.name }}<em v-if="segment.typeName">（{{ segment.typeName }}）</em>
                  {{ segment.from }} 上车 → {{ segment.to }} 下车，{{ segment.stops }} 站
                </template>
                <template v-else>步行 {{ segment.meters }} 米</template>
              </li>
            </ol>
          </article>
        </div>

        <div class="amap-key">
          <div class="amap-key-head">
            <span>高德 Web 服务 Key</span>
            <span v-if="keyFromStorage" class="tag">用的是你填的 key</span>
            <span v-else class="tag">用的是代码里的默认 key</span>
          </div>
          <div class="amap-key-row">
            <input v-model="amapKey" class="field-input" placeholder="粘贴 Web 服务类型的 key" />
            <button type="button" class="btn-link ghost" @click="saveAmapKey">保存</button>
            <button type="button" class="btn-link ghost" :disabled="probeBusy" @click="testAmapKey">
              {{ probeBusy ? '测试中…' : '测试' }}
            </button>
            <button v-if="keyFromStorage" type="button" class="btn-link ghost" @click="useDefaultKey">用默认 key</button>
          </div>
          <p v-if="keyProbe" class="amap-key-result" :class="keyProbe.ok ? 'ok' : 'bad'">{{ keyProbe.message }}</p>
          <p class="amap-key-hint">
            必须是「Web 服务」类型的 key。JS API / Android / iOS 的 key 调这个接口会返回 10009 平台不匹配。
            key 只存在你这台浏览器的 localStorage 里，代码里那个默认值可以随时在控制台重置。
          </p>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">这套路线是怎么算出来的</h2>
        <ul class="bullet-list">
          <li>长城单独占一天，这是硬约束，不参与打分。它和前后两天的城区行程不接续，回程后仍住市区。</li>
          <li>城区按「顺路」排：把你选的起点→终点连线当主轴，片区在主轴上越靠前越先走，偏离主轴越远扣分越多，所以不会出现「去颐和园却先绕到 798」。</li>
          <li>每天内部的顺序用最近邻加两两交换优化，故宫固定排当天第一站——它淡季 15:30 就停止入馆，排到第三站一定赶不上。</li>
          <li>{{ transitMeta.note }}</li>
          <li>门票按淡季价算，春节落在 11 月 1 日—次年 3 月 31 日的淡季区间内；珍宝馆、缆车这类加购项不计入。</li>
          <li>选了出发日期后，遇到周一闭馆的景点会自动和另一天对调行程，对调不了会明确告诉你是哪一天。</li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TravelMap from '../../components/travel/TravelMap.vue'
import PlanDay from '../../components/travel/PlanDay.vue'
import PlacePicker from '../../components/travel/PlacePicker.vue'
import { travelSpots } from '../../data/travel/spots'
import { travelAreas } from '../../data/travel/areas'
import { placeItemById } from '../../data/travel/places'
import { travelMeta, festivalDays } from '../../data/travel/meta'
import { wallPlans, transitMeta } from '../../data/travel/transit'
import { planRoutes, planMeta } from '../../utils/travelPlanner'
import { planAmapTransit, probeAmapKey, isCustomKey, setAmapKey, getAmapKey, clearAmapKey } from '../../utils/amap'
import { wgs84ToGcj02, amapRouteUrl } from '../../utils/geo'
import './travel.css'

const route = useRoute()
const router = useRouter()

// 起终点既可以是本地库的 id，也可以是高德搜出来的任意地点，所以统一存「地点对象」。
// URL 里只记本地库的 id：高德结果带坐标，塞进 query 会又长又容易被人手改坏。
const toPlace = (id, fallbackId) => {
  const item = placeItemById[id] || placeItemById[fallbackId]
  return item ? { id: item.id, name: item.name, lat: item.lat, lng: item.lng, group: item.group } : null
}

const startPlace = ref(toPlace(route.query.from, 'forbidden-city'))
const endPlace = ref(toPlace(route.query.to, 'summer-palace'))
const startDate = ref(route.query.date || '')
const wallChoice = ref(route.query.wall || 'auto')
const activePaceId = ref('normal')
const activeDay = ref(1)
const activeSpotId = ref('')

const result = computed(() =>
  planRoutes({
    startPlace: startPlace.value,
    endPlace: endPlace.value,
    startDate: startDate.value,
    wallId: wallChoice.value,
  })
)

const error = computed(() => (result.value.error ? result.value.error : ''))
const routes = computed(() => result.value.routes || [])

const activeRoute = computed(() => routes.value.find((item) => item.id === activePaceId.value) || routes.value[0] || null)

// 切换方案后，天选择要回到合法的范围
watch(activePaceId, () => {
  activeDay.value = 1
  activeSpotId.value = ''
})

watch([startPlace, endPlace, startDate, wallChoice], () => {
  activeDay.value = 1
  activeSpotId.value = ''
  const from = startPlace.value && startPlace.value.id !== 'forbidden-city' ? startPlace.value.id : ''
  const to = endPlace.value && endPlace.value.id !== 'summer-palace' ? endPlace.value.id : ''
  router.replace({
    query: {
      // 高德搜出来的地点没有稳定 id 可回放，只写本地库的
      ...(from && placeItemById[from] ? { from } : {}),
      ...(to && placeItemById[to] ? { to } : {}),
      ...(startDate.value ? { date: startDate.value } : {}),
      ...(wallChoice.value !== 'auto' ? { wall: wallChoice.value } : {}),
    },
  })
})

// 端点带坐标但不是本地景点时（高德搜出来的地点），问一次高德要真实公交方案
const customEnds = computed(() => {
  const list = []
  if (startPlace.value && !placeItemById[startPlace.value.id]) list.push(startPlace.value)
  if (endPlace.value && !placeItemById[endPlace.value.id]) list.push(endPlace.value)
  return list
})

// ---------------------------------------------------------------------------
// 高德实时路线：我们自己的矩阵是估算，这里是高德给的真实公交方案，放一屏做对照
const toGcj = (place) => (place.gcj ? { lng: place.lng, lat: place.lat } : wgs84ToGcj02(place.lng, place.lat))

const amapPlans = ref([])
const amapLoading = ref(false)
const amapError = ref('')

const runAmap = async () => {
  if (!startPlace.value || !endPlace.value) return
  amapLoading.value = true
  amapError.value = ''
  amapPlans.value = []
  const res = await planAmapTransit(toGcj(startPlace.value), toGcj(endPlace.value))
  amapLoading.value = false
  if (!res.ok) {
    amapError.value = res.error
    return
  }
  amapPlans.value = res.plans
}

// 选了高德搜出来的地点就自动算一次，省得用户还要再点一下
watch(customEnds, (list) => {
  if (list.length) runAmap()
})

const amapLink = computed(() => amapRouteUrl(startPlace.value, endPlace.value, 'bus'))

// key 设置：存在 localStorage，换 key 不用重新构建
const amapKey = ref(getAmapKey())
const keyProbe = ref(null)
const probeBusy = ref(false)
const keyFromStorage = ref(isCustomKey())

const saveAmapKey = () => {
  setAmapKey(amapKey.value)
  keyFromStorage.value = isCustomKey()
  keyProbe.value = null
}

const testAmapKey = async () => {
  probeBusy.value = true
  keyProbe.value = await probeAmapKey()
  probeBusy.value = false
}

// 回到代码里的默认 key（默认 key 已实测可用）
const useDefaultKey = () => {
  clearAmapKey()
  amapKey.value = getAmapKey()
  keyFromStorage.value = isCustomKey()
  keyProbe.value = { ok: true, message: '已切回默认 key，下面的路线会用它重新请求' }
}

const spotById = travelSpots.reduce((map, spot) => {
  map[spot.id] = spot
  return map
}, {})

const activeDayData = computed(() => {
  if (!activeRoute.value) return null
  return activeRoute.value.days.find((day) => day.index === activeDay.value) || activeRoute.value.days[0]
})

// 出发点只在第一天画在图上，终点只在最后一天画；其它天不带锚点，免得常驻标签和景点打架
const activeHubPoints = computed(() => {
  const route = activeRoute.value
  const day = activeDayData.value
  if (!route || !day) return []
  const list = []
  if (route.origin && day.index === 1 && startPlace.value) list.push(startPlace.value)
  if (route.terminus && day.index === route.dayCount && endPlace.value) list.push(endPlace.value)
  return list.filter((place) => place && Number.isFinite(place.lat))
})

const activeDayPathIds = computed(() => [
  ...activeHubPoints.value.map((hub) => hub.id),
  ...(activeDayData.value ? activeDayData.value.stops.map((stop) => stop.id) : []),
])

const wallCompare = computed(() =>
  ['badaling', 'mutianyu'].map((id) => ({
    id,
    name: spotById[id].name,
    plans: wallPlans[id] || [],
  }))
)

const swapEnds = () => {
  const temp = startPlace.value
  startPlace.value = endPlace.value
  endPlace.value = temp
}

// 天 chip 上带一句摘要：长城日写「长城」，其余写「3 站」
const dayTitle = (day) => (day.isWallDay ? '长城' : `${day.stops.length} 站`)

const openSpot = (id) => {
  activeSpotId.value = activeSpotId.value === id ? '' : id
}
</script>
