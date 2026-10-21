// BOSS 攻略的工具层：把 regions / bossGuides / remembrances 合成可渲染的列表与详情
//
// 三层数据的职责边界：
//   regions.js      —— 有哪些 BOSS、在哪、是否必打、是否追忆
//   bossGuides.js   —— 怎么打
//   remembrances.js —— 追忆能换什么
// 这里只做拼装与筛选，不新增事实，避免「同一个事实写两处、改一处忘另一处」。

import { mainRegions, regionLayers } from '../data/regions.js'
import { bossGuides } from '../data/bossGuides.js'
import { remembranceList } from './remembrances.js'

const layerNameMap = Object.fromEntries(regionLayers.map((layer) => [layer.id, layer.name]))

// 追忆兑换：boss 名 → { remembrance, runes, items }
// 用已被 decorateRemembrance 处理过的列表，这样 items 里的条目自带 to（可点进图鉴）
const exchangeByBoss = new Map(remembranceList.map((entry) => [entry.boss, entry]))

function buildBoss(region, boss) {
  const key = `${region.id}::${boss.name}`
  const guide = bossGuides[key]
  const exchange = boss.remembrance ? exchangeByBoss.get(boss.name) : null

  return {
    // 身份
    key,
    name: boss.name,
    regionId: region.id,
    regionName: region.name,
    regionLayer: region.layer,
    layerName: layerNameMap[region.layer] || region.layer,
    dlc: Boolean(region.dlc),
    place: boss.place || '',
    note: boss.note || '',
    // 主线 / 支线标记
    required: Boolean(boss.required),
    remembrance: Boolean(boss.remembrance),
    quest: boss.quest || '',
    // 攻略字段
    type: guide?.type || '未分类',
    level: guide?.level || '—',
    blessing: guide?.blessing || '',
    upgrade: guide?.upgrade || '',
    danger: guide?.danger ?? 0,
    phases: guide?.phases ?? 1,
    weak: guide?.weak || [],
    resist: guide?.resist || [],
    immune: guide?.immune || [],
    tips: guide?.tips || [],
    summon: guide?.summon || [],
    drop: guide?.drop || [],
    exchange: exchange
      ? {
          remembrance: exchange.remembrance,
          runes: exchange.runes,
          items: exchange.items,
        }
      : null,
    hasGuide: Boolean(guide),
  }
}

export const bossList = mainRegions.flatMap((region) =>
  (region.bosses || []).map((boss) => buildBoss(region, boss))
)

export const bossByKey = new Map(bossList.map((boss) => [boss.key, boss]))

export function getBoss(regionId, name) {
  return bossByKey.get(`${regionId}::${name}`) || null
}

export function bossHref(boss) {
  return `/bosses/${boss.regionId}/${encodeURIComponent(boss.name)}`
}

/** 同一区域内其它 BOSS，用于详情页底部串联 */
export function siblingBosses(boss) {
  return bossList.filter((item) => item.regionId === boss.regionId && item.key !== boss.key)
}

/** 上一个 / 下一个（按全站顺序，方便连续翻阅） */
export function bossNeighbors(boss) {
  const index = bossList.findIndex((item) => item.key === boss.key)
  return {
    prev: index > 0 ? bossList[index - 1] : null,
    next: index >= 0 && index < bossList.length - 1 ? bossList[index + 1] : null,
  }
}

// ==================== 筛选项 ====================

export const bossRegions = mainRegions
  .filter((region) => (region.bosses || []).length)
  .map((region) => ({
    id: region.id,
    name: region.name,
    layer: region.layer,
    layerName: layerNameMap[region.layer] || region.layer,
    dlc: Boolean(region.dlc),
    count: region.bosses.length,
  }))

export const bossLayers = regionLayers
  .map((layer) => ({
    id: layer.id,
    name: layer.name,
    count: bossList.filter((boss) => boss.regionLayer === layer.id).length,
  }))
  .filter((layer) => layer.count)

/** 分类标签（用于筛选），按出现次数排序 */
export const bossTypes = (() => {
  const counts = new Map()
  bossList.forEach((boss) => {
    // 「半神 · 传说」「重甲骑乘 · 夜间」这类标签取第一段做归类
    const primary = boss.type.split(' · ')[0]
    counts.set(primary, (counts.get(primary) || 0) + 1)
  })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh'))
    .map(([name, count]) => ({ name, count }))
})()

