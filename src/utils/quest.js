import quests, { REGION_ORDER } from '../data/quests'

export const LENGTH_LABELS = {
  短: '短',
  中: '中',
  长: '长',
}

export const LENGTH_COLORS = {
  短: '#7fb2a8',
  中: '#c9a227',
  长: '#c16b4f',
}

export const questById = new Map(quests.map((item) => [item.id, item]))

export function getQuest(id) {
  return questById.get(id) || null
}

// 排序：先按区域顺序，再按 DLC / 名称
export function sortQuests(list) {
  return [...list].sort((a, b) => {
    const ra = REGION_ORDER.get(a.region) ?? 99
    const rb = REGION_ORDER.get(b.region) ?? 99
    if (ra !== rb) return ra - rb
    if (a.dlc !== b.dlc) return a.dlc ? 1 : -1
    return a.name.localeCompare(b.name, 'zh-Hans-CN')
  })
}

// 关键词匹配：名称、NPC、区域、简介、步骤、奖励、分支
export function matchQuest(quest, keyword) {
  const word = (keyword || '').trim().toLowerCase()
  if (!word) return true
  const haystack = [
    quest.name,
    quest.npc,
    quest.region,
    quest.summary,
    ...(quest.startPoint ? [quest.startPoint] : []),
    ...(quest.prerequisites || []),
    ...(quest.rewards || []).flatMap((r) => [r.name, r.note]),
    ...(quest.steps || []).flatMap((s) => [s.title, s.place, s.detail, s.tip]),
    ...(quest.branches || []).flatMap((b) => [b.label, b.effect]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(word)
}

// 步骤总数，用于展示工作量 / 进度
export function stepCount(quest) {
  return quest.steps?.length || 0
}

// 同区域的其它支线（用于详情页侧栏）
export function siblingsOf(quest, limit = 6) {
  return quests
    .filter((item) => item.id !== quest.id && item.region === quest.region)
    .slice(0, limit)
}

// 上一条 / 下一条：按全量排序后的位置
export function neighborsOf(quest) {
  const ordered = sortQuests(quests)
  const index = ordered.findIndex((item) => item.id === quest.id)
  return {
    prev: index > 0 ? ordered[index - 1] : null,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null,
  }
}
