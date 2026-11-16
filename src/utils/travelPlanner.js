// 路线规划算法
//
// 设计取舍（为什么不用「枚举所有排列取最优」）：
// 18 个景点全排列是 6.4e15 种，就算剪枝到片区级也有上万种组合，前端算不动也没法解释。
// 这里改成「先定框架、再排顺序」：
//   1. 长城独占一天（往返 2—5 小时，塞不下第二个景点）——这是硬约束，不是打分项
//   2. 城区按「顺路程度」排片区：把起点→终点的方向当主轴，片区在主轴上投影越靠前越先走，
//      离主轴越远扣分越多。这样「故宫 → 颐和园」不会先带你绕去东边的 798
//   3. 片区内部用最近邻 + 2-opt 排顺序，规模都在 5 个点以内，穷举都够
//   4. 三档方案不是同一份路线的疏密版，而是三个不同的景点集合：紧凑版砍掉偏离主轴的片区，
//      完整版才把绕路的片区加进来
//
// 输出是纯数据，不含任何 UI 文案，方便 scripts/check.mjs 直接断言。

import { travelSpots } from '../data/travel/spots.js'
import { travelAreas, areaById } from '../data/travel/areas.js'
import { legBetween, wallPlans } from '../data/travel/transit.js'
import { festivalDays, seasonOf } from '../data/travel/meta.js'

const spotById = travelSpots.reduce((map, spot) => {
  map[spot.id] = spot
  return map
}, {})

// 当天必须排第一 / 排最后的景点。
// 故宫只能午门进神武门出，且淡季 15:30 停止入馆，排在第一站才稳；
// 鸟巢水立方的看点是夜景，排在当天最后。
const DAY_ORDER = {
  'forbidden-city': 'first',
  'birds-nest': 'last',
}

// 三档强度：每日可用时长、出发时刻、允许补充的景点数
export const pacings = [
  {
    id: 'compact',
    name: '紧凑',
    desc: '只走必去和顺路的点，行程最短',
    dayStart: 9 * 60,
    // 8.5 小时：9:00 出发，17:30 收工。故宫这种 4 小时的硬骨头也要塞得下
    dayBudget: 8 * 60 + 30,
    extraLimit: 2,
  },
  {
    id: 'normal',
    name: '标准',
    desc: '必去加主要景点，每天 2—3 站',
    dayStart: 8 * 60 + 30,
    dayBudget: 9 * 60 + 30,
    extraLimit: 5,
  },
  {
    id: 'full',
    name: '完整',
    desc: '尽量多覆盖，愿意为绕路的片区多花半天',
    dayStart: 8 * 60,
    dayBudget: 10 * 60 + 30,
    extraLimit: 12,
  },
]

const LUNCH_MIN = 45
const WALL_IDS = ['badaling', 'mutianyu']
// 第二天的第一站从「住处」出发。住处未定，按城区任意位置到景点的平均接驳估算，
// 页面上明确标成「住处 → 第一站，按 30 分钟估算」，不假装这是精确值。
const LODGING_MIN = 30
// 长城日要赶早班车、也要避开上午的团队客，统一比城区日早一小时出发
const WALL_DAY_START = 7 * 60 + 30
const LODGING_FARE = 4

export const isWall = (spot) => Boolean(spot && spot.wall)

// 门票按淡季算：春节在 11 月 1 日—次年 3 月 31 日的淡季区间内
export const ticketOf = (spot, season = 'offPeak') => {
  if (!spot || !spot.ticket) return 0
  if (spot.ticket.free) return 0
  if (spot.ticket.pending) return 0
  if (season === 'offPeak' && typeof spot.ticket.offPeak === 'number') return spot.ticket.offPeak
  if (typeof spot.ticket.peak === 'number') return spot.ticket.peak
  return 0
}