/** 弱点标签（用于「我有这把武器，能打谁」的反向筛选） */
export const bossWeaknesses = (() => {
  const counts = new Map()
  bossList.forEach((boss) => {
    boss.weak.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1))
  })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh'))
    .map(([name, count]) => ({ name, count }))
})()

// ==================== 统计 ====================

export const bossStats = {
  total: bossList.length,
  base: bossList.filter((boss) => !boss.dlc).length,
  dlc: bossList.filter((boss) => boss.dlc).length,
  required: bossList.filter((boss) => boss.required).length,
  remembrance: bossList.filter((boss) => boss.remembrance).length,
  optional: bossList.filter((boss) => !boss.required).length,
  withGuide: bossList.filter((boss) => boss.hasGuide).length,
}

// ==================== 筛选 ====================

const norm = (text) => String(text || '').toLowerCase().trim()

function matchKeyword(boss, keyword) {
  if (!keyword) return true
  const q = norm(keyword)
  const haystack = [
    boss.name,
    boss.regionName,
    boss.place,
    boss.note,
    boss.type,
    ...boss.weak,
    ...boss.drop,
    ...(boss.exchange?.items || []).map((item) => item.name),
  ]
    .map(norm)
    .join(' ')
  return haystack.includes(q)
}

export function filterBosses(list, options = {}) {
  const {
    keyword = '',
    region = 'all',
    layer = 'all',
    dlc = 'all',
    kind = 'all', // all | required | remembrance | optional
    types = [],
    weaknesses = [],
    minDanger = 0,
  } = options

  return list.filter((boss) => {
    if (!matchKeyword(boss, keyword)) return false
    if (region !== 'all' && boss.regionId !== region) return false
    if (layer !== 'all' && boss.regionLayer !== layer) return false
    if (dlc === 'base' && boss.dlc) return false
    if (dlc === 'dlc' && !boss.dlc) return false

    if (kind === 'required' && !boss.required) return false
    if (kind === 'remembrance' && !boss.remembrance) return false
    if (kind === 'optional' && boss.required) return false

    if (types.length) {
      const primary = boss.type.split(' · ')[0]
      if (!types.includes(primary) && !types.includes(boss.type)) return false
    }

    // 弱点筛选是「任一命中」，因为玩家通常只有一个属性手段
    if (weaknesses.length && !weaknesses.some((tag) => boss.weak.includes(tag))) return false

    if (minDanger && boss.danger < minDanger) return false

    return true
  })
}

export const bossSortOptions = [
  { value: 'default', label: '默认（区域顺序）' },
  { value: 'danger-asc', label: '难度：由易到难' },
  { value: 'danger-desc', label: '难度：由难到易' },
  { value: 'level', label: '推荐等级' },
  { value: 'name', label: '名称' },
]

function levelStart(boss) {
  const match = String(boss.level).match(/(\d+)/)
  return match ? Number(match[1]) : 9999
}

export function sortBosses(list, sortKey) {
  const items = [...list]
  switch (sortKey) {
    case 'danger-asc':
      return items.sort((a, b) => a.danger - b.danger || levelStart(a) - levelStart(b))
    case 'danger-desc':
      return items.sort((a, b) => b.danger - a.danger || levelStart(a) - levelStart(b))
    case 'level':
      return items.sort((a, b) => levelStart(a) - levelStart(b) || a.danger - b.danger)
    case 'name':
      return items.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
    default:
      return items
  }
}

// ==================== 展示辅助 ====================

export const dangerLabels = ['—', '杂兵级', '一般', '有难度', '卡关级', '全游戏最难']

export function dangerLabel(value) {
  return dangerLabels[Math.min(Math.max(value, 0), 5)] || '—'
}

/** 难度条颜色：越高越红，和站内暗金主题协调 */
export function dangerColor(value) {
  if (value >= 5) return '#d9534f'
  if (value === 4) return '#d98d3f'
  if (value === 3) return '#c9a227'
  if (value === 2) return '#7e9a5c'
  return '#5d7f8a'
}

/** 弱点标签配色：按属性语义区分，便于扫读 */
export function tagColor(tag) {
  const map = {
    火: '#d9704b',
    雷: '#d4c04a',
    圣: '#d8c98a',
    魔力: '#6f8fd4',
    打击: '#c08a5e',
    斩击: '#b8806f',
    突刺: '#9aa88f',
    出血: '#b8453f',
    冻伤: '#6fa7c7',
    中毒: '#7f9a52',
    猩红腐败: '#b4553f',
    睡眠: '#8a7fc0',
  }
  return map[tag] || '#9a9280'
}
