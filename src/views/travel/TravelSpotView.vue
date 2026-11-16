<template>
  <div class="travel">
    <template v-if="spot">
      <section class="detail-head">
        <RouterLink to="/travel/spots" class="back-link">← 回景点库</RouterLink>
        <h1 class="detail-title">{{ spot.name }}</h1>
        <p class="detail-place">
          {{ areaName }} · {{ spot.district }} · 建议停留 {{ durationText }}
          <a :href="amapUrl" target="_blank" rel="noopener noreferrer" class="amap-link inline">在高德地图查看位置 →</a>
        </p>
        <div class="detail-tags">
          <span v-if="spot.must" class="tag must">必去</span>
          <span v-if="spot.wall" class="tag must">长城 · 单独占一天</span>
          <span v-if="spot.remote" class="tag closed">远郊 · 建议过夜</span>
          <span v-if="spot.ticket.free" class="tag free">免费</span>
          <span v-if="spot.booking.required" class="tag book">需预约</span>
          <span v-if="spot.hours.closedWeekday != null" class="tag closed">周一闭馆</span>
          <span v-if="spot.pending" class="tag pending">部分信息待核实</span>
        </div>
      </section>

      <p v-if="spot.pending" class="pending-note">
        {{ spot.pendingNote || '票价与开放时间待官方页面复核' }}。以下内容仅供参考，出发前请按页面底部的官网链接确认。
      </p>

      <section class="panel">
        <h2 class="panel-title">条件</h2>
        <p class="panel-sub">这八行是出门前需要确认的全部内容，缺一项都可能白跑。</p>
        <div class="cond-table">
          <div class="cond-row">
            <span class="cond-key">门票</span>
            <span class="cond-val">{{ ticketText }}</span>
          </div>
          <div class="cond-row">
            <span class="cond-key">是否需预约</span>
            <span class="cond-val">
              <strong>{{ spot.booking.required ? '必须预约' : '不需要预约' }}</strong>
              <template v-if="spot.booking.required"> · {{ spot.booking.channel }}</template>
            </span>
          </div>
          <div class="cond-row">
            <span class="cond-key">提前多久</span>
            <span class="cond-val">{{ leadText }}</span>
          </div>
          <div class="cond-row">
            <span class="cond-key">开放时间</span>
            <span class="cond-val">{{ hoursText }}</span>
          </div>
          <div class="cond-row">
            <span class="cond-key">闭馆日</span>
            <span class="cond-val">{{ spot.hours.closed }}</span>
          </div>
          <div class="cond-row">
            <span class="cond-key">建议停留</span>
            <span class="cond-val">{{ durationText }}</span>
          </div>
          <div class="cond-row">
            <span class="cond-key">建议时段</span>
            <span class="cond-val">{{ spot.bestTime }}</span>
          </div>
          <div v-if="spot.entry" class="cond-row">
            <span class="cond-key">进出方式</span>
            <span class="cond-val">{{ spot.entry }}</span>
          </div>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">怎么去</h2>
        <p class="panel-sub">全部为公共交通，不含自驾。</p>
        <ul class="bullet-list">
          <li v-for="item in spot.access" :key="item.text">{{ item.text }}</li>
        </ul>
      </section>

      <section class="panel">
        <h2 class="panel-title">现场条件</h2>
        <p class="panel-sub">证件、安检、禁带物品这类容易漏的，都在这里。</p>
        <ul class="bullet-list">
          <li v-for="line in spot.conditions" :key="line">{{ line }}</li>
        </ul>
      </section>

      <section class="panel">
        <h2 class="panel-title">实用提示</h2>
        <ul class="bullet-list">
          <li v-for="line in spot.tips" :key="line">{{ line }}</li>
        </ul>
      </section>

      <section v-if="siblings.length" class="panel">
        <h2 class="panel-title">同片区可以连着走</h2>
        <p class="panel-sub">{{ areaName }}内还有其他 {{ siblings.length }} 个点，步行或一两站地铁可达。</p>
        <div class="spot-grid">
          <RouterLink v-for="item in siblings" :key="item.id" :to="`/travel/spots/${item.id}`" class="spot-card">
            <div class="spot-head">
              <span class="spot-name">{{ item.name }}</span>
              <span class="spot-price">{{ item.ticket.free ? '免费' : `${item.ticket.offPeak} 元` }}</span>
            </div>
            <p class="spot-meta">建议 {{ item.durationMin >= 60 ? item.durationMin / 60 + ' 小时' : item.durationMin + ' 分钟' }}</p>
          </RouterLink>
        </div>
      </section>

      <div class="source-box">
        数据来源：<a :href="spot.source.url" target="_blank" rel="noopener noreferrer">{{ spot.source.label }}</a>，
        核对日期 {{ spot.source.checkedAt }}。票价、开放时间与预约规则以官网当日公示为准。
      </div>

      <section class="next-step">
        <RouterLink to="/travel/spots" class="btn-link ghost">回景点库</RouterLink>
        <RouterLink to="/travel" class="btn-link ghost">回分布图</RouterLink>
        <RouterLink :to="{ path: '/travel/plan', query: { from: spot.id } }" class="btn-link">从这儿出发，排条路线</RouterLink>
      </section>
    </template>

    <p v-else class="empty">没有找到这个景点。</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { travelSpots, spotById, hasSeasonPrice } from '../../data/travel/spots'
