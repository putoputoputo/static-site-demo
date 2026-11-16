<template>
  <div class="travel-map">
    <svg :viewBox="`0 0 ${W} ${H}`" class="map-svg" role="img" aria-label="北京景点分布示意图">
      <!-- 背景 -->
      <rect :width="W" :height="H" rx="10" class="map-bg" />

      <!-- 经纬网格：让人知道这是有比例的依据，而不是随手摆的点 -->
      <g class="map-grid">
        <line v-for="g in gridLines" :key="g.key" :x1="g.x1" :y1="g.y1" :x2="g.x2" :y2="g.y2" />
      </g>

      <!-- 中轴线：北京城的参照物，也是故宫片的视觉主轴 -->
      <line
        :x1="axis.x"
        :y1="axis.y1"
        :x2="axis.x"
        :y2="axis.y2"
        class="map-axis"
      />
      <text :x="axis.x + 6" :y="axis.y1 + 12" class="map-axis-label">中轴线</text>

      <!-- 片区色块：让「哪几个点是一堆的」一眼可见 -->
      <g>
        <circle
          v-for="bubble in areaBubbles"
          :key="bubble.id"
          :cx="bubble.x"
          :cy="bubble.y"
          :r="bubble.r"
          :fill="bubble.color"
          fill-opacity="0.1"
          :stroke="bubble.color"
          stroke-opacity="0.28"
          stroke-dasharray="3 4"
        />
        <text
          v-for="bubble in areaBubbles"
          :key="`${bubble.id}-label`"
          :x="bubble.labelX"
          :y="bubble.labelY"
          text-anchor="start"
          class="map-area-label"
          :fill="bubble.color"
        >
          {{ bubble.name }}
        </text>
      </g>

      <!-- 选中路线的连线：按顺序连折线，箭头交给序号表达 -->
      <polyline v-if="pathPoints.length > 1" :points="pathAttr" class="map-path-halo" />
      <polyline v-if="pathPoints.length > 1" :points="pathAttr" class="map-path" />

      <!-- 城内点位 -->
      <g
        v-for="point in points"
        :key="point.id"
        class="map-point"
        :class="{ active: point.id === activeId, must: point.must }"
        @click="$emit('pick', point.id)"
      >
        <circle :cx="point.x" :cy="point.y" r="9" class="point-hit" />
        <circle :cx="point.x" :cy="point.y" :r="point.id === activeId ? 6 : 4.5" :fill="point.color" class="point-dot" />
        <circle
          v-if="point.must"
          :cx="point.x"
          :cy="point.y"
          r="10"
          fill="none"
          :stroke="point.color"
          stroke-opacity="0.55"
          stroke-width="1"
        />
        <text :x="point.x + point.dx" :y="point.y + point.dy" :text-anchor="point.anchor" class="map-label">
          {{ point.label }}
        </text>
        <title>{{ point.name }} · {{ point.areaName }}</title>
      </g>

      <!-- 交通枢纽：方形点，跟圆形的景点区分开 -->
      <g v-for="point in hubPoints" :key="point.id" class="map-hub">
        <rect :x="point.x - 4.5" :y="point.y - 4.5" width="9" height="9" rx="1.5" class="hub-box" />
        <text :x="point.x + point.dx" :y="point.y + point.dy" :text-anchor="point.anchor" class="map-label hub-label">
          {{ point.label }}
        </text>
        <title>{{ point.name }} · 交通枢纽</title>
      </g>

      <!-- 出城的两个长城点：画在边界外会挤坏城内布局，改用方向牌表示 -->
      <g v-for="exit in exits" :key="exit.id" class="map-exit" @click="$emit('pick', exit.id)">
        <rect :x="exit.x" :y="exit.y" :width="exit.w" height="34" rx="6" class="exit-box" />
        <text :x="exit.x + 10" :y="exit.y + 14" class="exit-name">{{ exit.name }}</text>
        <text :x="exit.x + 10" :y="exit.y + 27" class="exit-meta">{{ exit.meta }}</text>
      </g>

      <!-- 图例与指北针 -->
      <g class="map-legend">
        <line x1="32" y1="636" x2="32" y2="612" class="legend-arrow" />
        <polygon points="32,606 28,616 36,616" class="legend-arrow-head" />
        <text x="32" y="652" text-anchor="middle" class="legend-text">北</text>
        <line x1="52" y1="640" x2="200" y2="640" class="legend-scale" />
        <text x="126" y="654" text-anchor="middle" class="legend-text">5 公里</text>
      </g>
    </svg>

    <p class="map-note">
      示意图，非导航。点位按经纬度等比投影，方向与相对位置可信，距离以图例比例尺为准；八达岭与慕田峪距市区约 60 公里，画在城外方向牌上。
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { mapBounds, areaById } from '../../data/travel/areas'
import { mapLabelPos, mapShortName } from '../../data/travel/mapLabels'

