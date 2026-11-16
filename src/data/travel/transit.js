// 通勤数据：片区间怎么走、多久、多少钱
//
// 口径（重要，页面上的「估算」标签就是从这里来的）：
// - `kind: 'measured'` 表示距离来自北京市轨道交通官网的《路网车站站间距信息》，
//   分钟数按 583 米/分钟（约 35 km/h）运行 + 每站 30 秒停站 + 换乘 4 分钟 + 进出站候车 5 分钟算出来。
// - `kind: 'estimate'` 表示没有官方站间距，按直线距离 × 1.3 绕行系数估算，误差约 ±5 分钟。
//   这类一律在页面上标「估算」，不和 measured 混排成一个精确数字。
// - 票价按北京地铁现行里程计价规则（2014 年 12 月起执行）：
//   6 公里内 3 元，6—12 公里 4 元，12—22 公里 5 元，22—32 公里 6 元，32 公里以上每 20 公里加 1 元。
//   不含机场线、不含市郊铁路（S2 单独计价）。
// - 只做公共交通。自驾、打车、包车不在范围内。
//
// 8 号线是北京唯一把什刹海、故宫东、前门、天桥、奥体全串起来的南北干线，
// 所以城区大部分通勤都在它身上，数据也最准。

const CHECKED = '2026-11-16'

export const metroSource = {
  label: '北京市轨道交通 · 路网车站站间距信息（8 号线）',
  url: 'https://www.bjmoa.cn/metroLineList.html?sline=7',
  checkedAt: CHECKED,
}

// 北京地铁里程计价
export const metroFare = (meters) => {
  const km = meters / 1000
  if (km <= 6) return 3
  if (km <= 12) return 4
  if (km <= 22) return 5
  if (km <= 32) return 6
  return 6 + Math.ceil((km - 32) / 20)
}

// 按官方口径把距离换算成分钟：运行 + 停站 + 换乘 + 进出站
export const metroMinutes = (meters, stops, transfers = 0) =>
  Math.round(meters / 583 + stops * 0.5 + transfers * 4 + 5)

// ---------------------------------------------------------------------------
// 8 号线站间距（米），顺序自北向南，来源见 metroSource。
// 只保留本项目用得到的北段到南段，朱辛庄以北不涉及。
// ---------------------------------------------------------------------------
export const line8Segments = [
  ['森林公园南门', '奥林匹克公园', 1016],
  ['奥林匹克公园', '奥体中心', 1667],
  ['奥体中心', '北土城', 900],
  ['北土城', '安华桥', 1018],
  ['安华桥', '安德里北街', 1274],
  ['安德里北街', '鼓楼大街', 1083],
  ['鼓楼大街', '什刹海', 1188],
  ['什刹海', '南锣鼓巷', 902],
  ['南锣鼓巷', '中国美术馆', 1437],
  ['中国美术馆', '金鱼胡同', 873],
  ['金鱼胡同', '王府井', 762],
  ['王府井', '前门', 1857],
  ['前门', '珠市口', 1085],
  ['珠市口', '天桥', 881],
]

// 沿 8 号线从 a 站到 b 站的距离与站数
export const line8Trip = (from, to) => {
  const order = ['森林公园南门', '奥林匹克公园', '奥体中心', '北土城', '安华桥', '安德里北街', '鼓楼大街', '什刹海', '南锣鼓巷', '中国美术馆', '金鱼胡同', '王府井', '前门', '珠市口', '天桥']
  const i = order.indexOf(from)
  const j = order.indexOf(to)
  if (i < 0 || j < 0) return null
  const [lo, hi] = i < j ? [i, j] : [j, i]
  let meters = 0
  for (let k = lo; k < hi; k += 1) {
    const seg = line8Segments.find(
      ([x, y]) => (x === order[k] && y === order[k + 1]) || (y === order[k] && x === order[k + 1])
    )
    if (!seg) return null
    meters += seg[2]
  }
  return { meters, stops: hi - lo }
}

