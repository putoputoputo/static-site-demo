// 武器数据的通用展示逻辑（供列表页与详情页复用）

export const ATTR_KEYS = ['str', 'dex', 'int', 'fai', 'arc']

export const ATTR_LABELS = {
  str: '力量',
  dex: '灵巧',
  int: '智力',
  fai: '信仰',
  arc: '感应',
}

export const DAMAGE_KEYS = ['physical', 'magic', 'fire', 'lightning', 'holy']

export const DAMAGE_LABELS = {
  physical: '物理',
  magic: '魔力',
  fire: '火焰',
  lightning: '雷电',
  holy: '圣',
}

export const DAMAGE_COLORS = {
  physical: '#cfcabb',
  magic: '#6fa8dc',
  fire: '#e07b39',
  lightning: '#e3c85a',
  holy: '#e8dca0',
}

// 补正等级 → 分值，用于排序与进度条
const SCALING_SCORE = { '-': 0, E: 1, D: 2, C: 3, B: 4, A: 5, S: 6 }

export const SCALING_MAX = 6

export function scalingScore(letter) {
  return SCALING_SCORE[letter] ?? 0
}

// 补正等级配色：由灰到金红，越高越亮
const SCALING_COLORS = {
  '-': '#4c4c48',
  E: '#8a8574',
  D: '#8fa88a',
  C: '#6fa8dc',
  B: '#9b7fd4',
  A: '#e0a33e',
  S: '#e0645c',
}

export function scalingColor(letter) {
  return SCALING_COLORS[letter] || SCALING_COLORS['-']
}

// 补正合计，用于「综合补正」排序
export function scalingTotal(scaling) {
  return ATTR_KEYS.reduce((sum, key) => sum + scalingScore(scaling?.[key]), 0)
}

// 主要加点方向：取补正最高的 1~2 项
export function topAttributes(scaling, count = 2) {
  return ATTR_KEYS.map((key) => ({ key, label: ATTR_LABELS[key], score: scalingScore(scaling?.[key]) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
}

// 非物理属性伤害列表（仅返回大于 0 的项）
export function extraDamages(stats) {
  return DAMAGE_KEYS.filter((key) => key !== 'physical' && stats?.[key] > 0).map((key) => ({
    key,
    label: DAMAGE_LABELS[key],
    value: stats[key],
    color: DAMAGE_COLORS[key],
  }))
}

// 完整伤害列表（用于详情页面板）
export function damageList(stats) {
  return DAMAGE_KEYS.map((key) => ({
    key,
    label: DAMAGE_LABELS[key],
    value: stats?.[key] || 0,
    color: DAMAGE_COLORS[key],
  }))
}

export function totalDamage(stats) {
  return DAMAGE_KEYS.reduce((sum, key) => sum + (stats?.[key] || 0), 0)
}

// 需求属性中大于 0 的项
export function requirementList(requirements) {
  return ATTR_KEYS.filter((key) => requirements?.[key] > 0).map((key) => ({
    key,
    label: ATTR_LABELS[key],
    value: requirements[key],
  }))
}

// 异常状态配色（出血红、冻伤蓝、黑焰紫…）
export const STATUS_COLORS = {
  出血: '#e0645c',
  冻伤: '#6fa8dc',
  黑焰: '#9b7fd4',
  中毒: '#8fa88a',
  猩红腐败: '#c96a4a',
  睡眠: '#8b9bd4',
  发狂: '#e0b23e',
}

export function statusColor(name) {
  return STATUS_COLORS[name] || '#b8b2a0'
}

// 攻击类型的兜底推断：数据未显式声明时按武器类型判断
const ATTACK_TYPE_BY_TYPE = {
  匕首: '突刺',
  投掷刃: '突刺',
  刺剑: '突刺',
  重型刺剑: '突刺',
  直剑: '斩击与突刺',
  轻大剑: '斩击与突刺',
  大剑: '斩击',
  特大剑: '斩击',
  曲剑: '斩击',
  大曲剑: '斩击',
  反手剑: '斩击',
  刀: '斩击',
  大刀: '斩击与突刺',
  双头剑: '斩击与突刺',
  斧: '斩击',
  大斧: '斩击',
  锤: '打击',
  连枷: '打击',
  大锤: '打击',
  特大武器: '打击',
  枪: '突刺',
  大枪: '突刺',
  戟: '斩击与突刺',
  镰刀: '斩击',
  鞭: '打击与斩击',
  拳套: '打击',
  徒手武艺: '打击',
  爪: '斩击',
  兽爪: '斩击',
  香水瓶: '打击',
  轻弓: '突刺',
  弓: '突刺',
  大弓: '突刺',
  弩: '突刺',
  弩炮: '突刺',
  法杖: '打击',
  圣印记: '打击',
  火把: '打击',
  刺盾: '突刺',
  盾: '打击',
}

export function attackTypeOf(weapon) {
  return weapon?.attackType || ATTACK_TYPE_BY_TYPE[weapon?.type] || '斩击'
}

export const BUILD_LABELS = {
  vigor: '生命力',
  mind: '集中力',
  endurance: '耐力',
  str: '力量',
  dex: '灵巧',
  int: '智力',
  fai: '信仰',
  arc: '感应',
}

export function buildStatList(stats) {
  return Object.keys(BUILD_LABELS).map((key) => ({
    key,
    label: BUILD_LABELS[key],
    value: stats?.[key] ?? 0,
  }))
}

// 关键词命中：名称 / 类型 / 地区 / 描述 / 战技 / 玩法要点
export function matchKeyword(weapon, keyword) {
  const kw = (keyword || '').trim().toLowerCase()
  if (!kw) return true
  const haystack = [
    weapon.name,
    weapon.type,
    weapon.region,
    weapon.attackType,
    ...(weapon.status || []),
    weapon.description,
    weapon.skill?.name,
    weapon.skill?.description,
    ...(weapon.gameplay || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(kw)
}
