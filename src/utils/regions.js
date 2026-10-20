import mainRegions, { regionLayers, regionStats, remembranceBosses } from '../data/regions'

export const regionById = new Map(mainRegions.map((item) => [item.id, item]))

export function getRegion(id) {
  return regionById.get(id) || null
}

// 关键词匹配：区域名 / 别名 / 子区域 / BOSS 名与地点 / 关键道具
export function matchRegion(region, keyword) {
  const word = (keyword || '').trim().toLowerCase()
  if (!word) return true
  return haystack(region).includes(word)
}

// 只看追忆 BOSS 时，区域名与子区域仍然参与匹配，但 BOSS 只保留追忆条目
export function matchBoss(boss, keyword) {
  const word = (keyword || '').trim().toLowerCase()
  if (!word) return true
  return [boss.name, boss.place, boss.note].filter(Boolean).join(' ').toLowerCase().includes(word)
}

function haystack(region) {
  return [
    region.name,
    region.alias,
    region.summary,
    region.access,
    ...(region.subAreas || []),
    ...(region.bosses || []).flatMap((boss) => [boss.name, boss.place, boss.note]),
    ...(region.keyItems || []).flatMap((item) => [item.name, item.note]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export const layerById = new Map(regionLayers.map((item) => [item.id, item]))

export function groupByLayer(regions) {
  return regionLayers
    .map((layer) => ({
      ...layer,
      regions: regions.filter((region) => region.layer === layer.id).sort((a, b) => a.order - b.order),
    }))
    .filter((layer) => layer.regions.length)
}

export function regionsOfChapter(chapterId) {
  return mainRegions.filter((region) => (region.chapters || []).includes(chapterId))
}

export { mainRegions, regionLayers, regionStats, remembranceBosses }