// 片区的「地铁门户站」：从片区出发实际会去哪个站坐车
export const areaHubs = {
  gugong: { station: '金鱼胡同', note: '8 号线，走到故宫午门约 1.1 公里；也可用 1 号线天安门东' },
  shichahai: { station: '什刹海', note: '8 号线，出站即什刹海；南锣鼓巷站与 6 号线换乘' },
  tiantan: { station: '天桥', note: '8 号线，到天坛西门约 900 米；天坛东门另有 5 号线' },
  aoti: { station: '奥体中心', note: '8 号线，到鸟巢约 800 米' },
  yuanpu: { station: '北宫门', note: '4 号线，出站即颐和园北宫门；圆明园用圆明园站' },
  chaoyang: { station: '将台', note: '14 号线，出站还要换公交或走 1.5 公里才到 798' },
}

// 沿 8 号线直达的片区对：距离、站数、文案里的站数都从站间距表推导，避免手写漂移
const l8 = (a, b, from, to, extra = {}) => {
  const trip = line8Trip(from, to)
  return {
    a,
    b,
    kind: 'measured',
    via: `8 号线 ${from} → ${to}，${trip.stops} 站`,
    distance: trip.meters,
    stops: trip.stops,
    transfers: 0,
    ...extra,
  }
}

// ---------------------------------------------------------------------------
// 片区间通勤。15 对（城内 6 片区两两），每对只写一次，读取用 areaTransit()。
// ---------------------------------------------------------------------------
const rawLinks = [
  // --- 8 号线直达，按官方站间距算 ---
  l8('gugong', 'shichahai', '金鱼胡同', '什刹海'),
  l8('gugong', 'tiantan', '金鱼胡同', '天桥'),
  l8('shichahai', 'tiantan', '什刹海', '天桥'),
  l8('shichahai', 'aoti', '什刹海', '奥体中心'),
  l8('gugong', 'aoti', '金鱼胡同', '奥体中心'),
  l8('tiantan', 'aoti', '天桥', '奥体中心', {
    note: '直达但绕行半个北城，11 站；实际赶时间可换 5 号线 + 10 号线，时间差不多',
  }),

  // --- 需换乘，距离按绕行估算 ---
  {
    a: 'gugong',
    b: 'yuanpu',
    kind: 'estimate',
    via: '1 号线天安门东 → 西单换 4 号线 → 北宫门',
    distance: 17200,
    stops: 14,
    transfers: 1,
    note: '颐和园在西北四环外，是全城最远的城内片区',
  },
  {
    a: 'shichahai',
    b: 'yuanpu',
    kind: 'estimate',
    via: '6 号线南锣鼓巷 → 平安里换 4 号线 → 北宫门',
    distance: 15600,
    stops: 13,
    transfers: 1,
  },
  {
    a: 'tiantan',
    b: 'yuanpu',
    kind: 'estimate',
    via: '5 号线天坛东门 → 磁器口换 7 号线 → 菜市口换 4 号线 → 北宫门',
    distance: 19800,
    stops: 16,
    transfers: 2,
    note: '两次换乘，是城内最费时的一对',
  },
  {
    a: 'aoti',
    b: 'yuanpu',
    kind: 'estimate',
    via: '8 号线奥体中心 → 北土城换 10 号线 → 海淀黄庄换 4 号线 → 北宫门',
    distance: 14300,
    stops: 12,
    transfers: 2,
  },
  {
    a: 'gugong',
    b: 'chaoyang',
    kind: 'estimate',
    via: '6 号线南锣鼓巷 → 金台路换 14 号线 → 将台，再换公交到 798',
    distance: 12600,
    stops: 10,
    transfers: 1,
    lastMile: { text: '将台站 → 798 艺术区，401 / 402 / 909 路约 15 分钟，或步行 1.5 公里', minutes: 15 },
  },
  {
    a: 'shichahai',
    b: 'chaoyang',
    kind: 'estimate',
    via: '6 号线南锣鼓巷 → 金台路换 14 号线 → 将台，再换公交到 798',
    distance: 12100,
    stops: 9,
    transfers: 1,
    lastMile: { text: '将台站 → 798 艺术区，401 / 402 / 909 路约 15 分钟，或步行 1.5 公里', minutes: 15 },
  },
  {
    a: 'tiantan',
    b: 'chaoyang',
    kind: 'estimate',
    via: '5 号线天坛东门 → 磁器口换 7 号线 → 九龙山换 14 号线 → 将台，再换公交',
    distance: 13400,
    stops: 11,
    transfers: 2,
    lastMile: { text: '将台站 → 798 艺术区，401 / 402 / 909 路约 15 分钟，或步行 1.5 公里', minutes: 15 },
  },
  {
    a: 'aoti',
    b: 'chaoyang',
    kind: 'estimate',
    via: '8 号线奥体中心 → 北土城换 10 号线 → 十里河方向换 14 号线 → 将台，再换公交',
    distance: 11800,
    stops: 10,
    transfers: 2,
    lastMile: { text: '将台站 → 798 艺术区，401 / 402 / 909 路约 15 分钟，或步行 1.5 公里', minutes: 15 },
  },
  {
    a: 'yuanpu',
    b: 'chaoyang',
    kind: 'estimate',
    via: '4 号线北宫门 → 海淀黄庄换 10 号线 → 十里河方向换 14 号线 → 将台，再换公交',
    distance: 23500,
    stops: 18,
    transfers: 2,
    note: '西北到东北横穿全城，实际很少这么排',
    lastMile: { text: '将台站 → 798 艺术区，401 / 402 / 909 路约 15 分钟，或步行 1.5 公里', minutes: 15 },
  },
]