const props = defineProps({
  spots: { type: Array, required: true },
  areas: { type: Array, required: true },
  // 选中的路线（景点 id 数组），为空时不画连线
  pathIds: { type: Array, default: () => [] },
  activeId: { type: String, default: '' },
  // 起终点是机场 / 火车站时传进来，会画成方形点位并参与折线
  hubs: { type: Array, default: () => [] },
})

defineEmits(['pick'])

const W = 760
const H = 700
const PAD = 34
// 北京在北纬 40 度附近，经度方向要乘 cos(40°)≈0.766 才不会被拉长
const COS_LAT = 0.766

const plotW = W - PAD * 2
const plotH = H - PAD * 2 - 40
const lonSpan = (mapBounds.maxLng - mapBounds.minLng) * COS_LAT
const latSpan = mapBounds.maxLat - mapBounds.minLat
const scale = Math.min(plotW / lonSpan, plotH / latSpan)
const offsetX = (W - lonSpan * scale) / 2
const offsetY = (H - 40 - latSpan * scale) / 2 + 8

const project = (lat, lng) => ({
  x: offsetX + (lng - mapBounds.minLng) * COS_LAT * scale,
  y: offsetY + (mapBounds.maxLat - lat) * scale,
})

const inBounds = (spot) =>
  !spot.remote &&
  spot.lat <= mapBounds.maxLat &&
  spot.lat >= mapBounds.minLat &&
  spot.lng >= mapBounds.minLng &&
  spot.lng <= mapBounds.maxLng

// 城中心点位太密（故宫片 6 个点挤在 20×40 像素内），标签位置只能手工排，
// 不做自动避让：自动算法在这么小的范围内反而更容易撞在一起。
// 具体偏移量在 data/travel/mapLabels.js，与排版自检脚本共用一份。

const points = computed(() =>
  props.spots
    .filter(inBounds)
    .map((spot) => {
      const { x, y } = project(spot.lat, spot.lng)
      const pos = mapLabelPos[spot.id] || { dx: 9, dy: 4, anchor: 'start' }
      const area = areaById[spot.area]
      return {
        id: spot.id,
        name: spot.name,
        label: mapShortName[spot.id] || spot.name,
        areaName: area ? area.name : '',
        color: area ? area.color : '#a8a292',
        must: Boolean(spot.must),
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        ...pos,
      }
    })
)

const areaBubbles = computed(() =>
  props.areas
    .map((area) => {
      const members = props.spots.filter((spot) => spot.area === area.id && inBounds(spot))
      if (!members.length) return null
      const center = project(area.anchor.lat, area.anchor.lng)
      // 半径覆盖到最远的成员，再加一点余量
      const farthest = Math.max(
        ...members.map((spot) => {
          const p = project(spot.lat, spot.lng)
          return Math.hypot(p.x - center.x, p.y - center.y)
        })
      )
      const r = Math.max(26, Math.round(farthest + 12))
      return {
        id: area.id,
        name: area.name,
        color: area.color,
        x: Math.round(center.x * 10) / 10,
        y: Math.round(center.y * 10) / 10,
        r,
        // 片区名放色块右侧中线：城区点位纵向很密，放正下方容易压到下一片区的点
        labelX: Math.round((center.x + r + 6) * 10) / 10,
        labelY: Math.round((center.y + 4) * 10) / 10,
      }
    })
    .filter(Boolean)
)

// 起终点可能是机场 / 火车站这类枢纽：单独画成方块，三角形方向牌那套留给长城
const hubPoints = computed(() =>
  props.hubs
    .filter((hub) => hub && !hub.remote)
    .map((hub) => {
      const { x, y } = project(hub.lat, hub.lng)
      const inside =
        hub.lat <= mapBounds.maxLat &&
        hub.lat >= mapBounds.minLat &&
        hub.lng >= mapBounds.minLng &&
        hub.lng <= mapBounds.maxLng
      return {
        id: hub.id,
        name: hub.name,
        label: hub.short || hub.name,
        isHub: true,
        inside,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        dx: 9,
        dy: 4,
        anchor: 'start',
      }
    })
    // 出界的（大兴机场在南六环外）不画点，交给方向牌那套逻辑也不合适，直接略过
    .filter((hub) => hub.inside)
)

const pointMap = computed(() =>
  [...points.value, ...hubPoints.value].reduce((map, point) => {
    map[point.id] = point
    return map
  }, {})
)

const pathPoints = computed(() => props.pathIds.map((id) => pointMap.value[id]).filter(Boolean))

const pathAttr = computed(() => pathPoints.value.map((point) => `${point.x},${point.y}`).join(' '))

