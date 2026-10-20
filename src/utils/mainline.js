import mainChapters, { mainEndings, mainStats } from '../data/mainline'

export const chapterById = new Map(mainChapters.map((item) => [item.id, item]))

export function getChapter(id) {
  return chapterById.get(id) || null
}

// 章节分两条链：本体 7 章、DLC 4 章。翻页只在同一条链内走，
// 避免「灰烬王城」的下一章直接跳到 DLC 入口。
export function chapterNeighbors(chapter) {
  const sorted = [...mainChapters].sort((a, b) => a.order - b.order)
  const group = sorted.filter((item) => Boolean(item.dlc) === Boolean(chapter.dlc))
  const index = group.findIndex((item) => item.id === chapter.id)
  return {
    prev: index > 0 ? group[index - 1] : null,
    next: index >= 0 && index < group.length - 1 ? group[index + 1] : null,
  }
}

// 关键词匹配：章节名、区域、目标、步骤正文、BOSS、道具、易错过提示
export function matchChapter(chapter, keyword) {
  const word = (keyword || '').trim().toLowerCase()
  if (!word) return true
  const haystack = [
    chapter.name,
    chapter.subtitle,
    chapter.region,
    chapter.goal,
    chapter.summary,
    chapter.gate,
    chapter.level,
    chapter.rune,
    ...(chapter.steps || []).flatMap((step) => [step.title, step.place, step.detail, step.tip]),
    ...(chapter.bosses || []).flatMap((boss) => [boss.name, boss.place, boss.note]),
    ...(chapter.keyItems || []).flatMap((item) => [item.name, item.note]),
    ...(chapter.warnings || []).map((item) => item.text),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(word)
}

export function bossCount(chapter) {
  return chapter.bosses?.length || 0
}

export function requiredBossNames(chapter) {
  return (chapter.bosses || []).filter((boss) => boss.required).map((boss) => boss.name)
}

export { mainChapters, mainEndings, mainStats }
