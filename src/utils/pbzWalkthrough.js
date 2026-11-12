// 主线流程的展示逻辑：把章节里的 bossIds 还原成 BOSS 条目，并算上/下一章。
// 章节数据只存 id 字符串，避免 walkthrough.js 反向依赖 bosses.js 造成循环引用。

import bosses from '../data/pbz/bosses.js'
import { pbzOrderedChapters } from '../data/pbz/walkthrough.js'

const bossIndex = new Map(bosses.map((boss) => [boss.id, boss]))

// 章节里列出的 BOSS 顺序就是攻略顺序，直接按 bossIds 取，不重新排序
export function chapterBosses(chapter) {
  return (chapter.bossIds || []).map((id) => bossIndex.get(id)).filter(Boolean)
}

export function findChapter(id) {
  return pbzOrderedChapters.find((chapter) => chapter.id === id) || null
}

export function chapterNeighbors(chapter) {
  const index = pbzOrderedChapters.findIndex((item) => item.id === chapter.id)
  return {
    prev: index > 0 ? pbzOrderedChapters[index - 1] : null,
    next: index > -1 && index < pbzOrderedChapters.length - 1 ? pbzOrderedChapters[index + 1] : null,
  }
}

export function chapterHref(chapter) {
  return `/pbz/walkthrough/${encodeURIComponent(chapter.id)}`
}

export function bossHref(boss) {
  return `/pbz/bosses/${encodeURIComponent(boss.id)}`
}

// 章节显示名：3DM 目录没标名的章节，章号后面直接跟区域名，界面上单独标「章名待补」
export function chapterLabel(chapter) {
  return `${chapter.chapter} · ${chapter.title}`
}
