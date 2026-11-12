// 影之刃零流派库的解析与派生
//
// data/pbz/archetypes.js 里只写「人做的判断」：为什么这两把武器放一起、
// 切换顺序是什么、哪一步最容易走错。武器与影之武装的类别、机制、获取方式
// 全部回查图鉴表，不在流派数据里再抄一遍。
//
// 与艾尔登法环的区别：本作没有属性点与负重，所以这里不算 statTotal / loadOf，
// 只解析「核心槽位」并生成带链接的条目。名字写错会在模块加载时直接抛错，
// 避免改完图鉴后某个流派静默少一件核心装备。

import { pbzArchetypes, pbzArchetypeStages, pbzArchetypeRoles } from '../data/pbz/archetypes.js'
import weapons from '../data/pbz/weapons.js'
import phantomEdges from '../data/pbz/phantomEdges.js'

const weaponByName = new Map(weapons.map((item) => [item.name, item]))
const edgeByName = new Map(phantomEdges.map((item) => [item.name, item]))

function fail(archetype, kind, name) {
  throw new Error(`[pbz-archetypes] 「${archetype.name}」引用了不存在的${kind}「${name}」`)
}

function pickWeapon(archetype, name) {
  const raw = weaponByName.get(name)
  if (!raw) fail(archetype, '主武器', name)
  return {
    kind: '主武器',
    name: raw.name,
    nameEn: raw.nameEn,
    id: raw.id,
    to: `/pbz/weapons/${encodeURIComponent(raw.id)}`,
    category: raw.category,
    effect: raw.effect,
    location: raw.location,
    zhPending: Boolean(raw.zhPending),
    note: archetype.coreNotes?.[name] || '',
  }
}

function pickEdge(archetype, name) {
  const raw = edgeByName.get(name)
  if (!raw) fail(archetype, '影之武装', name)
  return {
    kind: '影之武装',
    name: raw.name,
    nameEn: raw.nameEn,
    id: raw.id,
    to: `/pbz/phantom-edges/${encodeURIComponent(raw.id)}`,
    category: raw.category,
    effect: raw.effect,
    location: raw.location,
    zhPending: Boolean(raw.zhPending),
    note: archetype.coreNotes?.[name] || '',
  }
}

/** 把核心配装里的名字解析成带链接、类别与机制的条目 */
export function resolvePbzCore(archetype) {
  const core = archetype.core || {}
  return {
    weapons: (core.weapons || []).map((name) => pickWeapon(archetype, name)),
    edges: (core.edges || []).map((name) => pickEdge(archetype, name)),
  }
}

/** 成型路线里「这一阶段该拿什么」，只解析武器与影之武装，饰品按名字展示 */
export function resolvePbzGear(archetype, gear = {}) {
  return {
    weapons: (gear.weapons || []).map((name) => pickWeapon(archetype, name)),
    edges: (gear.edges || []).map((name) => pickEdge(archetype, name)),
    accessories: gear.accessories || [],
  }
}

export const pbzArchetypeList = pbzArchetypes.map((item, index) => ({
  ...item,
  index,
  items: resolvePbzCore(item),
}))

export function pbzArchetypeDetail(id) {
  return pbzArchetypeList.find((item) => item.id === id) || null
}

/** 上一个 / 下一个：列表顺序就是推荐顺序，从前期一路读到终局 */
export function pbzArchetypeNeighbors(id) {
  const index = pbzArchetypeList.findIndex((item) => item.id === id)
  if (index < 0) return { prev: null, next: null }
  return {
    prev: index > 0 ? pbzArchetypeList[index - 1] : null,
    next: index < pbzArchetypeList.length - 1 ? pbzArchetypeList[index + 1] : null,
  }
}

/** 搜索 / 筛选共用：把名称、别名、机制、核心装备、饰品、秘药、能力全拼进去 */
function keywordOf(item) {
  const core = item.items
  return [
    item.name,
    ...(item.alias || []),
    item.role,
    item.summary,
    ...(item.tags || []),
    ...(item.hook || []),
    ...core.weapons.flatMap((weapon) => [weapon.name, weapon.nameEn, weapon.category, weapon.effect]),
    ...core.edges.flatMap((edge) => [edge.name, edge.nameEn, edge.category, edge.effect]),
    ...(item.core.accessories || []).map((entry) => `${entry.name} ${entry.effect}`),
    ...(item.core.medicines || []).map((entry) => `${entry.name} ${entry.effect}`),
    ...(item.core.abilities || []).map((entry) => `${entry.name} ${entry.effect}`),
    ...(item.phases || []).flatMap((phase) => [phase.title, phase.goal, ...(phase.steps || [])]),
  ]
    .join(' ')
    .toLowerCase()
}

export function filterPbzArchetypes({ keyword = '', roles = [], stages = [] } = {}) {
  const text = keyword.trim().toLowerCase()
  return pbzArchetypeList.filter((item) => {
    if (roles.length && !roles.includes(item.role)) return false
    if (stages.length && !stages.includes(item.stage)) return false
    if (text && !keywordOf(item).includes(text)) return false
    return true
  })
}

export const pbzArchetypeFilterOptions = {
  roles: pbzArchetypeRoles,
  stages: pbzArchetypeStages,
}

export function pbzStageLabel(key) {
  return pbzArchetypeStages.find((stage) => stage.key === key)?.label || key
}

export function pbzStageHint(key) {
  return pbzArchetypeStages.find((stage) => stage.key === key)?.hint || ''
}

/** 难度 1–5 星，展示成文字更好懂 */
export function pbzDifficultyLabel(level) {
  const map = { 1: '入门', 2: '好上手', 3: '需要练习', 4: '有门槛', 5: '硬核' }
  return map[level] || '—'
}

/** 取向配色：列表色条与详情标签共用一套 */
const ROLE_COLORS = {
  进攻: '#d8574a',
  破防: '#d08a5a',
  防守反击: '#7fa6d8',
  控场: '#86b57a',
  远程: '#c47b9c',
  召唤: '#a08bd0',
}

export function pbzRoleColor(name) {
  return ROLE_COLORS[name] || '#9d9788'
}

/** 统计：板块首页与列表页头共用，避免各写一份 */
export const pbzArchetypeStats = {
  total: pbzArchetypeList.length,
  roles: new Set(pbzArchetypeList.map((item) => item.role)).size,
  starters: pbzArchetypeList.filter((item) => item.stage === 'starter').length,
  late: pbzArchetypeList.filter((item) => item.stage === 'late').length,
  sources: new Set(pbzArchetypeList.flatMap((item) => item.sources.map((source) => source.url))).size,
}
