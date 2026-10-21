// 推荐配装标签 → 图鉴条目的解析
//
// 配装数据里存的是「给人看的自由文本」，不是图鉴 id：
//   打刀（主手） / 火焰啊，赐予我力量！（可选） / 副手盾牌或第二把同系武器
// 这里先剥掉括号后缀（主手 / 可选），再查别名表，最后按名称精确匹配。
// 匹配不到的一律返回 item: null，由页面降级成纯文本 —— 不做模糊匹配，
// 错链到另一件护符比不链接更糟。

import { codexModules } from '../data/codex.js'
import weapons from '../data/weapons.js'

const SUFFIX_RE = /[（(]([^（）()]*)[）)]\s*$/

// 早期数据里的别称 / 错译。键是「剥后缀之后的文本」，值是图鉴里的正式名称。
// 已经能精确命中的不要往这里放，否则会掩盖真正的重名问题。
export const BUILD_TAG_ALIAS = {
  // 错译已经在数据层统一改过（红羽剩徽记 → 红羽七刃剑 等 135 处），
  // 这里只留跨模块重名的情况：护符「黄金树的恩惠」与祷告「黄金树恩惠」只差一个「的」。
  talismans: {},
  sorceries: {},
  incantations: { 黄金树的恩惠: '黄金树恩惠' },
  weapons: {},
}

// 拆出正文与括号备注：「打刀（主手）」→ { core: '打刀', note: '主手' }
export function splitBuildTag(tag) {
  const text = String(tag || '').trim()
  const matched = text.match(SUFFIX_RE)
  if (!matched) return { text, note: '' }
  return { text: text.slice(0, matched.index).trim(), note: matched[1].trim() }
}

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

export function resolveBuildTag(key, tag) {
  const { text, note } = splitBuildTag(tag)
  const map = nameIndex(key)
  const alias = BUILD_TAG_ALIAS[key]?.[text]
  const item = map.get(text) || (alias ? map.get(alias) || null : null)
  return { text, note, item }
}

export function buildTagHref(key, item) {
  if (!item) return ''
  const base = key === 'weapons' ? '/weapons' : codexModules[key]?.path
  if (!base) return ''
  return `${base}/${encodeURIComponent(item.id)}`
}

export function linkBuildTags(key, tags = []) {
  return tags.map((tag, index) => {
    const { text, note, item } = resolveBuildTag(key, tag)
    return {
      // 同一组里可能出现两个相同文本（不常见），用序号兜底保证 key 唯一
      key: `${text}-${index}`,
      text,
      note,
      to: buildTagHref(key, item),
    }
  })
}
