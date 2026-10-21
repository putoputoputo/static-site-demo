// 流派库的解析与派生计算
//
// data/archetypes.js 里只有名字和判断，这里负责把它们接回四张原始表：
// 重量、FP、记忆格、需求、获取位置全部现查，不在流派数据里再抄一遍。
//
// 同时负责生成「带进构筑器」的链接 —— 流派页的价值一半在说明，另一半在
// 让玩家点一下就看到自己的负重和需求缺口，而不是对着文字自己填。

import { archetypes, archetypePrimaries, archetypeStages } from '../data/archetypes.js'
import weapons from '../data/weapons.js'
import talismans from '../data/talismans.js'
import sorceries from '../data/sorceries.js'
import incantations from '../data/incantations.js'
import spiritAshes from '../data/spiritAshes.js'
import {
  ATTRS,
  enduranceForTier,
  loadTier,
  maxEquipLoad,
  memoryStatus,
  summarize,
  tierColor,
} from './build.js'

// 四张表都按 name 建索引：流派里引用名字而不是 id，写起来像攻略，读起来也像
const weaponByName = new Map(weapons.map((item) => [item.name, item]))
const talismanByName = new Map(talismans.map((item) => [item.name, item]))
const spiritByName = new Map(spiritAshes.map((item) => [item.name, item]))

// 魔法和祷告都以「法术名」为 id，合表时把来源一起记下来：
// 详情页要跳到对应的图鉴路由，构筑器要加 sc: / inc: 前缀。
const spellByName = new Map()
sorceries.forEach((item) =>
  spellByName.set(item.name, { raw: item, kind: '魔法', prefix: 'sc', base: '/sorceries' })
)
incantations.forEach((item) => {
  if (spellByName.has(item.name)) return
  spellByName.set(item.name, { raw: item, kind: '祷告', prefix: 'inc', base: '/incantations' })
})

function fail(archetype, kind, name) {
  throw new Error(`[archetypes] 「${archetype.name}」引用了不存在的${kind}「${name}」`)
}

function pickWeapon(archetype, name) {
  if (!name) return null
  const raw = weaponByName.get(name)
  if (!raw) fail(archetype, '武器', name)
  return {
    kind: '武器',
    name: raw.name,
    id: raw.id,
    to: `/weapons/${encodeURIComponent(raw.id)}`,
    weight: Number(raw.stats?.weight) || 0,
    sub: `${raw.type} · ${raw.dlc ? 'DLC' : raw.region}`,
    effect: raw.description,
    location: raw.location,
    note: archetype.coreNotes?.[name] || '',
    raw,
  }
}

function pickTalisman(archetype, name) {
  const raw = talismanByName.get(name)
  if (!raw) fail(archetype, '护符', name)
  return {
    kind: '护符',
    name: raw.name,
    id: raw.id,
    to: `/runes/${encodeURIComponent(raw.id)}`,
    weight: Number(raw.weight) || 0,
    sub: `${raw.category} · ${raw.weight ?? 0} 负重`,
    effect: raw.effect,
    location: raw.location,
    note: archetype.coreNotes?.[name] || '',
    raw,
  }
}

function pickSpell(archetype, name) {
  const hit = spellByName.get(name)
  if (!hit) fail(archetype, '法术', name)
  return {
    kind: hit.kind,
    name: hit.raw.name,
    id: hit.raw.id,
    to: `${hit.base}/${encodeURIComponent(hit.raw.id)}`,
    weight: 0,
    sub: `${hit.raw.fp} FP · ${hit.raw.slots} 格`,
    effect: hit.raw.effect,
    location: hit.raw.location,
    note: archetype.coreNotes?.[name] || '',
    prefix: hit.prefix,
    raw: hit.raw,
  }
}

function pickSpirit(archetype, name) {
  if (!name) return null
  const raw = spiritByName.get(name)
  if (!raw) fail(archetype, '骨灰', name)
  return {
    kind: '骨灰',
    name: raw.name,
    id: raw.id,
    to: `/spirits/${encodeURIComponent(raw.id)}`,
    weight: 0,
    sub: `${raw.typeLabel} · ${raw.role}`,
    effect: raw.effect,
    location: raw.location,
    note: archetype.coreNotes?.[name] || '',
    raw,
  }
}

/** 把 core 里的名字解析成带链接、重量、获取位置的完整条目 */
export function resolveCore(archetype) {
  const core = archetype.core || {}
  const main = pickWeapon(archetype, core.main)
  const off = pickWeapon(archetype, core.off)
  return {
    main,
    off,
    weapons: [main, off].filter(Boolean),
    talismans: (core.talismans || []).map((name) => pickTalisman(archetype, name)),
    spells: (core.spells || []).map((name) => pickSpell(archetype, name)),
    spirit: pickSpirit(archetype, core.spirit),
  }
}

/** 成型路线里「这一阶段该拿什么」的小清单，解析成带链接的条目 */
export function resolveGear(archetype, gear = {}) {
  const list = []
  if (gear.main) list.push(pickWeapon(archetype, gear.main))
  if (gear.off) list.push(pickWeapon(archetype, gear.off))
  ;(gear.talismans || []).forEach((name) => list.push(pickTalisman(archetype, name)))
  ;(gear.spells || []).forEach((name) => list.push(pickSpell(archetype, name)))
  return list
}

