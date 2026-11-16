// 旅游板块的元信息：数据核对日期、春节窗口、口径提示
// 页面底部与列表页顶部都会读这里，改口径只改这一处。

export const travelMeta = {
  city: '北京',
  checkedAt: '2026-11-16',
  // 数据过期提醒的阈值：超过这个天数，列表页顶部提示复核
  staleDays: 90,
  intro:
    '首期只做北京。18 个景点、7 个片区，数据全部标注出处与核对日期；票价与开放时间会变，出发前请按页面给的官网链接再核一次。',
  scope: [
    '只做公共交通：地铁、公交、市郊铁路、京张高铁，不提供自驾方案',
    '路线按「景点 → 景点」串联，住处到起点、终点回住处这两段不计入，页面单独标注',
    '金额均为单人、人民币，门票按淡季价计；不含往返北京的大交通与住宿',
  ],
}

// 2027 年春节假期：国务院办公厅 2026-11-05 通知
export const springFestival = {
  year: 2027,
  start: '2027-02-05',
  end: '2027-02-13',
  days: 9,
  label: '2027 年春节：2 月 5 日（除夕，周五）— 2 月 13 日（正月初八，周六），共 9 天',
  note: '1 月 31 日（周日）、2 月 14 日（周日）上班',
  source: {
    label: '国务院办公厅关于 2027 年部分节假日安排的通知',
    url: 'https://www.gov.cn/zhengce/content/202611/content_7085101.htm',
    checkedAt: '2026-11-16',
  },
}

// 逐日星期，用于路线排期时避开周一闭馆
export const festivalDays = [
  { date: '2027-02-05', weekday: '周五', weekdayIndex: 5, label: '除夕' },
  { date: '2027-02-06', weekday: '周六', weekdayIndex: 6, label: '正月初一' },
  { date: '2027-02-07', weekday: '周日', weekdayIndex: 0, label: '正月初二' },
  { date: '2027-02-08', weekday: '周一', weekdayIndex: 1, label: '正月初三' },
  { date: '2027-02-09', weekday: '周二', weekdayIndex: 2, label: '正月初四' },
  { date: '2027-02-10', weekday: '周三', weekdayIndex: 3, label: '正月初五' },
  { date: '2027-02-11', weekday: '周四', weekdayIndex: 4, label: '正月初六' },
  { date: '2027-02-12', weekday: '周五', weekdayIndex: 5, label: '正月初七' },
  { date: '2027-02-13', weekday: '周六', weekdayIndex: 6, label: '正月初八' },
]

// 春节特有的风险，逐条标状态：confirmed 已确认 / pending 待官方公告
export const festivalNotices = [
  {
    level: 'warn',
    status: 'pending',
    title: '2 月 8 日是周一，但落在春节假期内',
    text: '故宫的规则是「除法定节假日外全年周一闭馆」，按此当天应正常开放。但最终以故宫 2027 年 1—2 月发布的春节开放公告为准，排期时把故宫优先放在周六或周日更稳妥。',
  },
  {
    level: 'info',
    status: 'confirmed',
    title: '故宫提前 7 天 20:00 放票，每日限流 4 万人',
    text: '春节是最难约的时段之一。最早的 2 月 5 日门票，1 月 29 日 20:00 就要下单。',
  },
  {
    level: 'info',
    status: 'confirmed',
    title: '八达岭提前 10 天放票，免票人群也要预约',
    text: '走「长城内外旅游」小程序。18 岁以下、60 岁以上免票，但免票不等于免预约，不填身份信息到检票口刷不出来。',
  },
  {
    level: 'warn',
    status: 'pending',
    title: '国家博物馆最难约',
    text: '提前 7 天 17:00 放票，节假日几分钟内抢空。约不到就把这一站换成首都博物馆或直接跳过。',
  },
  {
    level: 'info',
    status: 'confirmed',
    title: '天安门广场需单独预约，与故宫门票不通用',
    text: '升旗时段名额单独放，想看升旗要提前 1—7 天约该时段，并比升旗时间早到 1 小时。',
  },
]

// 淡旺季：11 月 1 日—次年 3 月 31 日为淡季，春节落在淡季
export const seasonOf = (date) => {
  const month = Number(String(date).slice(5, 7))
  return month >= 4 && month <= 10 ? 'peak' : 'offPeak'
}

export const seasonLabel = { peak: '旺季', offPeak: '淡季' }
