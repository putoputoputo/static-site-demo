<template>
  <div class="travel">
    <section class="hero">
      <div class="hero-eyebrow">旅游 · {{ travelMeta.city }} · 公共交通</div>
      <h1>春节去北京</h1>
      <p class="hero-lead">
        必去故宫与长城，其余按片区就近串。18 个景点都标了门票、预约、闭馆与怎么去，
        数据核对于 {{ travelMeta.checkedAt }}——票价和开放时间会变，出发前请按每条详情页给的外链再核一次。
      </p>
      <div class="hero-meta">
        <span>{{ springFestival.days }} 天窗口</span>
        <span>{{ travelSpots.length }} 个景点</span>
        <span>{{ travelAreas.length }} 个片区</span>
        <span>地铁 / 公交 / 市郊铁路</span>
      </div>
    </section>

    <div class="festival">
      <span>{{ springFestival.label }}</span>
      <span class="festival-note">{{ springFestival.note }}</span>
    </div>

    <!-- 路线规划入口放首页第一屏：起终点自己选，直接跳进规划器 -->
    <section class="panel home-planner">
      <h2 class="panel-title">你从哪儿开始，到哪儿结束</h2>
      <p class="panel-sub">
        下面 {{ pickCount }} 个景点都能当出发地和目的地（古北水镇要过夜，没放进来）。选好点「排路线」，
        给你紧凑 / 标准 / 完整三套方案，每套都有逐日顺序、每段交通时长与当天花费。
      </p>

      <div class="planner-grid home-planner-grid">
        <label class="field">
          <span class="field-label">出发地</span>
          <select v-model="quickFrom" class="field-input">
            <optgroup v-for="group in spotOptions" :key="`from-${group.id}`" :label="group.name">
              <option v-for="spot in group.items" :key="spot.id" :value="spot.id">{{ spot.name }}</option>
            </optgroup>
          </select>
        </label>

        <label class="field">
          <span class="field-label">目的地</span>
          <select v-model="quickTo" class="field-input">
            <optgroup v-for="group in spotOptions" :key="`to-${group.id}`" :label="group.name">
              <option v-for="spot in group.items" :key="spot.id" :value="spot.id">{{ spot.name }}</option>
            </optgroup>
          </select>
        </label>

        <label class="field">
          <span class="field-label">出发日期</span>
          <select v-model="quickDate" class="field-input">
            <option value="">不指定（只排顺序）</option>
            <option v-for="day in festivalDays" :key="day.date" :value="day.date">
              {{ day.date }} {{ day.weekday }} · {{ day.label }}
            </option>
          </select>
        </label>

        <div class="field field-action">
          <button type="button" class="btn-link btn-go" @click="goPlan">排路线 →</button>
        </div>
      </div>

      <div class="home-planner-foot">
        <button type="button" class="btn-swap" @click="swapQuick">对调出发地和目的地</button>
        <RouterLink to="/travel/routes" class="home-planner-link">不想自己选，直接看三条经典路线</RouterLink>
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">景点分布</h2>
      <p class="panel-sub">
        点位按经纬度等比投影。虚线圈起的是片区，同一片区内的点步行或一两站地铁可达；八达岭与慕田峪在城外约 60 公里，用方向牌表示。点任意点位可进详情。
      </p>
      <TravelMap :spots="travelSpots" :areas="travelAreas" @pick="openSpot" />
    </section>

    <section class="must-grid">
      <RouterLink :to="`/travel/spots/${palace.id}`" class="must-card">
        <div class="must-kicker">必去 · 中轴核心</div>
        <h2 class="must-name">{{ palace.name }}</h2>
        <p class="must-desc">
          淡季 {{ palace.ticket.offPeak }} 元，提前 7 天 20:00 放票，每日限流 4 万人。午门进、神武门出，
          出来过条马路就是景山，正好接下一站。
        </p>
        <div class="tag-row">
          <span class="tag book">需预约</span>
          <span class="tag closed">周一闭馆</span>
          <span class="tag">建议 4 小时</span>
        </div>
      </RouterLink>

      <RouterLink :to="`/travel/spots/${wallMain.id}`" class="must-card">
        <div class="must-kicker">必去 · 单独占一天</div>
        <h2 class="must-name">长城（八达岭 / 慕田峪）</h2>
        <p class="must-desc">
          两段方向相反：八达岭在西北、有京张高铁直达；慕田峪在东北、人少但换乘久。
          路线交给算法按走向选更顺的一段，另一段在同页给对照。
        </p>
        <div class="tag-row">
          <span class="tag book">提前 10 天放票</span>
          <span class="tag">单程 1.5—2 小时</span>
          <span class="tag">建议 3 小时</span>
        </div>
      </RouterLink>
    </section>

    <section class="panel">
      <h2 class="panel-title">七个片区</h2>
      <p class="panel-sub">
        路线按片区串，不按单个景点硬连——同一片区内挪动比跨片区来回省一小时。点片区可筛出该片的景点。
      </p>
      <div class="area-grid">
        <RouterLink
          v-for="area in areaCards"
          :key="area.id"
          :to="{ path: '/travel/spots', query: { area: area.id } }"
          class="area-card"
        >
          <div class="area-head">
            <span class="area-name">{{ area.name }}</span>
            <span class="area-count">{{ area.count }} 个</span>
          </div>
          <p class="area-desc">{{ area.desc }}</p>
        </RouterLink>
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">春节要先弄明白的几件事</h2>
      <p class="panel-sub">标「已确认」的可以在官网原文查到；标「待公告」的要等 2027 年 1—2 月的官方通知，别按推测值订行程。</p>
      <ul class="notice-list">
        <li v-for="notice in festivalNotices" :key="notice.title" class="notice" :class="notice.level">
          <div class="notice-head">
            <span class="status" :class="notice.status">{{ notice.status === 'confirmed' ? '已确认' : '待公告' }}</span>
            <span>{{ notice.title }}</span>
          </div>
          <p class="notice-text">{{ notice.text }}</p>
        </li>
      </ul>
    </section>

    <section class="panel">
      <h2 class="panel-title">口径</h2>
      <ul class="bullet-list">
        <li v-for="line in travelMeta.scope" :key="line">{{ line }}</li>
      </ul>
    </section>

    <section class="next-step">
      <RouterLink to="/travel/spots" class="btn-link">看 18 个景点的门票与预约</RouterLink>
      <RouterLink to="/travel/plan" class="btn-link">选起点终点，排一条路线</RouterLink>
      <RouterLink to="/travel/routes" class="btn-link ghost">或者直接看三条经典路线</RouterLink>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import TravelMap from '../../components/travel/TravelMap.vue'
