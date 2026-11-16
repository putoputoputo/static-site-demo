// 全站搜索：一次输入，跨两个游戏的 15 个模块查
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
import { archetypes } from '../data/archetypes.js'
// 影之刃零：四个模块共 120 条。数据文件本身不大（合计约 1700 行），
// 且整个索引是首次打开搜索框才 import 的，不会进首屏 chunk。
import pbzWeapons from '../data/pbz/weapons.js'
import pbzEdges from '../data/pbz/phantomEdges.js'
import pbzBosses from '../data/pbz/bosses.js'
import { pbzArchetypes, pbzArchetypeStages } from '../data/pbz/archetypes.js'
import { pbzOrderedChapters } from '../data/pbz/walkthrough.js'
// 旅游：18 个景点 + 3 条经典路线。只在打开搜索框时加载，不影响首屏。
import { travelSpots } from '../data/travel/spots.js'
import { travelAreas } from '../data/travel/areas.js'
import { classicRoutes } from '../data/travel/routes.js'

export const searchGroupOrder = [
  'weapons',
  'talismans',
  'sorceries',
  'incantations',
  'spirits',
  'quests',
  'main',
  'regions',
  'bosses',
  'remembrances',
  'archetypes',
  // 影之刃零排在法环之后、工具之前：两个游戏的结果不交叉，
  // 保持「先看到的永远是当前主站内容」的顺序
  'pbzWeapons',
  'pbzEdges',
  'pbzBosses',
  'pbzArchetypes',
  'pbzChapters',
  'travelRoutes',
  'travelSpots',
  'tools',
]

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
  archetypes: '流派',
  pbzWeapons: '影之刃零 · 武器',
  pbzEdges: '影之刃零 · 影之武装',
  pbzBosses: '影之刃零 · BOSS',
  pbzArchetypes: '影之刃零 · 流派',
  pbzChapters: '影之刃零 · 流程',
  travelRoutes: '旅游 · 经典路线',
  travelSpots: '旅游 · 北京景点',
  tools: '工具',
}

