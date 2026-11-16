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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import TravelMap from '../../components/travel/TravelMap.vue'
import { travelSpots } from '../../data/travel/spots'
import { travelAreas } from '../../data/travel/areas'
import { travelMeta, springFestival, festivalNotices } from '../../data/travel/meta'
import './travel.css'

const router = useRouter()

const palace = travelSpots.find((spot) => spot.must)
// 长城两张卡里挑八达岭作主入口，慕田峪从它的详情页与列表进
const wallMain = travelSpots.find((spot) => spot.id === 'badaling')

const areaCards = computed(() =>
  travelAreas.map((area) => ({
    ...area,
    count: travelSpots.filter((spot) => spot.area === area.id).length,
  }))
)

const openSpot = (id) => router.push(`/travel/spots/${id}`)
</script>
