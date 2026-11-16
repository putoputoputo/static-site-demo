// 地图排版的数值自检
//
// 本机无头浏览器不可用（Chrome / Edge 的 --screenshot、--dump-dom 都返回空），
// 因此用坐标计算代替肉眼检查：点位是否越界、点与点是否重叠、标签是否互相压住、
// 片区标签是否落在点位圆内。投影常量与 TravelMap.vue 保持一致，改其一要同步另一处。
//
// 用法：node scripts/travel-map-report.mjs

import { travelSpots } from '../src/data/travel/spots.js'
import { travelAreas, mapBounds } from '../src/data/travel/areas.js'
import { mapLabelPos, mapShortName } from '../src/data/travel/mapLabels.js'

const W = 760
const H = 700
const PAD = 34
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

// 中文按 10.5px 宽估算，数字与拉丁字符按 6px
const textWidth = (text) =>
  [...text].reduce((sum, char) => sum + (/[\u4e00-\u9fff]/.test(char) ? 10.6 : 6), 0)

const points = travelSpots.filter(inBounds).map((spot) => {
  const { x, y } = project(spot.lat, spot.lng)
  const pos = mapLabelPos[spot.id] || { dx: 9, dy: 4, anchor: 'start' }
  const label = mapShortName[spot.id] || spot.name
  const width = textWidth(label)
  const textX = x + pos.dx
  const left = pos.anchor === 'end' ? textX - width : pos.anchor === 'middle' ? textX - width / 2 : textX
  return {
    id: spot.id,
    label,
    x,
    y,
    labelBox: { left, right: left + width, top: y + pos.dy - 9, bottom: y + pos.dy + 2 },
  }
})

const problems = []

const checkBounds = (label, box, kind) => {
  if (box.left < 6 || box.right > W - 6) {
    problems.push(`${kind}「${label}」横向越界：${box.left.toFixed(1)} — ${box.right.toFixed(1)}`)
  }
  if (box.top < 66 || box.bottom > H - 8) {
    problems.push(`${kind}「${label}」纵向越界：${box.top.toFixed(1)} — ${box.bottom.toFixed(1)}`)
  }
}

for (const point of points) {
  checkBounds(point.label, point.labelBox, '标签')
}

const intersects = (a, b) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

for (let i = 0; i < points.length; i += 1) {
  for (let j = i + 1; j < points.length; j += 1) {
    const a = points[i]
    const b = points[j]
    if (intersects(a.labelBox, b.labelBox)) {
      problems.push(`标签重叠：「${a.label}」与「${b.label}」`)
    }
    const distance = Math.hypot(a.x - b.x, a.y - b.y)
    if (distance < 9) {
      problems.push(`点位过近（${distance.toFixed(1)}px）：「${a.label}」与「${b.label}」`)
    }
  }
}

// 片区标签不能压在任意点位上（圆点半径 4.5，留 2px 余量）
for (const area of travelAreas) {
  const members = travelSpots.filter((spot) => spot.area === area.id && inBounds(spot))
  if (!members.length) continue
  const center = project(area.anchor.lat, area.anchor.lng)
  const farthest = Math.max(
    ...members.map((spot) => {
      const p = project(spot.lat, spot.lng)
      return Math.hypot(p.x - center.x, p.y - center.y)
    })
  )
  const r = Math.max(26, Math.round(farthest + 12))
  // 与组件一致：片区名放色块右侧中线
  const labelX = center.x + r + 6
  const labelY = center.y + 4
  const width = textWidth(area.name)
  const box = { left: labelX, right: labelX + width, top: labelY - 9, bottom: labelY + 2 }
  checkBounds(area.name, box, '片区名')
  for (const point of points) {
    if (intersects(box, { left: point.x - 6, right: point.x + 6, top: point.y - 6, bottom: point.y + 6 })) {
      problems.push(`片区名「${area.name}」压住点位「${point.label}」`)
    }
  }
}

console.log(`画布 ${W}×${H}，比例尺 ${scale.toFixed(0)} px/度，图上点位 ${points.length} 个`)
console.log('点位坐标：')
for (const point of points) {
  const col = /[\u4e00-\u9fff]/.test(point.label) ? '　' : ''
  console.log(`  ${col}${point.label.padEnd(6, '　')} x=${point.x.toFixed(1).padStart(5)} y=${point.y.toFixed(1).padStart(5)}`)
}
console.log(problems.length ? `\n发现 ${problems.length} 个问题：` : '\n没有发现越界或重叠。')
for (const line of problems) console.log('  -', line)
process.exitCode = problems.length ? 1 : 0