const toClock = (minutes) => {
  const m = Math.max(0, Math.round(minutes))
  const hh = String(Math.floor(m / 60) % 24).padStart(2, '0')
  const mm = String(m % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

// 起点→终点的主轴：片区投影得分越低越靠前，垂距越大越扣分
const buildAxis = (start, end) => {
  const dx = (end.lng - start.lng) * 0.766 // 经度按纬度压缩，和地图投影口径一致
  const dy = end.lat - start.lat
  const len = Math.hypot(dx, dy) || 1e-6
  return {
    ax: dx / len,
    ay: dy / len,
    len,
    // 沿主轴的投影距离（度）
    along: (spot) => ((spot.lng - start.lng) * 0.766 * (dx / len) + (spot.lat - start.lat) * (dy / len)),
    // 到主轴的垂距（度），用来惩罚绕路
    off: (spot) =>
      Math.abs((spot.lng - start.lng) * 0.766 * (-dy / len) + (spot.lat - start.lat) * (dx / len)),
  }
}

// 片区在主轴上的位置：用片区内景点的平均值，比 anchor 更贴近实际点位
const areaScore = (areaId, axis) => {
  const members = travelSpots.filter((spot) => spot.area === areaId && !spot.remote)
  if (!members.length) return { along: 0, off: 0 }
  const along = members.reduce((sum, spot) => sum + axis.along(spot), 0) / members.length
  const off = members.reduce((sum, spot) => sum + axis.off(spot), 0) / members.length
  return { along, off }
}

// 最近邻：从 from 出发，每次挑通勤最短的下一站
const nearestOrder = (spots, from) => {
  const rest = [...spots]
  const ordered = []
  let cursor = from
  while (rest.length) {
    let best = 0
    let bestMin = Infinity
    rest.forEach((spot, index) => {
      const leg = legBetween(cursor, spot)
      // 通勤时间为主，停留时长作次要项，避免把 4 小时的故宫排在最后
      const cost = leg.minutes + spot.durationMin * 0.05
      if (cost < bestMin) {
        bestMin = cost
        best = index
      }
    })
    const next = rest.splice(best, 1)[0]
    ordered.push(next)
    cursor = next
  }
  return ordered
}

// 2-opt：总通勤时间还能不能更短，反复交换相邻两段直到不再改善
const twoOpt = (spots, from) => {
  if (spots.length < 3) return spots
  const cost = (list) => {
    let total = 0
    let cursor = from
    list.forEach((spot) => {
      total += legBetween(cursor, spot).minutes
      cursor = spot
    })
    return total
  }
  let best = [...spots]
  let bestCost = cost(best)
  let improved = true
  let guard = 0
  while (improved && guard < 30) {
    improved = false
    guard += 1
    for (let i = 0; i < best.length - 1; i += 1) {
      for (let j = i + 1; j < best.length; j += 1) {
        const next = [...best]
        const segment = next.slice(i, j + 1).reverse()
        next.splice(i, j - i + 1, ...segment)
        const nextCost = cost(next)
        if (nextCost < bestCost - 0.5) {
          best = next
          bestCost = nextCost
          improved = true
        }
      }
    }
  }
  return best
}

// 排序：先钉住「必须第一」的点，再对剩余做最近邻 + 2-opt，最后放「必须最后」的点。
// pinnedFirst / pinnedLast 是用户选的起点终点，优先级高于 DAY_ORDER。
const orderDay = (spots, entry, pinnedFirst, pinnedLast) => {
  if (spots.length <= 1) return spots
  let pool = spots
  const head = []
  const tail = []
  if (pinnedFirst) {
    pool = pool.filter((spot) => spot.id !== pinnedFirst.id)
    head.push(pinnedFirst)
  }
  if (pinnedLast && pinnedLast.id !== (pinnedFirst ? pinnedFirst.id : '')) {
    pool = pool.filter((spot) => spot.id !== pinnedLast.id)
    tail.push(pinnedLast)
  }
  const firsts = pool.filter((spot) => DAY_ORDER[spot.id] === 'first')
  const lasts = pool.filter((spot) => DAY_ORDER[spot.id] === 'last')
  const middle = pool.filter((spot) => !DAY_ORDER[spot.id])
  const orderedMiddle = twoOpt(nearestOrder(middle, entry), entry)
  return [...head, ...firsts, ...orderedMiddle, ...lasts, ...tail]
}

// 一天的时间线：逐站算到达 / 离开，中途补午餐
// 第一天的第一站是用户选的起点，不重复算通勤；
// 之后每天的第一站从住处出发，用 LODGING_MIN 固定估算，并在 legs 里标明。
const buildDay = (spots, entry, options) => {
  const { dayStart, date, fromLodging = false } = options
  const legs = []
  const stops = []
  let clock = dayStart
  let cursor = entry
  let lunchDone = false

  spots.forEach((spot, index) => {
    const leg =
      index === 0 && fromLodging
        ? { minutes: LODGING_MIN, fare: LODGING_FARE, mode: '住处出发', kind: 'estimate', via: '从住处到第一站，按城区平均接驳估算' }
        : legBetween(cursor, spot)
    const isEntry = index === 0 && cursor.id === spot.id && !fromLodging
    if (!isEntry) {
      clock += leg.minutes
      legs.push({
        fromId: index === 0 && fromLodging ? 'lodging' : cursor.id,
        fromName: index === 0 && fromLodging ? '住处' : cursor.name,
        toId: spot.id,
        toName: spot.name,
        minutes: leg.minutes,
        fare: leg.fare,
        mode: leg.mode,
        kind: leg.kind,
        via: leg.via,
      })
    }
    if (!lunchDone && clock >= 11 * 60 + 30 && !isEntry) {
      clock += LUNCH_MIN
      lunchDone = true
    }
    const arrive = clock
    clock += spot.durationMin
    stops.push({
      id: spot.id,
      name: spot.name,
      area: spot.area,
      arrive: toClock(arrive),
      leave: toClock(clock),
      arriveMin: arrive,
      leaveMin: clock,
      stayMin: spot.durationMin,
      ticket: ticketOf(spot),
      booking: Boolean(spot.booking && spot.booking.required),
      bookingChannel: spot.booking ? spot.booking.channel : '',
      bookingLeadDays: spot.booking ? spot.booking.leadDays : 0,
      must: Boolean(spot.must),
      tips: spot.tips ? spot.tips.slice(0, 1) : [],
      lastEntry: spot.hours ? spot.hours.lastEntryOffPeak || '' : '',
      closedWeekday: spot.hours && typeof spot.hours.closedWeekday === 'number' ? spot.hours.closedWeekday : null,
    })
    cursor = spot
  })

  const commuteMin = legs.reduce((sum, leg) => sum + leg.minutes, 0)
  const fare = legs.reduce((sum, leg) => sum + leg.fare, 0)
  const ticket = stops.reduce((sum, stop) => sum + stop.ticket, 0)
  const stayMin = stops.reduce((sum, stop) => sum + stop.stayMin, 0)

  return {
    date: date || '',
    stops,
    legs,
    commuteMin,
    stayMin,
    fare,
    ticket,
    startClock: toClock(dayStart),
    endClock: toClock(clock),
    spanMin: clock - dayStart,
    totalMin: commuteMin + stayMin + (lunchDone ? LUNCH_MIN : 0),
  }
}

// 长城日：不从某个景点串联过去，而是市区往返，所以单独构造
const buildWallDay = (wallSpot, planId, options) => {
  const plans = wallPlans[wallSpot.id] || []
  const plan = plans.find((item) => item.id === planId) || plans[0]
  const { dayStart } = options
  const outward = plan.minutes
  const stay = wallSpot.durationMin
  const arrive = dayStart + outward
  const leave = arrive + stay
  const back = leave + plan.minutes

  return {
    date: options.date || '',
    isWallDay: true,
    wallPlan: plan,
    stops: [
      {
        id: wallSpot.id,
        name: wallSpot.name,
        area: wallSpot.area,
        arrive: toClock(arrive),
        leave: toClock(leave),
        arriveMin: arrive,
        leaveMin: leave,
        stayMin: stay,
        ticket: ticketOf(wallSpot),
        booking: Boolean(wallSpot.booking && wallSpot.booking.required),
        bookingChannel: wallSpot.booking ? wallSpot.booking.channel : '',
        bookingLeadDays: wallSpot.booking ? wallSpot.booking.leadDays : 0,
        must: Boolean(wallSpot.must),
        tips: wallSpot.tips ? wallSpot.tips.slice(0, 1) : [],
        lastEntry: '',
        closedWeekday: null,
      },
    ],
    legs: [
      {
        fromId: 'lodging',
        fromName: '住处',
        toId: wallSpot.id,
        toName: wallSpot.name,
        minutes: outward,
        fare: Math.round(plan.roundTripFare / 2),
        mode: plan.mode,
        kind: 'estimate',
        via: `${plan.from} 出发`,
      },
      {
        fromId: wallSpot.id,
        fromName: wallSpot.name,
        toId: 'lodging',
        toName: '住处',
        minutes: plan.minutes,
        fare: plan.roundTripFare - Math.round(plan.roundTripFare / 2),
        mode: plan.mode,
        kind: 'estimate',
        via: '原路返程',
      },
    ],
    commuteMin: plan.minutes * 2,
    stayMin: stay,
    fare: plan.roundTripFare,
    ticket: ticketOf(wallSpot),
    startClock: toClock(dayStart),
    endClock: toClock(back),
    spanMin: back - dayStart,
    totalMin: plan.minutes * 2 + stay,
  }
}

// 把「天 → 景点数组」转成完整的方案对象，并检查是否超时
const finalizeDays = (dayPlans, entry, pacing, endPin = null, keepOrder = false) => {
  let cityIndex = 0
  const days = dayPlans.map((plan, index) => {
    let day
    if (plan.wallSpot) {
      day = buildWallDay(plan.wallSpot, plan.planId, { dayStart: WALL_DAY_START, date: plan.date })
    } else {
      // 每天内部先定顺序：用户选的起点钉在第一天最前，终点钉在最后一天最后。
      // 起点本身是长城时不能钉——长城单独成日，钉进城区日会重复出现一次。
      const isFirstCityDay = cityIndex === 0
      const isLastCityDay = !dayPlans.slice(index + 1).some((item) => !item.wallSpot)
      const ordered = keepOrder
        ? plan.spots
        : orderDay(
            plan.spots,
            entry,
            isFirstCityDay && !isWall(entry) ? entry : null,
            isLastCityDay ? endPin : null
          )
      day = buildDay(ordered, entry, {
        dayStart: pacing.dayStart,
        date: plan.date,
        // 第一个城区日的第一站就是用户选的起点时不算接驳；其余情况（含起点是长城）都从住处出发
        fromLodging: cityIndex > 0 || isWall(entry),
      })
      cityIndex += 1
    }
    day.index = index + 1
    day.overBy = Math.max(0, day.totalMin - pacing.dayBudget)
    // 当天还剩多少余量：页面用它提示「这天下午还有 2 小时可以自由安排」
    day.slackMin = Math.max(0, pacing.dayBudget - day.spanMin)
    return day
  })

  const totalSpots = days.reduce((sum, day) => sum + day.stops.length, 0)
  const totalFare = days.reduce((sum, day) => sum + day.fare, 0)
  const totalTicket = days.reduce((sum, day) => sum + day.ticket, 0)
  const totalMinutes = days.reduce((sum, day) => sum + day.spanMin, 0)

  return {
    days,
    dayCount: days.length,
    totalSpots,
    totalFare,
    totalTicket,
    totalCost: totalFare + totalTicket,
    totalMinutes,
    overDays: days.filter((day) => day.overBy > 0).map((day) => day.index),
  }
}

// 三档各自的候选集合：紧凑只留主轴附近的，完整才允许绕路
const pickExtras = (candidates, axis, limit, start, end) => {
  const scored = candidates
    .map((spot) => {
      const along = axis.along(spot)
      const off = axis.off(spot)
      // 沿主轴靠后的点优先（顺路），垂距越大扣分越多；离起点终点太近的不加分
      const score = along * 100 - off * 260 - legBetween(start, spot).minutes * 0.6
      return { spot, score, off }
    })
    .sort((a, b) => b.score - a.score)

  const picked = []
  const areaUsed = {}
  for (const item of scored) {
    if (picked.length >= limit) break
    // 同一片区最多补 2 个，避免一天变成「故宫片区专场」把别的片区挤掉
    if ((areaUsed[item.spot.area] || 0) >= 2) continue
    areaUsed[item.spot.area] = (areaUsed[item.spot.area] || 0) + 1
    picked.push(item.spot)
  }
  return picked
}

// 把景点按「沿主轴的先后」排序后装箱成天。
//
// 为什么不是「一个片区一天」：片区大小差太多 —— 故宫片 6 个点塞不下一天，
// 朝阳片只有 798 一个点却要独占一天，会造成「上午 11 点就结束」的空转。
// 真正的约束是当天可用时长，片区只用来决定先后顺序（少折返）。
// spots 里不含起点终点：起点终点由调用方钉进首尾，
// 装箱时只给第一天预留起点的时长，避免「起点插进去就超预算」。
const clusterDays = (spots, axis, pacing, start) => {
  // 先定片区先后（沿主轴），再在每个片区内部用最近邻串成一条链。
  // 不能按时长降序排：那样会出现「故宫 → 北海 → 景山」这种回头路，
  // 而景山明明就在故宫北门正对面。
  const areaOrder = [...new Set(spots.map((spot) => spot.area))].sort(
    (a, b) => areaScore(a, axis).along - areaScore(b, axis).along
  )

  const sorted = []
  let cursor = start
  areaOrder.forEach((areaId) => {
    const members = spots.filter((spot) => spot.area === areaId)
    const head = members.filter((spot) => DAY_ORDER[spot.id] === 'first')
    const rest = members.filter((spot) => DAY_ORDER[spot.id] !== 'first')
    const ordered = [...head, ...nearestOrder(rest, head.length ? head[head.length - 1] : cursor)]
    sorted.push(...ordered)
    cursor = ordered[ordered.length - 1]
  })

  const days = []
  let current = []
  let currentMin = 0
  let currentArea = ''

  // 第一天还要塞起点，容量提前扣掉起点时长
  const capacityOf = (dayIndex) => {
    let cap = pacing.dayBudget - LUNCH_MIN
    if (dayIndex === 0 && start) cap -= start.durationMin + 20
    return cap
  }

  sorted.forEach((spot) => {
    const leg = current.length ? legBetween(current[current.length - 1], spot).minutes : 20
    const cost = spot.durationMin + leg
    // 阈值是「当天预算减去午餐」：午餐必然要吃掉 45 分钟，不预先扣掉就会排出一整天没吃饭的行程。
    if (current.length && currentMin + cost > capacityOf(days.length)) {
      days.push({ spots: current, areaId: currentArea, usedMin: currentMin })
      current = []
      currentMin = 0
      currentArea = ''
    }
    current.push(spot)
    currentMin += cost
    currentArea = currentArea || spot.area
  })
  if (current.length) days.push({ spots: current, areaId: currentArea, usedMin: currentMin })

  return days
}

// 周一闭馆：交换天序，只做一轮，不追求全局最优（春节窗口只有 9 天，实际问题很少）
const WEEK_CHAR = ['日', '一', '二', '三', '四', '五', '六']

const weekdayIndex = (date) => {
  const festival = festivalDays.find((day) => day.date === date)
  if (festival) return festival.weekdayIndex
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.getDay()
}

// 交换两天的行程内容，但各自保留原日期。
// 不能交换日期本身 —— 那会让「第 2 天 2/8、第 3 天 2/7」日期倒流，看起来像排错了。
const swapDayContent = (a, b) => {
  const keepA = { date: a.date, weekday: a.weekday, label: a.label, index: a.index }
  const keepB = { date: b.date, weekday: b.weekday, label: b.label, index: b.index }
  const contentA = { ...a }
  const contentB = { ...b }
  ;['date', 'weekday', 'label', 'index'].forEach((key) => {
    delete contentA[key]
    delete contentB[key]
  })
  Object.keys(a).forEach((key) => delete a[key])
  Object.keys(b).forEach((key) => delete b[key])
  Object.assign(a, contentB, keepA)
  Object.assign(b, contentA, keepB)
}

const avoidClosedDays = (days) => {
  const warnings = []

  for (let i = 0; i < days.length; i += 1) {
    const day = days[i]
    if (!day.date) continue
    const weekday = weekdayIndex(day.date)
    const closed = day.stops.find((stop) => stop.closedWeekday !== null && stop.closedWeekday === weekday)
    if (!closed) continue

    // 找一天可以换：换完之后两天的日期上都不能碰到闭馆景点
    const target = days.findIndex((other, index) => {
      if (index === i || !other.date) return false
      // 换完之后，这一天会拿到 other 的行程
      const selfOkAfterSwap = other.stops.every(
        (stop) => stop.closedWeekday === null || stop.closedWeekday !== weekday
      )
      // other 那天会拿到本来的行程
      const otherWeekday = weekdayIndex(other.date)
      const otherOkAfterSwap = day.stops.every(
        (stop) => stop.closedWeekday === null || stop.closedWeekday !== otherWeekday
      )
      return selfOkAfterSwap && otherOkAfterSwap
    })

    if (target >= 0) {
      swapDayContent(day, days[target])
      const nowGoing = day.stops.map((stop) => stop.name).join('、')
      warnings.push({
        level: 'info',
        text: `${closed.name} 周一闭馆，已与第 ${target + 1} 天对调行程：第 ${i + 1} 天改去 ${nowGoing}`,
      })
    } else {
      warnings.push({
        level: 'warn',
        text: `第 ${i + 1} 天是周${WEEK_CHAR[weekday]}，${closed.name} 当天闭馆，且没有可对调的日子 — 改出发日期，或把这站去掉`,
      })
    }
  }
  return warnings
}

// 停止入馆时间检查：故宫淡季 15:30 停止入馆，排到下午第三站就一定赶不上。
// 时间线里已经算了到达时刻，这里只负责把它变成一句人话。
const checkEntryDeadlines = (days) => {
  const warnings = []
  days.forEach((day) => {
    day.stops.forEach((stop) => {
      const spot = spotById[stop.id]
      const lastEntry = spot && spot.hours ? spot.hours.lastEntryOffPeak : ''
      if (!lastEntry) return
      const [hh, mm] = lastEntry.split(':').map(Number)
      // 留 1 小时余量：排队、安检、找入口都要时间
      const limit = hh * 60 + mm - 60
      if (stop.arriveMin > limit) {
        warnings.push({
          level: 'warn',
          text: `第 ${day.index} 天到 ${stop.name} 已经 ${stop.arrive}，${lastEntry} 停止入馆，这天赶不上 — 把它挪到当天第一站`,
        })
      }
    })
  })
  return warnings
}

// 主入口
export const planRoutes = (options = {}) => {
  const {
    startId,
    endId,
    startDate = '',
    wallId = 'auto',
    pacingId = 'normal',
  } = options

  const start = spotById[startId]
  const end = spotById[endId]
  if (!start || !end) return { error: '起终点不存在', routes: [] }
  if (start.id === end.id) return { error: '起点和终点不能是同一个景点', routes: [] }
  if (start.remote || end.remote) return { error: '古北水镇需要过夜，暂不纳入自动规划', routes: [] }

  const axis = buildAxis(start, end)

  // 长城选段：auto 时按「出城通勤时间 + 方向绕路成本」综合判断。
  // 不能只看垂距 —— 「前门 → 鸟巢」这条几乎正南北的路线，慕田峪经度更接近所以垂距更小，
  // 但它只能坐 916 快换乘（单程 150 分钟），八达岭有京张高铁（35 分钟）。
  // 通勤时间才是「靠近路线」的实际含义，方向只作为绕路惩罚。
  let wallSpot = null
  let wallNote = ''
  if (wallId === 'auto') {
    const candidates = WALL_IDS.map((id) => spotById[id]).filter(Boolean)
    if (start.wall) wallSpot = start
    else if (end.wall) wallSpot = end
    else {
      const wallScore = (spot) => {
        const plans = wallPlans[spot.id] || []
        const minutes = plans.length ? Math.min(...plans.map((plan) => plan.minutes)) : 120
        // 垂距换算成分钟：1 度约 111 公里，每公里绕路按 1.2 分钟计
        return minutes + axis.off(spot) * 111 * 1.2
      }
      wallSpot = candidates.sort((a, b) => wallScore(a) - wallScore(b))[0]
      const other = candidates.find((spot) => spot.id !== wallSpot.id)
      const fastPlan = (wallPlans[wallSpot.id] || [])[0]
      wallNote = `两段长城里选了 ${wallSpot.name}：出城最快只要 ${fastPlan.minutes} 分钟（${fastPlan.mode}），而 ${other.name} 单程要 ${(wallPlans[other.id] || [])[0].minutes} 分钟，方向也更容易顺路。`
    }
  } else {
    wallSpot = spotById[wallId] || null
  }

  // 必去：起点、终点、故宫、长城
  const palace = travelSpots.find((spot) => spot.id === 'forbidden-city')
  const must = [start, end, palace, wallSpot].filter(Boolean)
  const mustIds = new Set(must.map((spot) => spot.id))

  // 候选补充：排除必去、排除长城（单独占一天）、排除古北（需要过夜）
  const candidates = travelSpots.filter(
    (spot) => !mustIds.has(spot.id) && !spot.wall && !spot.remote
  )

  const routes = pacings.map((pacing) => {
    const extras = pickExtras(candidates, axis, pacing.extraLimit, start, end)

    // 中间点不含起点终点：它们由装箱结束后钉进首尾，
    // 否则「终点被装到第一天中间、后面还多出一天」这种错位没法靠排序修正。
    const middleSpots = [
      ...must.filter((spot) => !isWall(spot) && spot.id !== start.id && spot.id !== end.id),
      ...extras.filter((spot) => spot.id !== start.id && spot.id !== end.id),
    ]
    const uniqueMiddle = middleSpots.filter(
      (spot, index) => middleSpots.findIndex((item) => item.id === spot.id) === index
    )

    // 起点是长城时，城区日的入口不能拿长城当起点，否则第一段会算成「长城 → 市区」的长途通勤
    const cityEntry = isWall(start) ? uniqueMiddle[0] || null : start
    const cityDays = clusterDays(uniqueMiddle, axis, pacing, cityEntry)

    // 钉起点：第一天最前。起点本身是长城时不钉 —— 长城单独成日，钉进来会「故宫 + 八达岭」挤一天。
    if (!cityDays.length) cityDays.push({ spots: [], usedMin: 0 })
    if (!isWall(start)) cityDays[0].spots.unshift(start)

    // 钉终点：最后一天最后。装不下就给它单独一天，别硬塞成超时的一天
    if (!isWall(end)) {
      const last = cityDays[cityDays.length - 1]
      const leg = last.spots.length ? legBetween(last.spots[last.spots.length - 1], end).minutes : 20
      if (last.spots.length && (last.usedMin || 0) + end.durationMin + leg > pacing.dayBudget - LUNCH_MIN) {
        cityDays.push({ spots: [end], usedMin: end.durationMin })
      } else {
        last.spots.push(end)
      }
    }

    // 长城日插在哪：起点或终点是长城就放首尾，否则插在起点日之后、终点日之前。
    // 只有 1 个城区日时没有「中间」可插，就把这天拆成两天（起点一天、终点一天），
    // 否则长城日只能落到最后，终点就不在最后一天了。
    if (cityDays.length === 1 && wallSpot && !start.wall && !end.wall) {
      const only = cityDays[0]
      const spots = only.spots
      let acc = 0
      let split = 1
      const half = (only.usedMin || spots.reduce((sum, spot) => sum + spot.durationMin, 0)) / 2
      for (let i = 0; i < spots.length; i += 1) {
        acc += spots[i].durationMin
        if (acc >= half) {
          split = Math.min(i + 1, Math.max(1, spots.length - 1))
          break
        }
      }
      cityDays.splice(
        0,
        1,
        { spots: spots.slice(0, split), usedMin: 0 },
        { spots: spots.slice(split), usedMin: 0 }
      )
    }

    const dayPlans = cityDays.map((day) => ({ spots: day.spots }))
    const firstPlanOf = (id) => ((wallPlans[id] || [{}])[0] || {}).id

    if (start.wall && end.wall) {
      // 两段长城做首尾：开头去一段，结尾去另一段，中间走城区
      dayPlans.unshift({ wallSpot: start, planId: firstPlanOf(start.id) })
      dayPlans.push({ wallSpot: end, planId: firstPlanOf(end.id) })
    } else if (start.wall) {
      // 起点就是长城：第一天从长城日算起，把城市行程整体后移
      dayPlans.unshift({ wallSpot: start, planId: firstPlanOf(start.id) })
    } else if (end.wall) {
      dayPlans.push({ wallSpot: end, planId: firstPlanOf(end.id) })
    } else if (wallSpot) {
      const insertAt = Math.min(1, Math.max(0, dayPlans.length - 1))
      dayPlans.splice(insertAt, 0, { wallSpot, planId: firstPlanOf(wallSpot.id) })
    }

    // 起点在第一天要作为 entry，让第一站不重复计算通勤
    const route = finalizeDays(dayPlans, start, pacing, isWall(end) ? null : end)

    // 日期：从 startDate 起连续排
    if (startDate) {
      route.days.forEach((day, index) => {
        const base = new Date(`${startDate}T00:00:00`)
        base.setDate(base.getDate() + index)
        const iso = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(
          base.getDate()
        ).padStart(2, '0')}`
        day.date = iso
        const festival = festivalDays.find((item) => item.date === iso)
        day.weekday = festival ? festival.weekday : `周${['日', '一', '二', '三', '四', '五', '六'][base.getDay()]}`
        day.label = festival ? festival.label : ''
      })
    }

    const warnings = [
      ...(startDate ? avoidClosedDays(route.days) : []),
      ...checkEntryDeadlines(route.days),
    ]

    // 超过春节 9 天窗口就没法按连续日期排了
    if (startDate && route.dayCount > 9) {
      warnings.push({
        level: 'warn',
        text: `这套方案要 ${route.dayCount} 天，超过春节 9 天假期，需要砍掉几天或换成紧凑方案`,
      })
    }

    return {
      id: pacing.id,
      name: pacing.name,
      desc: pacing.desc,
      wall: wallSpot ? { id: wallSpot.id, name: wallSpot.name, plan: (wallPlans[wallSpot.id] || [{}])[0] } : null,
      ...route,
      warnings,
    }
  })

  return {
    routes,
    axis: {
      startId: start.id,
      endId: end.id,
      sameArea: start.area === end.area,
      distanceKm: Math.round(axis.len * 111),
    },
    wallNote,
    season: startDate ? seasonOf(startDate) : 'offPeak',
  }
}

// 给页面用的辅助：把一天的景点连成地图上的一条线
export const dayPathIds = (day) => day.stops.map((stop) => stop.id).filter((id) => spotById[id])

export const spotName = (id) => (spotById[id] ? spotById[id].name : '')
export const spotAreaName = (id) => {
  const spot = spotById[id]
  if (!spot) return ''
  const area = areaById[spot.area]
  return area ? area.name : ''
}

// 经典路线用：行程是手排的，不参与自动排序，只负责把时间线算出来
export const buildFixedPlan = (itinerary, pacingId = 'normal') => {
  const pacing = pacings.find((item) => item.id === pacingId) || pacings[1]
  const plans = itinerary.map((day) => {
    if (day.wallSpot) return { wallSpot: spotById[day.wallSpot], planId: day.wallPlan }
    return { spots: (day.spots || []).map((id) => spotById[id]).filter(Boolean) }
  })
  const firstCityDay = itinerary.find((day) => !day.wallSpot)
  const entrySpot = firstCityDay ? spotById[firstCityDay.spots[0]] : null
  return finalizeDays(plans, entrySpot, pacing, null, true)
}

export const planMeta = {
  totalSpots: travelSpots.filter((spot) => !spot.remote).length,
  areaCount: travelAreas.length,
}