/** 毕业配装的负重 / 档位 / 记忆格，全部按原始表现算 */
export function loadOf(archetype) {
  const core = resolveCore(archetype)
  const rawTalismans = core.talismans.map((item) => item.raw)
  const summary = summarize({
    weapons: core.weapons.map((item) => item.raw),
    talismans: rawTalismans,
    spells: core.spells.map((item) => item.raw),
  })
  const load = maxEquipLoad(archetype.stats.endurance, rawTalismans)
  const tier = loadTier(summary.totalWeight, load.total)
  // 反推：想把这套压在中负重，耐力至少要多少 —— 「快速成型」真正需要的一句话
  const medium = enduranceForTier(summary.totalWeight, rawTalismans, 'medium')
  // 流派数据只收武器与护符，护甲没有收（同一流派人人穿得不一样）。
  // 所以真正有用的一句话不是「你现在是什么档位」，而是「还剩多少负重留给护甲」。
  const armorRoom = Math.round((load.total - summary.totalWeight) * 10) / 10
  return {
    weight: summary.totalWeight,
    max: load.total,
    armorRoom,
    percent: Math.round(tier.percent),
    tier,
    tierColor: tierColor(tier.key),
    enduranceNow: archetype.stats.endurance,
    enduranceForMedium: medium ? medium.endurance : null,
    spellSlots: summary.spellSlots,
    spellFp: summary.spellFp,
    memory: memoryStatus(summary.spellSlots, 10),
  }
}

/** 属性合计，用来判断这套大概几级能成型 */
export function statTotal(archetype) {
  return ATTRS.reduce((sum, attr) => sum + (Number(archetype.stats?.[attr.key]) || 0), 0)
}

/** 属性条：按 80 点封顶画长度，超过 80 的部分截断（游戏里 80 以上收益已经很小） */
export function statRows(archetype) {
  return ATTRS.map((attr) => {
    const value = Number(archetype.stats?.[attr.key]) || 0
    return {
      key: attr.key,
      label: attr.label,
      value,
      percent: Math.min(100, Math.round((value / 80) * 100)),
      major: archetype.scaling?.some((name) => attr.label.includes(name) || name.includes(attr.label)),
    }
  })
}

/**
 * 「带进构筑器」的 query。
 *
 * 数组在这里就 join 成逗号串，不走 router 的数组序列化 —— 后者会展开成
 * `t=护符A&t=护符B` 这种重复 key，和构筑器 useQuerySync 读写的
 * `t=护符A,护符B` 不是同一种格式，进页面后 URL 会被再改一次。
 */
export function buildLinkOf(archetype) {
  const core = resolveCore(archetype)
  return {
    path: '/build',
    query: {
      w: core.main?.id || '',
      o: core.off?.id || '',
      t: core.talismans.map((item) => item.id).join(','),
      s: core.spells.map((item) => `${item.prefix}:${item.id}`).join(','),
      st: ATTRS.map((attr) => archetype.stats?.[attr.key] ?? 10).join(','),
    },
  }
}

export function stageLabel(key) {
  return archetypeStages.find((stage) => stage.key === key)?.label || key
}

export function stageHint(key) {
  return archetypeStages.find((stage) => stage.key === key)?.hint || ''
}

/** 难度用 1–5 星，展示成「入门 / 好上手 / 需要练习 / 有门槛 / 硬核」更好懂 */
export function difficultyLabel(level) {
  const map = { 1: '入门', 2: '好上手', 3: '需要练习', 4: '有门槛', 5: '硬核' }
  return map[level] || '—'
}

/** 解析后的完整列表：列表页要显示核心武器和负重，一次算完，避免模板里反复 find
 *
 * 注意解析结果放在 items 里，不要覆盖原始的 core ——
 * core 存的是名字引用，后面 buildLinkOf / loadOf 还要靠它重新解析。
 */
export const archetypeList = archetypes.map((item, index) => ({
  ...item,
  index,
  items: resolveCore(item),
  load: loadOf(item),
  total: statTotal(item),
}))

export function archetypeDetail(id) {
  return archetypeList.find((item) => item.id === id) || null
}

/** 上一个 / 下一个：列表顺序就是推荐顺序，顺着读下去就是一整条成长线 */
export function archetypeNeighbors(id) {
  const index = archetypeList.findIndex((item) => item.id === id)
  if (index < 0) return { prev: null, next: null }
  return {
    prev: index > 0 ? archetypeList[index - 1] : null,
    next: index < archetypeList.length - 1 ? archetypeList[index + 1] : null,
  }
}

/** 每个流派在列表页展示的关键词，搜索框按这个匹配 */
function keywordOf(item) {
  return [
    item.name,
    ...(item.alias || []),
    item.primary,
    item.summary,
    ...(item.tags || []),
    ...item.items.weapons.map((weapon) => weapon.name),
    ...item.items.talismans.map((talisman) => talisman.name),
    ...item.items.spells.map((spell) => spell.name),
    item.items.spirit?.name || '',
  ]
    .join(' ')
    .toLowerCase()
}

export function filterArchetypes({ keyword = '', primary = 'all', stage = 'all' } = {}) {
  const text = keyword.trim().toLowerCase()
  return archetypeList.filter((item) => {
    if (primary !== 'all' && item.primary !== primary) return false
    if (stage !== 'all' && item.stage !== stage) return false
    if (text && !keywordOf(item).includes(text)) return false
    return true
  })
}

export const archetypeFilterOptions = {
  primaries: archetypePrimaries,
  stages: archetypeStages,
}

/** 主属性配色：列表页的色条、详情页的标签共用一套，别在两个页面各写一份 */
const PRIMARY_COLORS = {
  力气: '#d08a5a',
  敏捷: '#86b57a',
  智力: '#7fa6d8',
  信仰: '#d4af37',
  感应: '#c47b9c',
}

export function primaryColor(name) {
  return PRIMARY_COLORS[name] || '#9d9788'
}