import { travelSpots } from '../../data/travel/spots'
import { travelAreas } from '../../data/travel/areas'
import { travelMeta, springFestival, festivalNotices, festivalDays } from '../../data/travel/meta'
import './travel.css'

const router = useRouter()

const palace = travelSpots.find((spot) => spot.must)
// 长城两张卡里挑八达岭作主入口，慕田峪从它的详情页与列表进
const wallMain = travelSpots.find((spot) => spot.id === 'badaling')

// 首页的起终点快选：默认故宫 → 颐和园，与规划器的默认值保持一致
const quickFrom = ref('forbidden-city')
const quickTo = ref('summer-palace')
const quickDate = ref('')

const spotOptions = computed(() =>
  travelAreas
    .map((area) => ({
      id: area.id,
      name: area.name,
      items: travelSpots.filter((spot) => spot.area === area.id && !spot.remote),
    }))
    .filter((group) => group.items.length)
)

const pickCount = computed(() => spotOptions.value.reduce((sum, group) => sum + group.items.length, 0))

const swapQuick = () => {
  const temp = quickFrom.value
  quickFrom.value = quickTo.value
  quickTo.value = temp
}

// 把选择直接带去规划器，规划器读 query 初始化，用户落地即可看到完整行程
const goPlan = () => {
  router.push({
    path: '/travel/plan',
    query: {
      from: quickFrom.value,
      to: quickTo.value,
      ...(quickDate.value ? { date: quickDate.value } : {}),
    },
  })
}

const areaCards = computed(() =>
  travelAreas.map((area) => ({
    ...area,
    count: travelSpots.filter((spot) => spot.area === area.id).length,
  }))
)

const openSpot = (id) => router.push(`/travel/spots/${id}`)
</script>
