<template>
  <div class="travel routes-page">
    <section class="hero">
      <div class="hero-eyebrow">经典路线 · {{ travelMeta.city }}</div>
      <h1>三条排好的路线，照着走</h1>
      <p class="hero-lead">
        不想自己研究就选这里：顺序、天数、哪天去长城都已经定好。
        通勤时间和门票按景点库里同一套数据算，不是拍脑袋写的数字。
        如果你有自己的起终点，去「路线规划」让算法现排。
      </p>
      <div class="hero-meta">
        <span v-for="item in classicRoutes" :key="item.id">{{ item.name }}</span>
      </div>
    </section>

    <div class="route-tabs">
      <button
        v-for="item in classicRoutes"
        :key="item.id"
        type="button"
        class="route-tab"
        :class="{ on: item.id === activeId }"
        @click="activeId = item.id"
      >
        <strong>{{ item.name }}</strong>
        <span>{{ item.tagline }}</span>
      </button>
    </div>

    <template v-if="active">
      <section class="panel">
        <h2 class="panel-title">{{ active.name }}</h2>
        <p class="panel-sub">{{ active.summary }}</p>

        <div class="plan-stats">
          <div class="stat">
            <strong>{{ plan.dayCount }}</strong>
            <span>天</span>
          </div>
          <div class="stat">
            <strong>{{ plan.totalSpots }}</strong>
            <span>个景点</span>
          </div>
          <div class="stat">
            <strong>{{ active.level }}</strong>
            <span>强度</span>
          </div>
          <div class="stat money">
            <strong>{{ plan.totalCost }}</strong>
            <span>元（门票 {{ plan.totalTicket }} + 交通 {{ plan.totalFare }}）</span>
          </div>
        </div>

        <p class="wall-note">适合：{{ active.bestFor }}</p>
      </section>

      <section class="panel">
        <h2 class="panel-title">这条路线在图上的走向</h2>
        <p class="panel-sub">点下面的天切换，地图会高亮那一天的顺序；点位颜色按片区区分。</p>

        <div class="day-chips">
          <button
            v-for="day in days"
            :key="`chip-${day.index}`"
            type="button"
            class="chip"
            :class="{ on: day.index === activeDay }"
            @click="activeDay = day.index"
          >
            第 {{ day.index }} 天
            <em>{{ day.isWallDay ? '长城' : day.title }}</em>
          </button>
        </div>

        <div class="plan-map-full">
          <TravelMap :spots="travelSpots" :areas="travelAreas" :path-ids="activeDayPathIds" :active-id="''" />
        </div>
      </section>

      <div class="plan-days">
        <PlanDay
          v-for="day in days"
          :key="day.index"
          :day="day"
          :active="day.index === activeDay"
          @pick="activeDay = $event"
        />
      </div>

      <section class="panel">
        <div class="route-extra">
          <h3>这条路线的小抄</h3>
          <ul class="bullet-list">
            <li v-for="tip in active.tips" :key="tip">{{ tip }}</li>
          </ul>
          <h3>故意没排进来的</h3>
          <ul class="bullet-list muted">
            <li v-for="item in active.skip" :key="item">{{ item }}</li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import TravelMap from '../../components/travel/TravelMap.vue'
import PlanDay from '../../components/travel/PlanDay.vue'
import { travelSpots } from '../../data/travel/spots'
import { travelAreas } from '../../data/travel/areas'
import { travelMeta } from '../../data/travel/meta'
import { classicRoutes } from '../../data/travel/routes'
import { buildFixedPlan } from '../../utils/travelPlanner'
import './travel.css'

const activeId = ref(classicRoutes[0].id)
const activeDay = ref(1)

// 换路线时天数可能变少，选中天要回到第一天，否则地图会指向不存在的那天
watch(activeId, () => {
  activeDay.value = 1
})

const active = computed(() => classicRoutes.find((item) => item.id === activeId.value) || classicRoutes[0])

const plan = computed(() => buildFixedPlan(active.value.itinerary))

// 手排的行程带「中轴核心」这类小标题，buildFixedPlan 只算时间线，标题在这里合进去
const days = computed(() =>
  plan.value.days.map((day, index) => ({
    ...day,
    title: active.value.itinerary[index] ? active.value.itinerary[index].title : '',
  }))
)

const activeDayPathIds = computed(() => {
  const day = days.value.find((item) => item.index === activeDay.value) || days.value[0]
  return day ? day.stops.map((stop) => stop.id) : []
})
</script>
