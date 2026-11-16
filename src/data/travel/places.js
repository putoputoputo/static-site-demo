// 起终点可选地点：景点 + 交通枢纽，合成一份给选择器用的扁平清单。
//
// 为什么要合成：页面上的「出发地 / 目的地」是同一个控件，
// 用户不该先想「这是景点还是车站」，然后去两个地方找。
// 分组只用于列表里的视觉分段，选中的是统一的 place id。

import { travelSpots } from './spots.js'
import { travelHubs } from './hubs.js'
import { areaById } from './areas.js'

// 古北水镇要过夜，不参与自动规划，也不进选择器
const pickableSpots = travelSpots.filter((spot) => !spot.remote)

const spotItems = pickableSpots.map((spot) => ({
  id: spot.id,
  name: spot.name,
  hint: areaById[spot.area] ? areaById[spot.area].name : '',
  group: 'spot',
  // 别名用于搜索：搜「紫禁城」也能找到故宫
  search: [spot.name, ...(spot.alias || [])].join(' '),
  lat: spot.lat,
  lng: spot.lng,
}))

const hubItems = travelHubs.map((hub) => ({
  id: hub.id,
  name: hub.name,
  hint: hub.mode === 'air' ? '机场' : hub.mode === 'bus' ? '公交枢纽' : '火车站',
  group: 'hub',
  search: [hub.name, hub.short || ''].join(' '),
  lat: hub.lat,
  lng: hub.lng,
}))

export const placeGroups = [
  { id: 'spot', label: '景点', items: spotItems },
  { id: 'hub', label: '交通枢纽 · 机场与火车站', items: hubItems },
]

export const allPlaces = [...spotItems, ...hubItems]

export const placeItemById = allPlaces.reduce((map, item) => {
  map[item.id] = item
  return map
}, {})

// 输入框联想：名字优先，再匹配别名；全角空格与大小写都归一
export const searchPlaces = (keyword, limit = 8) => {
  const q = String(keyword || '').trim().toLowerCase()
  if (!q) return allPlaces.slice(0, limit)
  const hits = allPlaces.filter((item) => item.search.toLowerCase().includes(q) || item.name.includes(q))
  // 以关键词开头的排前面，避免「天」把「天坛」排到「天安门」后面
  return hits
    .sort((a, b) => Number(b.name.startsWith(keyword)) - Number(a.name.startsWith(keyword)))
    .slice(0, limit)
}