// 工具页没有「条目」，但玩家会直接搜「负重」「配装」「进度」，
// 所以给两个工具页各放一条静态索引，命中后直接跳到页面。
const toolEntries = [
  {
    name: '构筑器',
    sub: '工具 · 负重 / 需求 / 记忆格',
    extra: '配装 装配 加点 属性需求 装备重量 负重档位 记忆格 记忆石 FP 双手持握 预设法术 武器 护符 build',
    to: '/build',
  },
  {
    name: '我的进度',
    sub: '工具 · 主线 / 支线 / 收藏总览',
    extra: '进度 已完成 通关 收藏 备份 导入 导出 存档 换设备',
    to: '/progress',
  },
]

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

  // 流派：搜「出血」「跳劈」「岩石球」都能落到具体那套。
  // 这里直接读 data，不引 utils/archetypes —— 搜索只需要名字和关键词，
  // 没必要为了索引再跑一遍负重计算。
  const stageLabels = { starter: '开局速成', mid: '中期成型', late: '后期毕业' }
  archetypes.forEach((item) => {
    push(map, 'archetypes', {
      name: item.name,
      sub: `流派 · ${item.primary} · ${stageLabels[item.stage] || item.stage}`,
      extra: [
        ...(item.alias || []),
        ...(item.tags || []),
        item.summary,
        item.hook?.[0],
        item.core.main,
        item.core.off,
        ...(item.core.talismans || []),
        ...(item.core.spells || []),
        item.core.spirit,
        ...(item.loop || []),
      ]
        .filter(Boolean)
        .join(' '),
      to: `/archetypes/${item.id}`,
    })
  })

  // 影之刃零：图鉴与 BOSS 都直接指向详情页。
  // extra 里放英文名、机制、获取位置与招式全文，这样搜「残钢」「召唤」「铃铛」
  // 都能落到条目，而不是只能靠名称前缀命中。
  pbzWeapons.forEach((item) => {
    push(map, 'pbzWeapons', {
      name: item.name,
      sub: `武器 · ${item.category}${item.zhPending ? ' · 中文名待补' : ''}`,
      extra: [item.nameEn, item.effect, item.location, item.forge, ...(item.moves || []).map((move) => `${move.label} ${move.text}`)]
        .filter(Boolean)
        .join(' '),
      to: `/pbz/weapons/${encodeURIComponent(item.id)}`,
    })
  })

  pbzEdges.forEach((item) => {
    push(map, 'pbzEdges', {
      name: item.name,
      sub: `影之武装 · ${item.category}${item.zhPending ? ' · 中文名待补' : ''}`,
      extra: [item.nameEn, item.effect, item.useHint, item.location]
        .filter(Boolean)
        .join(' '),
      to: `/pbz/phantom-edges/${encodeURIComponent(item.id)}`,
    })
  })

  pbzBosses.forEach((boss) => {
    push(map, 'pbzBosses', {
      name: boss.name,
      sub: `BOSS · ${boss.region}${boss.zhPending ? ' · 中文名待补' : ''}`,
      extra: [boss.nameEn, boss.place, boss.drop, boss.tips].filter(Boolean).join(' '),
      to: `/pbz/bosses/${encodeURIComponent(boss.id)}`,
    })
  })

  // 流派按「别名 + 机制 + 核心装备 + 饰品 / 秘药 / 能力」建索引：
  // 玩家通常搜的是「流血」「招架」「黄金火铳」这种词，而不是流派名本身
  pbzArchetypes.forEach((item) => {
    const stage = pbzArchetypeStages.find((entry) => entry.key === item.stage)
    push(map, 'pbzArchetypes', {
      name: item.name,
      sub: `流派 · ${item.role} · ${stage ? stage.label : item.stage}`,
      extra: [
        ...(item.alias || []),
        item.summary,
        ...(item.tags || []),
        ...(item.hook || []),
        ...(item.core.weapons || []),
        ...(item.core.edges || []),
        ...(item.core.accessories || []).map((entry) => `${entry.name} ${entry.effect}`),
        ...(item.core.medicines || []).map((entry) => `${entry.name} ${entry.effect}`),
        ...(item.core.abilities || []).map((entry) => `${entry.name} ${entry.effect}`),
        ...(item.phases || []).flatMap((phase) => [phase.title, phase.goal, ...(phase.steps || [])]),
      ]
        .filter(Boolean)
        .join(' '),
      to: `/pbz/archetypes/${encodeURIComponent(item.id)}`,
    })
  })

  // 主线流程：搜「流程」「失心村」「廊桥」「锁链」这类词都应该能落到章节
  pbzOrderedChapters.forEach((chapter) => {
    push(map, 'pbzChapters', {
      name: chapter.title,
      sub: `流程 · ${chapter.chapter} · ${chapter.region}${chapter.pending ? ' · 步骤待补' : ''}`,
      extra: [
        chapter.title,
        chapter.chapter,
        chapter.region,
        chapter.goal,
        chapter.summary,
        ...chapter.steps.flatMap((step) => [step.title, step.place, step.detail, step.tip]),
        ...(chapter.keyItems || []).flatMap((item) => [item.name, item.note]),
        ...(chapter.missable || []),
        '主线 流程 攻略 章节 推进 铃铛 门槛',
      ]
        .filter(Boolean)
        .join(' '),
      to: `/pbz/walkthrough/${encodeURIComponent(chapter.id)}`,
    })
  })

  // 旅游：景点按名称、别名、片区、门票与预约条件都能搜到
  travelSpots.forEach((spot) => {
    const area = travelAreas.find((item) => item.id === spot.area)
    push(map, 'travelSpots', {
      name: spot.name,
      sub: `旅游 · ${area ? area.name : ''}${spot.wall ? ' · 长城' : ''}${spot.remote ? ' · 远郊' : ''}`,
      extra: [
        spot.name,
        ...(spot.alias || []),
        spot.district,
        area ? area.name : '',
        spot.bestTime,
        spot.entry,
        ...(spot.access || []).map((item) => item.text),
        ...(spot.conditions || []),
        ...(spot.tips || []),
        spot.ticket && spot.ticket.free ? '免费' : '',
        spot.booking && spot.booking.required ? '需预约 预约' : '',
        spot.hours ? spot.hours.closed : '',
        '北京 景点 门票 预约 开放时间 怎么去',
      ]
        .filter(Boolean)
        .join(' '),
      to: `/travel/spots/${encodeURIComponent(spot.id)}`,
    })
  })

  // 旅游：经典路线搜「三天」「春节」「中轴」都能落到对应路线
  classicRoutes.forEach((route) => {
    push(map, 'travelRoutes', {
      name: route.name,
      sub: `旅游 · ${route.days} 天 · ${route.tagline}`,
      extra: [
        route.name,
        route.tagline,
        route.level,
        route.bestFor,
        route.summary,
        ...route.tips,
        ...route.skip,
        route.itinerary.flatMap((day) => day.title || '').join(' '),
        `${route.days} 天 路线 行程 攻略 春节`,
      ]
        .filter(Boolean)
        .join(' '),
      to: '/travel/routes',
    })
  })

  toolEntries.forEach((entry) => push(map, 'tools', entry))

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
