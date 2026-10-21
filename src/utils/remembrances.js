// 追忆兑换表的展示逻辑：物品名 → 站内图鉴条目，以及筛选 / 分组

import { codexModules } from '../data/codex.js'
import weapons from '../data/weapons.js'
import remembrances, { typeToModule } from '../data/remembrances.js'
import { remembranceBosses } from '../data/regions.js'

const indexCache = new Map()

function nameIndex(key) {
  if (indexCache.has(key)) return indexCache.get(key)
  const items = key === 'weapons' ? weapons : codexModules[key]?.items || []
  const map = new Map()
  items.forEach((item) => {
    if (item?.name) map.set(item.name, item)
  })
  indexCache.set(key, map)
  return map
}

export function resolveExchangeItem(item) {
  const key = typeToModule[item.type]
  if (!key) return { ...item, to: '', detail: null }
  const found = nameIndex(key).get(item.name) || null
  if (!found) return { ...item, to: '', detail: null }
  const base = key === 'weapons' ? '/weapons' : codexModules[key].path
  return { ...item, to: `${base}/${encodeURIComponent(found.id)}`, detail: found }
}

// BOSS 所在区域直接复用区域图鉴里的记录，避免地点写两份、各改各的
const bossRegion = new Map(remembranceBosses.map((boss) => [boss.name, boss]))

export function decorateRemembrance(entry) {
  const region = bossRegion.get(entry.boss)
  return {
    ...entry,
    regionId: region?.regionId || '',
    regionName: region?.regionName || (entry.dlc ? '影之地' : ''),
    place: region?.place || '',
    items: entry.items.map(resolveExchangeItem),
  }
}

export const remembranceList = remembrances.map(decorateRemembrance)

export const exchangeTypeOptions = ['武器', '魔法', '祷告', '护符', '战灰', '道具']

export function filterRemembrances(list, { keyword = '', dlcFilter = 'all', type = '' } = {}) {
  const kw = keyword.trim().toLowerCase()
  return list.filter((entry) => {
    if (dlcFilter === 'base' && entry.dlc) return false
    if (dlcFilter === 'dlc' && !entry.dlc) return false
    if (type && !entry.items.some((item) => item.type === type)) return false
    if (!kw) return true
    const haystack = [
      entry.boss,
      entry.remembrance,
      entry.regionName,
      entry.place,
      ...entry.items.map((item) => `${item.name} ${item.type}`),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(kw)
  })
}

// 反查：某件图鉴条目出自哪个追忆（详情页用来说明「这把武器是追忆换的」）
export function remembrancesOfItem(name) {
  return remembranceList.filter((entry) => entry.items.some((item) => item.name === name))
}
