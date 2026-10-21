// 全站搜索：一次输入，跨 8 个模块查
//
// 索引是惰性构建的 —— 数据总量上千条，但只在用户第一次打开搜索框时才 import，
// 这样不会把 quests（53 万字符）、weapons（480 条）全塞进首屏 chunk。
//
// 匹配规则按命中位置打分：名称完全相等 > 名称前缀 > 名称包含 > 备注字段包含。
// 中文不做分词，做的是「子串命中」，对攻略站这种专有名词查询反而更准。

import weapons from '../data/weapons.js'
import quests from '../data/quests.js'
import { mainChapters } from '../data/mainline.js'
import mainRegions from '../data/regions.js'
import { codexModules } from '../data/codex.js'
import { remembranceList } from './remembrances.js'
import { bossList, bossHref } from './bosses.js'

export const searchGroupOrder = ['weapons', 'talismans', 'sorceries', 'incantations', 'spirits', 'quests', 'main', 'regions', 'bosses', 'remembrances']

export const searchGroupLabels = {
  weapons: '武器',
  talismans: '护符',
  sorceries: '魔法',
  incantations: '祷告',
  spirits: '骨灰',
  quests: '支线',
  main: '主线章节',
  regions: '区域',
  bosses: 'BOSS',
  remembrances: '追忆兑换',
}

let cache = null

function push(map, group, item) {
  if (!map.has(group)) map.set(group, [])
  map.get(group).push(item)
}

export function buildIndex() {
  if (cache) return cache
  const map = new Map()

  weapons.forEach((weapon) => {
    push(map, 'weapons', {
      name: weapon.name,
      sub: `${weapon.type}${weapon.dlc ? ' · DLC' : ''}`,
      extra: [weapon.region, weapon.location, weapon.skill?.name, ...(weapon.status || [])].filter(Boolean).join(' '),
      to: `/weapons/${encodeURIComponent(weapon.id)}`,
    })
  })

  Object.values(codexModules).forEach((module) => {
    module.items.forEach((item) => {
      push(map, module.key, {
        name: item.name,
        sub: `${module.itemLabel} · ${item.category || ''}`.trim(),
        extra: [item.effect, item.location, item.req].filter(Boolean).join(' '),
        to: `${module.path}/${encodeURIComponent(item.id)}`,
      })
    })
  })

  quests.forEach((quest) => {
    push(map, 'quests', {
      name: quest.name,
      sub: `支线 · ${quest.npc || ''}${quest.dlc ? ' · DLC' : ''}`.trim(),
      extra: [quest.region, quest.summary, quest.startPoint].filter(Boolean).join(' '),
      to: `/side-quests/${encodeURIComponent(quest.id)}`,
    })
  })

  mainChapters.forEach((chapter) => {
    push(map, 'main', {
      name: chapter.title || chapter.name,
      sub: `主线 · 第 ${chapter.order ?? ''} 章${chapter.dlc ? ' · DLC' : ''}`.trim(),
      extra: [
        chapter.goal,
        chapter.region,
        ...(chapter.bosses || []).map((boss) => (typeof boss === 'string' ? boss : boss?.name)).filter(Boolean),
      ]
        .filter(Boolean)
        .join(' '),
      to: `/main-quest/${encodeURIComponent(chapter.id)}`,
    })
  })

  mainRegions.forEach((region) => {
    push(map, 'regions', {
      name: region.name,
      sub: `区域 · ${region.alias || region.layer || ''}`.trim(),
      extra: [region.summary, region.access, ...(region.subAreas || [])].filter(Boolean).join(' '),
      to: `/main-quest/regions?q=${encodeURIComponent(region.name)}`,
    })
  })

  // BOSS 现在有独立攻略页，索引直接指向详情；
  // extra 里塞进弱点与掉落，这样搜「出血」「弱火」也能落到具体 BOSS
  bossList.forEach((boss) => {
    push(map, 'bosses', {
      name: boss.name,
      sub: `BOSS · ${boss.regionName}${boss.remembrance ? ' · 追忆' : ''}${boss.dlc ? ' · DLC' : ''}`,
      extra: [boss.place, boss.note, boss.type, ...boss.weak, ...boss.drop].filter(Boolean).join(' '),
      to: bossHref(boss),
    })
  })

  remembranceList.forEach((entry) => {
    push(map, 'remembrances', {
      name: entry.boss,
      sub: '追忆兑换',
      extra: [entry.remembrance, ...entry.items.map((item) => `${item.name} ${item.type}`)].join(' '),
      to: `/main-quest/remembrances?q=${encodeURIComponent(entry.boss)}`,
    })
  })

  cache = map
  return map
}

function scoreOf(item, keyword) {
  const name = item.name.toLowerCase()
  if (name === keyword) return 100
  if (name.startsWith(keyword)) return 70
  if (name.includes(keyword)) return 50
  if (item.extra && item.extra.toLowerCase().includes(keyword)) return 20
  if (item.sub && item.sub.toLowerCase().includes(keyword)) return 10
  return 0
}

export function searchAll(rawKeyword, limitPerGroup = 6) {
  const keyword = String(rawKeyword || '').trim().toLowerCase()
  if (!keyword) return []
  const map = buildIndex()
  return searchGroupOrder
    .map((group) => {
      const scored = (map.get(group) || [])
        .map((item) => ({ ...item, score: scoreOf(item, keyword) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || a.name.length - b.name.length)
      return { group, label: searchGroupLabels[group], total: scored.length, items: scored.slice(0, limitPerGroup) }
    })
    .filter((entry) => entry.items.length > 0)
}

export const searchIndexSize = () => {
  const map = buildIndex()
  return [...map.values()].reduce((sum, list) => sum + list.length, 0)
}
