<template>
  <article class="day-card" :class="{ on: active, wall: day.isWallDay, over: day.overBy > 0 }" @click="$emit('pick', day.index)">
    <header class="day-head">
      <div class="day-title">
        <span class="day-index">第 {{ day.index }} 天</span>
        <span v-if="day.title" class="day-date">{{ day.title }}</span>
        <span v-if="day.date" class="day-date">{{ day.date }} {{ day.weekday }} {{ day.label }}</span>
        <span v-if="day.isWallDay" class="day-badge wall">长城日 · 市区往返</span>
        <span v-else-if="day.overBy > 0" class="day-badge over">超出 {{ day.overBy }} 分钟</span>
      </div>
      <div class="day-meta">
        <span>{{ day.startClock }}—{{ day.endClock }}</span>
        <span>门票 {{ day.ticket }} 元</span>
        <span>交通 {{ day.fare }} 元</span>
        <span v-if="day.slackMin >= 60 && !day.isWallDay">余 {{ Math.floor(day.slackMin / 60) }} 小时</span>
        <a :href="amapUrl" target="_blank" rel="noopener noreferrer" class="amap-link" @click.stop>
          在高德地图看这一天 →
        </a>
      </div>
    </header>

    <p v-if="day.isWallDay && day.wallPlan" class="wall-plan-note">
      {{ day.wallPlan.mode }} · {{ day.wallPlan.from }} 出发，单程约 {{ day.wallPlan.minutes }} 分钟，往返
      {{ day.wallPlan.roundTripFare }} 元。{{ day.wallPlan.text }}
    </p>

    <ol class="timeline">
      <template v-for="stop in day.stops" :key="`${day.index}-${stop.id}`">
        <li v-if="legOf(stop)" class="leg">
          <span class="leg-time">{{ legOf(stop).minutes }} 分</span>
          <span class="leg-mode">{{ legOf(stop).mode }}</span>
          <span class="leg-via">{{ legOf(stop).via }}</span>
          <span class="leg-fare">{{ legOf(stop).fare ? `${legOf(stop).fare} 元` : '步行' }}</span>
        </li>
        <li class="stop">
          <span class="stop-clock">{{ stop.arrive }}<em>{{ stop.leave }}</em></span>
          <div class="stop-body">
            <div class="stop-head">
              <RouterLink :to="`/travel/spots/${stop.id}`" class="stop-name">{{ stop.name }}</RouterLink>
              <span class="stop-stay">{{ stop.stayMin }} 分</span>
              <span v-if="stop.ticket" class="stop-ticket">{{ stop.ticket }} 元</span>
              <span v-else class="stop-ticket free">免费</span>
              <span v-if="stop.booking" class="tag book">需预约</span>
              <span v-if="stop.must" class="tag must">必去</span>
            </div>
            <p v-if="stop.tips.length" class="stop-tip">{{ stop.tips[0] }}</p>
          </div>
        </li>
      </template>
    </ol>

    <p v-if="day.isWallDay" class="day-footnote">
      {{ day.stops[0].name }} 不在城区图上，图上用方向牌表示。按早上 7:30 出门算，下午两点前后就能回城，
      剩下的半天可以安排购物或休息，不要再加景点 —— 爬完长城腿是废的。
    </p>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { travelSpots } from '../../data/travel/spots'
import { amapDayUrl } from '../../utils/geo'

const props = defineProps({
  day: { type: Object, required: true },
  active: { type: Boolean, default: false },
})

defineEmits(['pick'])

const spotById = travelSpots.reduce((map, spot) => {
  map[spot.id] = spot
  return map
}, {})

const legOf = (stop) => props.day.legs.find((leg) => leg.toId === stop.id) || null

const amapUrl = computed(() => {
  const spots = props.day.stops.map((stop) => spotById[stop.id]).filter(Boolean)
  return amapDayUrl(spots)
})
</script>
