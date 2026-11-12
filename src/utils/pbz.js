// 影之刃零板块的通用展示逻辑：武器 / 影之武装图鉴与 BOSS 列表共用
// 条目字段：id、name、nameEn、category（BOSS 为 region）、effect、location、metrics[]

// 关键词命中：中文名 / 英文名 / 分类 / 简介 / 获取 / 招式
export function matchPbz(item, keyword) {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return true
  const haystack = [
    item.name,
    item.nameEn,
    item.category,
    item.region,
    item.effect,
    item.location,
    item.place,
    item.drop,
    item.tips,
    ...(item.moves || []).map((move) => `${move.label} ${move.text}`),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(kw)
}

// groupKey：图鉴用 category，BOSS 用 region
export function filterPbz(items, { keyword, groups, groupKey }) {
  return items.filter((item) => {
    if (!matchPbz(item, keyword)) return false
    if (groups.length && !groups.includes(item[groupKey])) return false
    return true
  })
}

export function sortPbz(items, key) {
  if (key === 'name') return [...items].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
  return items
}

export function groupCounts(items, groups, groupKey) {
  const counter = new Map()
  items.forEach((item) => counter.set(item[groupKey], (counter.get(item[groupKey]) || 0) + 1))
  return groups.map((group) => ({ ...group, count: counter.get(group.id) || 0 })).filter((group) => group.count > 0)
}

export function bossHref(boss) {
  return `/pbz/bosses/${encodeURIComponent(boss.id)}`
}
