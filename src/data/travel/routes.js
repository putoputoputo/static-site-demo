// 三条经典路线
//
// 和「路线规划器」的区别：规划器是按你选的起终点现算，这里是手排好的固定行程 ——
// 顺序、天数、哪天去长城都已经定死，适合「不想研究，照着走」的人。
// 通勤时间与门票仍然由 buildFixedPlan 按同一套数据算出，不手写数字，避免和景点库漂移。

export const classicRoutes = [
  {
    id: 'axis-3d',
    name: '中轴 3 天',
    tagline: '第一次来北京，时间只有三天',
    days: 3,
    level: '紧凑',
    bestFor: '第一次来、带长辈小孩、假期只有三四天',
    summary:
      '只走中轴核心和长城，不走西北苑囿。每天 3 站以内，晚上都还有余力。故宫排第一天上午，是因为它 4 小时起步、15:30 就停止入馆，越往后拖越容易赶不上。',
    itinerary: [
      { day: 1, title: '中轴核心', spots: ['tiananmen-square', 'forbidden-city', 'jingshan-park'] },
      { day: 2, title: '南城与博物馆', spots: ['national-museum', 'qianmen', 'tiantan'] },
      { day: 3, title: '长城', wallSpot: 'badaling' },
    ],
    tips: [
      '天安门广场和故宫的门票不通用，要分开预约，广场还要单独约升旗时段',
      '故宫神武门出来正对景山南门，不用再坐车',
      '第三天长城回来约下午 3—4 点，还赶得上在市区吃顿好的',
    ],
    skip: ['颐和园、圆明园（太远，三天塞不下）', '什刹海、雍和宫（留着下次）'],
  },
  {
    id: 'depth-5d',
    name: '深度 5 天',
    tagline: '把四个方向的经典都走一遍',
    days: 5,
    level: '标准',
    bestFor: '第一次来但有五天以上、愿意每天走两万步',
    summary:
      '中轴、南城、西北苑囿、什刹海四个方向各占一天，长城单独一天。每天按片区走，不来回横穿；只有第四天从北二环回南二环，是全程唯一的折返。',
    itinerary: [
      { day: 1, title: '中轴核心', spots: ['tiananmen-square', 'forbidden-city', 'jingshan-park'] },
      { day: 2, title: '什刹海与寺庙', spots: ['beihai-park', 'shichahai', 'yonghegong', 'guozijian'] },
      { day: 3, title: '长城', wallSpot: 'badaling' },
      { day: 4, title: '南城与博物馆', spots: ['national-museum', 'qianmen', 'tiantan'] },
      { day: 5, title: '西北苑囿', spots: ['yuanmingyuan', 'summer-palace'] },
    ],
    tips: [
      '第二天四个点都在北城，步行加两站地铁就够，是全程最舒服的一天',
      '第五天圆明园在东、颐和园在西，按这个顺序走，最后从颐和园北宫门坐 4 号线回城',
      '长城日放在第三天，前后两天都在城区，体力上有个缓冲',
    ],
    skip: ['798 艺术区（在东北四环，为了它要多花半天）', '古北水镇（要过夜）'],
  },
  {
    id: 'offpeak-4d',
    name: '春节错峰 4 天',
    tagline: '专为春节期间的人流设计',
    days: 4,
    level: '标准',
    bestFor: '春节假期出行、怕排队怕人挤人',
    summary:
      '春节的北京，故宫初一到初三人最多，雍和宫初一抢头香能排到街上。这条路线的思路是：长城选慕田峪而不是八达岭，先走西北苑囿，把故宫放在假期中段的工作日。',
    itinerary: [
      { day: 1, title: '西北苑囿', spots: ['yuanmingyuan', 'summer-palace'] },
      { day: 2, title: '慕田峪长城', wallSpot: 'mutianyu' },
      { day: 3, title: '中轴核心', spots: ['tiananmen-square', 'forbidden-city', 'jingshan-park'] },
      { day: 4, title: '南城', spots: ['qianmen', 'tiantan'] },
    ],
    tips: [
      '慕田峪比八达岭人少，但换乘要两次、单程 2.5 小时，早上 7 点前就得出门',
      '雍和宫没排进来：初一至初五的人流量是全年峰值，想上香要单独安排并早到',
      '故宫尽量避开初一至初三，选假期中段的周中，人少一半',
      '天坛初一人也多（本地人逛庙会），放最后一天正好错开',
    ],
    skip: ['雍和宫（春节期间人流极端）', '国博（最难约，抢不到就换首都博物馆）'],
  },
]

export const routeById = classicRoutes.reduce((map, route) => {
  map[route.id] = route
  return map
}, {})