import { areaById } from '../../data/travel/areas'
import { amapSpotUrl } from '../../utils/geo'
import './travel.css'

const route = useRoute()
const spot = computed(() => spotById[String(route.params.id)] || null)

const areaName = computed(() => (spot.value ? areaById[spot.value.area]?.name || '' : ''))

const amapUrl = computed(() => amapSpotUrl(spot.value))

const siblings = computed(() => {
  if (!spot.value) return []
  return travelSpots.filter((item) => item.area === spot.value.area && item.id !== spot.value.id)
})

const ticketText = computed(() => {
  if (!spot.value) return ''
  const ticket = spot.value.ticket
  if (ticket.free) return ticket.note || '免费'
  const parts = []
  parts.push(
    hasSeasonPrice(spot.value)
      ? `淡季 ${ticket.offPeak} 元 / 旺季 ${ticket.peak} 元`
      : `${ticket.offPeak} 元（不分淡旺季）`
  )
  if (ticket.extra && ticket.extra.length) {
    parts.push(
      ticket.extra
        .map((item) =>
          item.offPeakPrice
            ? `${item.name} 淡季 ${item.offPeakPrice} 元 / 旺季 ${item.price} 元`
            : `${item.name} ${item.price} 元`
        )
        .join('；')
    )
  }
  if (ticket.note) parts.push(ticket.note)
  return parts.join('。')
})

const leadText = computed(() => {
  if (!spot.value) return ''
  const booking = spot.value.booking
  if (!booking.required) return '无需预约，直接前往'
  const days = booking.leadDays > 0 ? `最早提前 ${booking.leadDays} 天` : '当天可约'
  return booking.note ? `${days}。${booking.note}` : days
})

const hoursText = computed(() => {
  if (!spot.value) return ''
  const hours = spot.value.hours
  const parts = []
  if (hours.peak && hours.offPeak && hours.peak !== hours.offPeak) {
    parts.push(`淡季 ${hours.offPeak}，旺季 ${hours.peak}`)
  } else {
    parts.push(hours.peak || hours.offPeak)
  }
  const last = hours.lastEntryOffPeak || hours.lastEntryPeak
  if (last) parts.push(`（${last} 停止入园）`)
  return parts.join('')
})

const durationText = computed(() => {
  if (!spot.value) return ''
  const minutes = spot.value.durationMin || 0
  if (minutes < 60) return `${minutes} 分钟`
  const hours = minutes / 60
  return Number.isInteger(hours) ? `${hours} 小时` : `${hours.toFixed(1)} 小时`
})
</script>