const exits = computed(() => {
  const wall = props.spots.filter((spot) => spot.wall)
  return wall.map((spot, index) => {
    // 两块方向牌并排居中，避免全挤在左上角
    const width = 196
    const gap = 18
    const startX = (W - (width * 2 + gap)) / 2
    const x = startX + index * (width + gap)
    const km = Math.round(
      Math.hypot((spot.lat - 39.9163) * 111, (spot.lng - 116.3972) * 111 * COS_LAT)
    )
    const direction = spot.lng < 116.397 ? '西北' : '东北'
    return {
      id: spot.id,
      name: spot.name,
      meta: `${direction} · 直线约 ${km} 公里`,
      x,
      y: 24,
      w: width,
    }
  })
})

const axis = computed(() => {
  const top = project(39.945, 116.3972)
  const bottom = project(39.868, 116.3972)
  return { x: Math.round(top.x), y1: Math.round(top.y), y2: Math.round(bottom.y) }
})

const gridLines = computed(() => {
  const lines = []
  const startLng = Math.ceil(mapBounds.minLng / 0.05) * 0.05
  for (let lng = startLng; lng <= mapBounds.maxLng; lng += 0.05) {
    const top = project(mapBounds.maxLat, lng)
    const bottom = project(mapBounds.minLat, lng)
    lines.push({
      key: `lng-${lng.toFixed(2)}`,
      x1: Math.round(top.x),
      y1: Math.round(top.y),
      x2: Math.round(bottom.x),
      y2: Math.round(bottom.y),
    })
  }
  const startLat = Math.ceil(mapBounds.minLat / 0.05) * 0.05
  for (let lat = startLat; lat <= mapBounds.maxLat; lat += 0.05) {
    const left = project(lat, mapBounds.minLng)
    const right = project(lat, mapBounds.maxLng)
    lines.push({
      key: `lat-${lat.toFixed(2)}`,
      x1: Math.round(left.x),
      y1: Math.round(left.y),
      x2: Math.round(right.x),
      y2: Math.round(right.y),
    })
  }
  return lines
})
</script>

<style scoped>
.travel-map {
  margin: 16px 0 0;
}

.map-svg {
  display: block;
  width: 100%;
  height: auto;
}

.map-bg {
  fill: #121314;
}

.map-grid line {
  stroke: #23262a;
  stroke-width: 1;
}

.map-axis {
  stroke: color-mix(in srgb, var(--accent) 14%, transparent);
  stroke-width: 1;
  stroke-dasharray: 6 6;
}

.map-axis-label {
  font-size: 10px;
  fill: #5d5748;
}

.map-area-label {
  font-size: 10.5px;
  letter-spacing: 1px;
  opacity: 0.75;
}

.map-path {
  fill: none;
  stroke: #6f9e7a;
  stroke-width: 2;
  stroke-linejoin: round;
  pointer-events: none;
}

/* 底下再垫一层暗色描边，路径穿过片区色块时也能看清 */
.map-path-halo {
  fill: none;
  stroke: #0d0f10;
  stroke-width: 5;
  stroke-linejoin: round;
  opacity: 0.65;
  pointer-events: none;
}

.map-point {
  cursor: pointer;
}

.point-hit {
  fill: transparent;
}

.point-dot {
  transition: r 0.15s;
}

.map-point:hover .point-dot {
  r: 6;
}

.map-label {
  font-size: 10.5px;
  fill: #a8a292;
  pointer-events: none;
}

.map-point:hover .map-label,
.map-point.active .map-label {
  fill: #e5e3d8;
}

.map-point.must .map-label {
  fill: #d8c79a;
}

/* 机场 / 火车站：方形点，和圆形景点区分 */
.hub-box {
  fill: #6f9e7a;
  stroke: #0f1011;
  stroke-width: 1.4;
}

.hub-label {
  fill: #8fb79a;
}

.exit-box {
  fill: #191a1b;
  stroke: color-mix(in srgb, var(--accent) 14%, transparent);
}

.map-exit {
  cursor: pointer;
}

.map-exit:hover .exit-box {
  stroke: #b08a6a;
}

.exit-name {
  font-size: 11.5px;
  fill: #c8bda0;
}

.exit-meta {
  font-size: 10px;
  fill: #7a7565;
}

.legend-arrow {
  stroke: #5d5748;
  stroke-width: 1.4;
}

.legend-arrow-head {
  fill: #5d5748;
}

.legend-scale {
  stroke: color-mix(in srgb, var(--accent) 14%, transparent);
  stroke-width: 1.4;
}

.legend-text {
  font-size: 9.5px;
  fill: #6b6656;
}

.map-note {
  margin: 10px 0 0;
  font-size: 11.5px;
  line-height: 1.7;
  color: #6b6656;
}
</style>