const linkMinutes = (link) => {
  const base = metroMinutes(link.distance, link.stops, link.transfers)
  return base + (link.lastMile ? link.lastMile.minutes : 0)
}

export const areaLinks = rawLinks.map((link) => ({
  ...link,
  minutes: linkMinutes(link),
  fare: metroFare(link.distance),
}))

const linkIndex = areaLinks.reduce((map, link) => {
  const key = [link.a, link.b].sort().join('|')
  map[key] = link
  return map
}, {})

export const areaTransit = (areaA, areaB) => {
  if (areaA === areaB) return null
  return linkIndex[[areaA, areaB].sort().join('|')] || null
}

// ---------------------------------------------------------------------------
// 长城：出城交通。两段长城方向相反，都只能从市区出发当日往返，
// 所以路线算法把长城单独占一天，这里给出全天通勤的四种（八达岭）/两种（慕田峪）方案。
// ---------------------------------------------------------------------------
export const wallPlans = {
  badaling: [
    {
      id: 'hsr',
      mode: '京张高铁',
      from: '北京北站（西直门）/ 清河站',
      minutes: 35,
      fare: 29,
      roundTripFare: 58,
      text: '北京北站到八达岭长城站最快 26 分钟，出站有免费接驳车到登城口。全程最省时，但要提前在 12306 买票，春节票紧。',
      level: 'recommended',
    },
    {
      id: 's2',
      mode: '市郊铁路 S2 线',
      from: '黄土店站（地铁霍营站旁）',
      minutes: 80,
      fare: 7,
      roundTripFare: 14,
      text: '刷市政一卡通或亿通行进站，不对号入座。便宜、看沿途山景，但班次少，一天只有几趟，必须先对时刻表再定出发时间。',
      level: 'cheap',
    },
    {
      id: 'bus877',
      mode: '877 路公交',
      from: '德胜门箭楼',
      minutes: 105,
      fare: 12,
      roundTripFare: 24,
      text: '德胜门箭楼北侧发车，直达八达岭，刷卡半价。班次密、不用抢票，缺点是走京藏高速，春节可能堵在居庸关一段。',
      level: 'easy',
    },
    {
      id: 'bus919',
      mode: '919 路 / 880 路',
      from: '地铁积水潭站 / 昌平',
      minutes: 130,
      fare: 12,
      roundTripFare: 24,
      text: '站多、绕行城区，只在 877 排长队时的备选。不推荐作为首选。',
      level: 'backup',
    },
  ],
  mutianyu: [
    {
      id: 'bus916',
      mode: '916 快 + 怀柔区内公交',
      from: '东直门枢纽站',
      minutes: 150,
      fare: 20,
      roundTripFare: 40,
      text: '东直门乘 916 快 到怀柔，换 h23 / h24 / h35 / h36 到慕田峪环岛，再换景区摆渡车。换两次，全程约 2.5 小时。',
      level: 'recommended',
    },
    {
      id: 'tour',
      mode: '东直门旅游专线',
      from: '东直门',
      minutes: 120,
      fare: 30,
      roundTripFare: 60,
      text: '季节性开行，不是全年都有。出发前打电话或在公众号确认当年春节期间是否运营，没确认就当它不存在。',
      level: 'unconfirmed',
    },
  ],
}

