// 北京景点片区
//
// 用途有两个：一是路线算法先按片区分组再排序（组合空间从 P(18,k) 降到 P(7,k)）；
// 二是 SVG 示意图按片区画淡色块，让人一眼看出「这几个点是一堆的」。
// anchor 是片区标签的落点，不是几何中心，手动调过避免标签压在点位上。

export const travelAreas = [
  {
    id: 'gugong',
    name: '故宫片',
    desc: '中轴线核心，步行可串联，一天塞得下三四个点',
    anchor: { lat: 39.913, lng: 116.397 },
    color: '#c9a961',
  },
  {
    id: 'shichahai',
    name: '什刹海片',
    desc: '胡同与寺庙，与故宫片步行或一站地铁可达',
    anchor: { lat: 39.944, lng: 116.405 },
    color: '#8fb08a',
  },
  {
    id: 'tiantan',
    name: '天坛片',
    desc: '城南单点，通常与故宫片拼一天',
    anchor: { lat: 39.882, lng: 116.407 },
    color: '#7fa3b8',
  },
  {
    id: 'yuanpu',
    name: '西北苑囿片',
    desc: '颐和园与圆明园相邻，地铁 4 号线两站，值得单占半天',
    anchor: { lat: 40.004, lng: 116.287 },
    color: '#6ea0be',
  },
  {
    id: 'changcheng',
    name: '长城片',
    desc: '八达岭在西北、慕田峪在东北，方向相反，必须单独占一天',
    anchor: { lat: 40.395, lng: 116.29 },
    color: '#b08a6a',
  },
  {
    id: 'aoti',
    name: '奥体片',
    desc: '鸟巢与森林公园，夜景比白天好看',
    anchor: { lat: 40.003, lng: 116.393 },
    color: '#9a8fb8',
  },
  {
    id: 'chaoyang',
    name: '朝阳片',
    desc: '798 单点，偏当代艺术，不看展可整片跳过',
    anchor: { lat: 39.984, lng: 116.495 },
    color: '#b8938a',
  },
]

export const areaById = travelAreas.reduce((map, area) => {
  map[area.id] = area
  return map
}, {})

// 地图只画城区：范围西到颐和园（116.27）、东到 798（116.50）、北到奥森（40.01）、南到天坛（39.88），
// 四边各留约 0.02 度余量。长城两点（八达岭 40.36 / 慕田峪 40.43）在范围外，
// 硬塞进来会把城区 15 个点压成一小团，改用方向牌表示。
// 古北水镇（40.66, 117.13）是 remote 条目，图上不画。
export const mapBounds = {
  minLat: 39.86,
  maxLat: 40.06,
  minLng: 116.24,
  maxLng: 116.52,
}
