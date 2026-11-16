<template>
  <div class="travel">
    <section class="hero">
      <div class="hero-eyebrow">旅游 · 景点库</div>
      <h1>18 个景点</h1>
      <p class="hero-lead">
        每个景点都写了门票、是否需预约、提前几天、开放与闭馆、怎么去，以及现场要注意的条件。
        数据核对于 {{ travelMeta.checkedAt }}，标「待核实」的条目请以官网为准。
      </p>
      <div class="hero-meta">
        <span>{{ travelAreas.length }} 个片区</span>
        <span>{{ mustCount }} 个必去</span>
        <span>{{ freeCount }} 个免费</span>
        <span>{{ bookCount }} 个需预约</span>
      </div>
    </section>

    <p v-if="stale" class="pending-note">
      数据已核对 {{ daysSinceCheck }} 天，票价与开放时间可能已变，出发前请按各详情页的官网外链复核。
    </p>

    <div class="filter-row">
      <button class="chip" :class="{ on: activeArea === 'all' }" @click="setArea('all')">全部片区</button>
      <button
        v-for="area in travelAreas"
        :key="area.id"
        class="chip"
        :class="{ on: activeArea === area.id }"
        @click="setArea(area.id)"
      >
        {{ area.name }}
      </button>
    </div>

    <div class="filter-row">
      <button class="chip" :class="{ on: activeFilter === 'all' }" @click="activeFilter = 'all'">不过滤</button>
      <button class="chip" :class="{ on: activeFilter === 'must' }" @click="activeFilter = 'must'">必去</button>
      <button class="chip" :class="{ on: activeFilter === 'free' }" @click="activeFilter = 'free'">免费</button>
      <button class="chip" :class="{ on: activeFilter === 'book' }" @click="activeFilter = 'book'">需预约</button>
      <button class="chip" :class="{ on: activeFilter === 'closed' }" @click="activeFilter = 'closed'">有闭馆日</button>
    </div>

    <div v-if="filtered.length" class="spot-grid">
      <RouterLink v-for="spot in filtered" :key="spot.id" :to="`/travel/spots/${spot.id}`" class="spot-card">
        <div class="spot-head">
          <span class="spot-name">{{ spot.name }}</span>
          <span class="spot-price">{{ priceText(spot) }}</span>
        </div>
        <p class="spot-meta">{{ areaById[spot.area]?.name }} · {{ spot.district }} · 建议 {{ durationText(spot) }}</p>
        <div class="tag-row">
          <span v-if="spot.must" class="tag must">必去</span>
          <span v-if="spot.wall" class="tag must">长城</span>
          <span v-if="spot.ticket.free" class="tag free">免费</span>
          <span v-if="spot.booking.required" class="tag book">需预约</span>
          <span v-if="spot.hours.closedWeekday != null" class="tag closed">周一闭馆</span>
          <span v-if="spot.pending" class="tag pending">票价待核实</span>
        </div>
      </RouterLink>
    </div>

    <p v-else class="empty">这个组合下没有景点，换一个筛选试试。</p>

    <section class="next-step">
      <RouterLink to="/travel" class="btn-link ghost">回分布图</RouterLink>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { travelSpots, hasSeasonPrice } from '../../data/travel/spots'
import { travelAreas, areaById } from '../../data/travel/areas'
import { travelMeta } from '../../data/travel/meta'
import './travel.css'

const route = useRoute()

const activeArea = ref(typeof route.query.area === 'string' ? route.query.area : 'all')
const activeFilter = ref('all')

const setArea = (area) => {
  activeArea.value = area
}

const mustCount = travelSpots.filter((spot) => spot.must || spot.wall).length
const freeCount = travelSpots.filter((spot) => spot.ticket.free).length
const bookCount = travelSpots.filter((spot) => spot.booking.required).length

const daysSinceCheck = Math.floor(
  (Date.now() - new Date(travelMeta.checkedAt).getTime()) / 86400000
)
const stale = daysSinceCheck > travelMeta.staleDays

const filtered = computed(() =>
  travelSpots.filter((spot) => {
    if (activeArea.value !== 'all' && spot.area !== activeArea.value) return false
    switch (activeFilter.value) {
      case 'must':
        return spot.must || spot.wall
      case 'free':
        return Boolean(spot.ticket.free)
      case 'book':
        return spot.booking.required
      case 'closed':
        return spot.hours.closedWeekday != null
      default:
        return true
    }
  })
)

// 春节在淡季，所以「淡季价」放前面；只有确实分淡旺季的景点才写两个价
const priceText = (spot) => {
  const ticket = spot.ticket
  if (ticket.free) return '免费'
  if (hasSeasonPrice(spot)) return `淡季 ${ticket.offPeak} / 旺季 ${ticket.peak} 元`
  return `${ticket.offPeak} 元`
}

const durationText = (spot) => {
  const minutes = spot.durationMin || 0
  if (minutes < 60) return `${minutes} 分钟`
  const hours = minutes / 60
  return Number.isInteger(hours) ? `${hours} 小时` : `${hours.toFixed(1)} 小时`
}
</script>