// 长城日的时间预算：来回通勤 + 登城 + 吃饭
export const wallDayPlan = (wallId, planId) => {
  const plans = wallPlans[wallId] || []
  const plan = plans.find((item) => item.id === planId) || plans[0]
  if (!plan) return null
  return {
    plan,
    commuteMin: plan.minutes * 2,
    onSiteMin: 180,
    mealMin: 45,
    totalMin: plan.minutes * 2 + 180 + 45,
    fare: plan.roundTripFare,
  }
}

// ---------------------------------------------------------------------------
// 景点之间的实际通勤：同片区走距离，跨片区走上面的矩阵 + 两端接驳
// ---------------------------------------------------------------------------
const WALK_SPEED = 75 // 米/分钟，含红绿灯
const DETOUR = 1.3 // 直线到实际路径的绕行系数
const HUB_ACCESS = 6 // 景点 ↔ 地铁站的走行与进出站时间

export const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371000
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// 返回 { minutes, fare, mode, kind, via }
export const legBetween = (from, to) => {
  const straight = haversine(from.lat, from.lng, to.lat, to.lng)

  // 同片区：基本靠走。1.5 公里内步行，超过就坐一两站地铁
  if (from.area === to.area && !from.wall && !to.wall) {
    const walkMeters = straight * DETOUR
    if (walkMeters <= 1600) {
      return {
        minutes: Math.max(8, Math.round(walkMeters / WALK_SPEED)),
        fare: 0,
        mode: '步行',
        kind: 'estimate',
        via: `步行约 ${(walkMeters / 1000).toFixed(1)} 公里`,
      }
    }
    return {
      minutes: Math.round(walkMeters / WALK_SPEED * 0.6) + 8,
      fare: 3,
      mode: '公交 / 地铁',
      kind: 'estimate',
      via: `同片区 ${(straight / 1000).toFixed(1)} 公里，建议坐一两站`,
    }
  }

  // 长城不能从别的景点"顺路"过去，必须按独立的一天算，这里给一个提示性的值
  if (from.wall || to.wall) {
    const wallSpot = from.wall ? from : to
    const plan = (wallPlans[wallSpot.id] || [])[0]
    return {
      minutes: plan ? plan.minutes + HUB_ACCESS * 2 : 120,
      fare: plan ? plan.fare : 30,
      mode: plan ? plan.mode : '长途公交',
      kind: 'estimate',
      via: plan ? `${plan.from} 出发，约 ${plan.minutes} 分钟` : '出城交通',
    }
  }

  const link = areaTransit(from.area, to.area)
  if (!link) {
    // 片区不在矩阵里（理论上不该发生），退化到直线估算
    return {
      minutes: Math.round((straight * DETOUR) / WALK_SPEED),
      fare: 0,
      mode: '步行',
      kind: 'estimate',
      via: '直线距离估算',
    }
  }

  return {
    minutes: link.minutes + HUB_ACCESS * 2,
    fare: link.fare,
    mode: '地铁',
    kind: link.kind,
    via: link.via,
  }
}

// 用于页面展示的汇总口径
export const transitMeta = {
  checkedAt: CHECKED,
  checkedCount: areaLinks.filter((link) => link.kind === 'measured').length,
  totalCount: areaLinks.length,
  note: `城内 ${areaLinks.length} 对片区通勤里，${areaLinks.filter((link) => link.kind === 'measured').length} 对按 8 号线官方站间距算出，其余按直线距离乘 1.3 绕行系数估算，误差约 ±5 分钟。景点 ↔ 地铁站统一加 6 分钟走行与进出站。`,
}
