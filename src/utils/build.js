// 构筑器计算层：负重、属性需求、记忆格与 FP
//
// 这里只做纯计算，不碰任何 Vue 状态，方便单独验证。
//
// 数据来源
//   武器重量 / 需求     → data/weapons.js（stats.weight、requirements）
//   护符重量 / 负重加成 → data/talismans.js（weight、effect 文本）
//   法术 FP / 记忆格     → data/sorceries.js、data/incantations.js（fp、slots、req）
//   耐力 → 最大负重      → 官方公式，见 equipLoadFromEndurance
//
// 一条重要的取舍：负重档位按「占最大负重的百分比」判断，而不是自己再推一遍
// 装备总重。百分比是游戏里直接显示的数值，玩家能自己核对，算错也容易发现。

export const ATTRS = [
  { key: 'vigor', label: '生命力' },
  { key: 'mind', label: '集中力' },
  { key: 'endurance', label: '耐力' },
  { key: 'str', label: '力气' },
  { key: 'dex', label: '灵巧' },
  { key: 'int', label: '智力' },
  { key: 'fai', label: '信仰' },
  { key: 'arc', label: '感应' },
]

export const ATTR_LABEL = Object.fromEntries(ATTRS.map((item) => [item.key, item.label]))

// 法术数据里的需求写成中文，这里做一次映射
const REQ_TEXT_TO_KEY = {
  生命力: 'vigor',
  集中力: 'mind',
  耐力: 'endurance',
  力气: 'str',
  力量: 'str',
  灵巧: 'dex',
  智力: 'int',
  信仰: 'fai',
  感应: 'arc',
}

/**
 * 耐力 → 最大负重上限（官方分段公式，「只保留一位小数」）
 *   1–25 级：45 + 27 * (Lvl - 8) / 17
 *   26–60 级：72 + 48 * ((Lvl - 25) / 35) ^ 1.1
 *   61–99 级：120 + 40 * (Lvl - 60) / 39
 * 8 级以下固定 45（公式会给小于 45 的值，和游戏不符）。
 */
export function equipLoadFromEndurance(endurance) {
  const level = Math.min(Math.max(Number(endurance) || 8, 1), 99)
  if (level <= 8) return 45
  let load
  if (level <= 25) load = 45 + (27 * (level - 8)) / 17
  else if (level <= 60) load = 72 + 48 * Math.pow((level - 25) / 35, 1.1)
  else load = 120 + (40 * (level - 60)) / 39
  return Math.round(load * 10) / 10
}

/**
 * 从护符的 effect 文本里读负重加成。
 *
 * 不写死「哪几个护符加负重」的对照表：护符会陆续补（目前缺源辉石 / 小壶 / 大壶的
 * 低阶版本），写死表以后每加一条都要回来改代码。直接解析文案：
 *   「装备重量上限 +19%」「HP +3%、精力 +7%、负重 +5%」
 */
export function loadBonusFromTalismans(talismans) {
  let multiplier = 1
  const sources = []

  talismans.forEach((talisman) => {
    if (!talisman?.effect) return
    const match = String(talisman.effect).match(/(?:装备重量上限|负重)\s*\+?(\d+(?:\.\d+)?)\s*%/)
    if (!match) return
    const bonus = Number(match[1])
    if (!bonus) return
    multiplier *= 1 + bonus / 100
    sources.push({ name: talisman.name, bonus })
  })

  return { multiplier, sources }
}

/** 最大负重：耐力公式 × 护符加成 */
export function maxEquipLoad(endurance, talismans = []) {
  const base = equipLoadFromEndurance(endurance)
  const { multiplier, sources } = loadBonusFromTalismans(talismans)
  return {
    base,
    multiplier,
    sources,
    total: Math.round(base * multiplier * 10) / 10,
  }
}

/**
 * 负重档位。阈值来自游戏内行为：
 *   < 30%     轻负重（翻滚距离最远）
 *   30–69.9%  中负重（无敌帧与轻负重相同）
 *   70–99.9%  重负重（翻滚变短、精力回复变慢、坠落伤害增加）
 *   ≥ 100%    超重（无法翻滚与后跳）
 */
export function loadTier(current, max) {
  if (!max || max <= 0) {
    return { key: 'unknown', label: '—', percent: 0, note: '还没有最大负重' }
  }
  const percent = (current / max) * 100
  if (percent >= 100) {
    return { key: 'overloaded', label: '超重', percent, note: '无法翻滚与后跳，必须先减重或加耐力' }
  }
  if (percent >= 70) {
    return { key: 'heavy', label: '重负重', percent, note: '翻滚变短、精力回复变慢，坠落伤害增加' }
  }
  if (percent >= 30) {
    return { key: 'medium', label: '中负重', percent, note: '无敌帧与轻负重相同，多数流派的标准档位' }
  }
  return { key: 'light', label: '轻负重', percent, note: '翻滚距离最远，适合敏捷 / 法系' }
}

const TIER_RANK = { light: 0, medium: 1, heavy: 2, overloaded: 3 }

