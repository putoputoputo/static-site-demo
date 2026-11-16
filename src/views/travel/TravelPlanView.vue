<template>
  <div class="travel plan-page">
    <section class="hero">
      <div class="hero-eyebrow">路线规划 · {{ travelMeta.city }} · 公共交通</div>
      <h1>选起点和终点，排出怎么走</h1>
      <p class="hero-lead">
        起点和终点都是景点：从你选的地方出发，沿路把必去的故宫和长城串进去，最后落在你选的终点。
        每天几点到、下一段坐什么、大概花多少钱，都在下面。长城单独占一天，因为往返就要 2—5 小时，塞不下第二个景点。
      </p>
      <div class="hero-meta">
        <span>{{ planMeta.totalSpots }} 个可规划景点（古北水镇要过夜，未纳入）</span>
        <span>长城自动选更顺的一段</span>
        <span>三档方案：紧凑 / 标准 / 完整</span>
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">起终点</h2>
      <p class="panel-sub">
        住处到第一天第一站、最后一天终点回住处这两段不算在路线里（你还没定住哪）；第二天起的第一站按「从住处出发 30 分钟」估。
      </p>

      <div class="planner-grid">
        <label class="field">
          <span class="field-label">起点</span>
          <select v-model="startId" class="field-input">
            <optgroup v-for="group in spotOptions" :key="group.id" :label="group.name">
              <option v-for="spot in group.items" :key="spot.id" :value="spot.id">{{ spot.name }}</option>
            </optgroup>
          </select>
        </label>

        <label class="field">
          <span class="field-label">终点</span>
          <select v-model="endId" class="field-input">
            <optgroup v-for="group in spotOptions" :key="group.id" :label="group.name">
              <option v-for="spot in group.items" :key="spot.id" :value="spot.id">{{ spot.name }}</option>
            </optgroup>
          </select>
        </label>

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
import { travelSpots } from '../../data/travel/spots'
import { travelAreas } from '../../data/travel/areas'
import { travelMeta, festivalDays } from '../../data/travel/meta'
import { wallPlans, transitMeta } from '../../data/travel/transit'
import { planRoutes, planMeta } from '../../utils/travelPlanner'
import './travel.css'

const route = useRoute()
const router = useRouter()

// 起点终点写进 URL，刷新不丢、也能直接把链接发给自己
const startId = ref(route.query.from || 'forbidden-city')
const endId = ref(route.query.to || 'summer-palace')
const startDate = ref(route.query.date || '')
const wallChoice = ref(route.query.wall || 'auto')
const activePaceId = ref('normal')
const activeDay = ref(1)
const activeSpotId = ref('')

const spotOptions = computed(() =>
  travelAreas
    .map((area) => ({
      id: area.id,
      name: area.name,
      items: travelSpots.filter((spot) => spot.area === area.id && !spot.remote),
    }))
    .filter((group) => group.items.length)
)

const result = computed(() =>
  planRoutes({
    startId: startId.value,
    endId: endId.value,
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

watch([startId, endId, startDate, wallChoice], () => {
  activeDay.value = 1
  activeSpotId.value = ''
  router.replace({
    query: {
      ...(startId.value !== 'forbidden-city' ? { from: startId.value } : {}),
      ...(endId.value !== 'summer-palace' ? { to: endId.value } : {}),
      ...(startDate.value ? { date: startDate.value } : {}),
      ...(wallChoice.value !== 'auto' ? { wall: wallChoice.value } : {}),
    },
  })
})

const spotById = travelSpots.reduce((map, spot) => {
  map[spot.id] = spot
  return map
}, {})

const activeDayData = computed(() => {
  if (!activeRoute.value) return null
  return activeRoute.value.days.find((day) => day.index === activeDay.value) || activeRoute.value.days[0]
})

const activeDayPathIds = computed(() => (activeDayData.value ? activeDayData.value.stops.map((stop) => stop.id) : []))

const wallCompare = computed(() =>
  ['badaling', 'mutianyu'].map((id) => ({
    id,
    name: spotById[id].name,
    plans: wallPlans[id] || [],
  }))
)

const swapEnds = () => {
  const temp = startId.value
  startId.value = endId.value
  endId.value = temp
}

// 天 chip 上带一句摘要：长城日写「长城」，其余写「3 站」
const dayTitle = (day) => (day.isWallDay ? '长城' : `${day.stops.length} 站`)

const openSpot = (id) => {
  activeSpotId.value = activeSpotId.value === id ? '' : id
}
</script>
