// 交通枢纽：允许把「机场 / 火车站 / 长城专线发车点」直接当成出发地或目的地。
//
// 为什么要单独一张表，而不是塞进 spots.js：
// - 枢纽没有门票、没有停留时长、没有预约，塞进景点库会污染「18 个景点」的计数与筛选；
// - 但它在路线里是合法端点：到这儿就算结束，从这儿出发就是一天的开始。
// 所以统一用一个 `isHub: true` 的标记，路线算法把它当锚点，不当景点。
//
// 口径：
// - 坐标 WGS-84，精度到百米，只用于算直线距离，不用于导航。
// - 到景区的耗时按「直线距离 × 绕行系数 ÷ 平均速度 + 进出站固定开销」估算，
//   全部标记为 `estimate`。机场加了机场线的提速（`speed`），rail 按地铁均速。
// - `buffer`：进出站、安检、等车的固定开销（分钟）。机场取 25（含行李与步行），
//   火车站取 8，公交发车点取 6。

const CHECKED = '2026-11-16'

const railSource = {
  label: '中国铁路 12306 车站信息',
  url: 'https://www.12306.cn',
  checkedAt: CHECKED,
}
const airSource = {
  label: '北京首都国际机场官网',
  url: 'https://www.bcia.com.cn',
  checkedAt: CHECKED,
}
const daxingSource = {
  label: '北京大兴国际机场官网',
  url: 'https://www.bdia.com.cn',
  checkedAt: CHECKED,
}

export const travelHubs = [
  {
    id: 'hub-beijing-south',
    name: '北京南站',
    short: '南站',
    isHub: true,
    mode: 'rail',
    lat: 39.8652,
    lng: 116.3786,
    area: 'tiantan',
    buffer: 8,
    note: '京沪、京津城际到站；4 号线、14 号线换乘，去天坛片最快',
    source: railSource,
  },
  {
    id: 'hub-beijing-west',
    name: '北京西站',
    short: '西站',
    isHub: true,
    mode: 'rail',
    lat: 39.8949,
    lng: 116.322,
    area: 'gugong',
    buffer: 8,
    note: '京广线到站；7 号线、9 号线换乘，去故宫片要换一次',
    source: railSource,
  },
  {
    id: 'hub-beijing-station',
    name: '北京站',
    short: '北京站',
    isHub: true,
    mode: 'rail',
    lat: 39.9029,
    lng: 116.4265,
    area: 'gugong',
    buffer: 8,
    note: '东北方向车次到站；2 号线环线，离故宫最近的老站',
    source: railSource,
  },
  {
    id: 'hub-chaoyang',
    name: '北京朝阳站',
    short: '朝阳站',
    isHub: true,
    mode: 'rail',
    lat: 39.9455,
    lng: 116.5103,
    area: 'aoti',
    buffer: 8,
    note: '京哈高铁到站；3 号线换乘，去 798 与奥体片最近',
    source: railSource,
  },
  {
    id: 'hub-qinghe',
    name: '清河站',
    short: '清河',
    isHub: true,
    mode: 'rail',
    lat: 40.0272,
    lng: 116.3296,
    area: 'xiyuan',
    buffer: 8,
    note: '京张高铁停靠；从这儿换 13 号线去颐和园方向',
    source: railSource,
  },
  {
    id: 'hub-capital-airport',
    name: '首都机场 T3',
    short: '首都机场',
    isHub: true,
    mode: 'air',
    lat: 40.0525,
    lng: 116.6103,
    area: 'aoti',
    buffer: 25,
    speed: 900,
    expressFare: 25,
    note: '机场线到东直门 25 元约 30 分钟，再换地铁进城',
    source: airSource,
  },
  {
    id: 'hub-daxing-airport',
    name: '大兴机场',
    short: '大兴机场',
    isHub: true,
    mode: 'air',
    lat: 39.5098,
    lng: 116.4106,
    area: 'tiantan',
    buffer: 25,
    speed: 900,
    expressFare: 35,
    note: '大兴机场线到草桥 35 元约 30 分钟；离城区约 46 公里，进出各留 1.5 小时',
    source: daxingSource,
  },
  {
    id: 'hub-deshengmen',
    name: '德胜门',
    short: '德胜门',
    isHub: true,
    mode: 'bus',
    lat: 39.9475,
    lng: 116.3791,
    area: 'shichahai',
    buffer: 6,
    note: '877 路八达岭专线发车点，12 元直达，早班 6:00 起',
    source: {
      label: '北京公交集团线路查询',
      url: 'https://www.bjbus.com',
      checkedAt: CHECKED,
    },
  },
  {
    id: 'hub-dongzhimen',
    name: '东直门',
    short: '东直门',
    isHub: true,
    mode: 'bus',
    lat: 39.9413,
    lng: 116.4345,
    area: 'shichahai',
    buffer: 6,
    note: '916 快换乘点，去慕田峪从这里上车',
    source: {
      label: '北京公交集团线路查询',
      url: 'https://www.bjbus.com',
      checkedAt: CHECKED,
    },
  },
]

export const hubById = travelHubs.reduce((map, hub) => {
  map[hub.id] = hub
  return map
}, {})

export const isHubId = (id) => Boolean(hubById[id])