/**
 * 要把总重压进目标档位（或更轻），耐力至少需要多少。
 *
 * 从 1 级往上逐级试是笨办法，但只有 99 次迭代，比起把三档阈值反解成公式
 * （分段函数还要取整到一位小数，反解很容易差一级），这样写更好核对：
 * 结果和游戏里「加一点耐力看负重条」的行为完全一致。
 *
 * @returns {{endurance:number,maxLoad:number}|null} 99 耐力也压不进目标档位时返回 null
 */
export function enduranceForTier(weight, talismans = [], targetKey = 'medium') {
  if (!(targetKey in TIER_RANK)) return null
  const target = TIER_RANK[targetKey]
  const load = Number(weight) || 0
  // 空构筑不占负重，任何耐力都满足
  if (load <= 0) return { endurance: 1, maxLoad: maxEquipLoad(1, talismans).total }

  for (let endurance = 1; endurance <= 99; endurance += 1) {
    const { total } = maxEquipLoad(endurance, talismans)
    if (TIER_RANK[loadTier(load, total).key] <= target) return { endurance, maxLoad: total }
  }
  return null
}

/** 比当前档位轻一档的目标；已经在轻负重就不用再劝减重了 */
export function lighterTier(key) {
  const map = { overloaded: 'heavy', heavy: 'medium', medium: 'light' }
  return map[key] || null
}

/**
 * 能不能双手共持。
 * 弓弩与盾牌游戏内不支持双手持握，法杖/圣印记虽然能拿但双手持握没有意义
 * （它们不看力气需求），这里一并排除，免得给出「双手持握满足需求」的错误暗示。
 */
const NO_TWO_HAND = new Set([
  '轻弓', '弓', '大弓', '弩', '弩炮',
  '法杖', '圣印记', '火把',
  '小盾', '中盾', '大盾', '刺盾',
])

export function canTwoHand(type) {
  return !NO_TWO_HAND.has(type)
}

export function tierColor(key) {
  const map = {
    light: '#7e9a5c',
    medium: '#c9a227',
    heavy: '#d98d3f',
    overloaded: '#d9534f',
    unknown: '#6b6555',
  }
  return map[key] || map.unknown
}

/**
 * 解析法术的需求文本：「智力 19 / 信仰 10」→ { int: 19, fai: 10 }
 * 认不出的属性名直接跳过，不猜。
 */
export function parseRequirements(text) {
  if (!text) return {}
  const result = {}
  String(text)
    .split('/')
    .forEach((part) => {
      const match = part.trim().match(/^([\u4e00-\u9fa5]+)\s*(\d+)$/)
      if (!match) return
      const key = REQ_TEXT_TO_KEY[match[1]]
      if (!key) return
      result[key] = Number(match[2])
    })
  return result
}

/**
 * 属性需求检查。
 * @param {object} stats 角色属性
 * @param {object} requirements { str, dex, int, fai, arc }
 * @param {object} [options]
 * @param {boolean} [options.twoHand] 双手持握：力气按 1.5 倍计算（游戏内规则）
 */
export function checkRequirements(stats, requirements, { twoHand = false } = {}) {
  const effective = { ...stats }
  if (twoHand) effective.str = Math.floor((Number(stats.str) || 0) * 1.5)

  return Object.entries(requirements || {})
    .filter(([, need]) => Number(need) > 0)
    .map(([key, need]) => {
      const have = Number(effective[key]) || 0
      return {
        key,
        label: ATTR_LABEL[key] || key,
        need: Number(need),
        have,
        ok: have >= Number(need),
        gap: Math.max(0, Number(need) - have),
      }
    })
}

/** 汇总装备：负重、FP、记忆格 */
export function summarize({ weapons = [], talismans = [], spells = [] }) {
  const weaponWeight = weapons.reduce((sum, item) => sum + (Number(item?.stats?.weight) || 0), 0)
  const talismanWeight = talismans.reduce((sum, item) => sum + (Number(item?.weight) || 0), 0)
  // 大卢恩在护符表里 weight 为 null，按 0 计（游戏里它也不占负重）
  const spellFp = spells.reduce((sum, item) => sum + (Number(item?.fp) || 0), 0)
  const spellSlots = spells.reduce((sum, item) => sum + (Number(item?.slots) || 0), 0)

  return {
    weaponWeight: Math.round(weaponWeight * 10) / 10,
    talismanWeight: Math.round(talismanWeight * 10) / 10,
    totalWeight: Math.round((weaponWeight + talismanWeight) * 10) / 10,
    spellFp,
    spellSlots,
  }
}

/** 记忆格是否够用。memorySlots 由用户按自己背包里的记忆石数量填写 */
export function memoryStatus(used, capacity) {
  const cap = Number(capacity) || 0
  return {
    used,
    capacity: cap,
    ok: used <= cap,
    over: Math.max(0, used - cap),
  }
}

export const DEFAULT_STATS = {
  vigor: 40,
  mind: 20,
  endurance: 25,
  str: 20,
  dex: 20,
  int: 10,
  fai: 10,
  arc: 10,
}

export const STAT_MIN = 1
export const STAT_MAX = 99
