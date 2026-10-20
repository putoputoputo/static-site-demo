// 图鉴模块的通用展示逻辑：护符 / 魔法 / 祷告 / 骨灰共用
// 每个条目至少包含：id、name、category、tier、effect、location、metrics[]

export const TIER_ORDER = { S: 0, A: 1, B: 2, C: 3 }

export const TIER_COLORS = {
  S: '#e0645c',
  A: '#d4af37',
  B: '#8fa88a',
  C: '#7a7565',
}

export const TIER_LABELS = {
  S: '核心',
  A: '强力',
  B: '可用',
  C: '收藏',
}

export function tierColor(tier) {
  return TIER_COLORS[tier] || TIER_COLORS.C
}

export function tierLabel(tier) {
  return TIER_LABELS[tier] || '收藏'
}

// 关键词命中：名称 / 分类 / 效果 / 获取 / 需求 / 定位
export function matchCodex(item, keyword) {
  const kw = (keyword || '').trim().toLowerCase()
  if (!kw) return true
  const haystack = [
    item.name,
    item.category,
    item.effect,
    item.location,
    item.req,
    item.role,
    ...(item.metrics || []).map((m) => `${m.label} ${m.value}`),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(kw)
}

export function filterCodex(items, { keyword = '', categories = [], onlyDlc = false, onlyTop = false } = {}) {
  return items.filter((item) => {
    if (!matchCodex(item, keyword)) return false
    if (categories.length && !categories.includes(item.category)) return false
    if (onlyDlc && !item.dlc) return false
    if (onlyTop && !['S', 'A'].includes(item.tier)) return false
    return true
  })
}

export function sortCodex(items, key) {
  const list = [...items]
  const byTier = (a, b) => (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9)
  const byName = (a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')
  switch (key) {
    case 'name':
      return list.sort(byName)
    case 'tier':
      return list.sort((a, b) => byTier(a, b) || byName(a, b))
    case 'weight-asc':
      return list.sort((a, b) => (a.weight ?? 999) - (b.weight ?? 999) || byName(a, b))
    case 'fp-asc':
      return list.sort((a, b) => (a.fp ?? 9999) - (b.fp ?? 9999) || byName(a, b))
    case 'slots-asc':
      return list.sort((a, b) => (a.slots ?? 9) - (b.slots ?? 9) || byName(a, b))
    default:
      return list
  }
}

export function categoryCounts(items, categories) {
  const counter = new Map()
  items.forEach((item) => counter.set(item.category, (counter.get(item.category) || 0) + 1))
  return categories
    .map((category) => ({ ...category, count: counter.get(category.id) || 0 }))
    .filter((category) => category.count > 0)
}

export function itemHref(module, item) {
  return `${module.path}/${encodeURIComponent(item.id)}`
}

export function neighborsOf(items, id) {
  const index = items.findIndex((item) => item.id === id)
  return {
    prev: index > 0 ? items[index - 1] : null,
    next: index > -1 && index < items.length - 1 ? items[index + 1] : null,
    siblings: index > -1 ? items.filter((item) => item.category === items[index].category && item.id !== id).slice(0, 8) : [],
  }
}

// 列表页默认排序：保持数据文件里的分类顺序，分类内按推荐度再按名称
export function defaultOrder(items) {
  return [...items].sort((a, b) => {
    const indexA = items.indexOf(a)
    const indexB = items.indexOf(b)
    return indexA - indexB
  })
}
