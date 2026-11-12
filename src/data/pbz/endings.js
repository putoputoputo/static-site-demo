// 《影之刃零》结局、难度与战斗机制数据
//
// 数据口径（2026-11 整理）：
// - 结局条件、难度规则、机制说明：Fextralife 英文 wiki、英文与中文维基百科（见每条 source）。
// - 中文结局名与章节名：3DM《全结局通关流程攻略》目录页的官方中文名。
//   英文 wiki 的 Long's Roar 在 3DM 目录里没有对应的中文标题，中文名留空、不自行翻译。
// - 官方术语（杀气、鬼步、铸魂、影之武装、蓝光 / 红光攻击、四档难度）来自中文维基百科条目《影之刃零》。

const WIKI = 'https://phantombladezero.wiki.fextralife.com/'
const ZH_WIKI = 'https://zh.wikipedia.org/wiki/影之刃零'
const EN_WIKI = 'https://en.wikipedia.org/wiki/Phantom_Blade_Zero'

// [id, 中文名, 英文名, 触发条件, 说明, 出处]
const endingRows = [
  [
    'annihilation', '湮灭', 'Annihilation',
    '没有完成特定的可选任务线。',
    '魂没有足够的力量击败「圣母」（Meng Hua），她以 Blight 之力毁灭了世界。',
    `${WIKI}Endings`,
  ],
  [
    'longs-roar', null, "Long's Roar",
    '完成了决战结局所需的全部任务，但没有掌握「血脉觉醒」。',
    '魂击败了「圣母」，但她随后被左殇所杀。左殇说自己打算找到控制 Blight 的办法，以此保护世界；魂与左殇交手却无力取胜，左殇最终放过了魂，让他好好利用所剩不多的时间。',
    `${WIKI}Endings`,
  ],
  [
    'final-battle', '决战', 'Final Battle',
    '完成全部必要任务，并掌握「血脉觉醒」。3DM 把它标注为「真结局」。',
    '魂凭血脉觉醒击败左殇，左殇跳崖自尽以免死于魂之手，魂取回了 Radiant Heart。',
    `${WIKI}Endings`,
  ],
  [
    'undying-grudge', '饮恨', 'Undying Grudge',
    '「六十六天」难度专属：永久死亡生效、魂彻底身死。3DM 记作「结局 饮恨（66 天用完）」。',
    '左殇来到魂的墓前，承诺重整武林。',
    `${WIKI}Endings`,
  ],
]

// [id, 名称, 难度定位, 规则]
const difficultyRows = [
  ['wayfarer', '入阵者', '简单', '简单难度。补丁 1.0302256 下调了新娘阿花在这一档与「破局者」下的抓取频率。'],
  ['pathbreaker', '破局者', '中等', '中等难度。'],
  ['hellwalker', '逆天者', '困难', '敌人的 AI 更先进、更会适应玩家的打法。'],
  ['sixty-six-days', '六十六天', '困难 + 永久死亡', '玩法与「逆天者」相同，但会显示一个从 66 开始、每死亡一次减 1 的计数器；计数器归零即触发永久死亡，并进入「饮恨」结局。'],
]

// [名称, 说明, 出处]
const mechanicRows = [
  [
    '杀气（Sha-Chi）',
    '战斗资源。格挡与杀气攻击（重攻击）都会消耗杀气，切换武器（有冷却）会完全恢复杀气。削空敌人的杀气可以让它陷入破防状态。',
    ZH_WIKI,
  ],
  [
    '蓝光攻击 / 红光攻击',
    '敌人的部分攻击会用颜色预先提示。蓝光攻击格挡会消耗大量杀气；红光攻击无法格挡或招架，只能闪避。',
    ZH_WIKI,
  ],
  [
    '鬼步',
    '完美招架蓝光攻击、或在红光攻击即将命中前闪避成功，会触发鬼步，魂瞬间移动到敌人身后。',
    ZH_WIKI,
  ],
  [
    '装备栏位',
    '可同时携带 2 件主武器、2 件影之武装、2 种药品与 6 件饰品。主武器都是刀剑类，影之武装则涵盖斧、枪、锤、弓、火铳、火炮等。',
    EN_WIKI,
  ],
  [
    '铸魂（Soul Temper）',
    '武器可以消耗材料升级，部分武器能通过铸魂转换成另一种形态（例如黑伤双刃 → Shadowless Edge），获得新技能；也可以重置升级并返还材料。',
    ZH_WIKI,
  ],
  [
    '影之武装的探索用途',
    '影之武装不只是副武器：部分机关与地图只能用特定的影之武装处理（例如用巨凶斧砍断铁链、用羽弓击落悬挂物、用幻术琵琶驱散雾气），有些区域需要后期取得特定影之武装后才能进入。',
    `${WIKI}Phantom_Edges`,
  ],
  [
    '升级材料',
    '技能树的升级消耗 Remnant Dust，以及黑石、杀气琥珀、记忆之花或榕树之心；主武器、影之武装、药品与饰品也都可以升级。',
    EN_WIKI,
  ],
  [
    '新游戏 +（NG+）',
    '游戏设有新游戏 +（NG+）模式。',
    EN_WIKI,
  ],
]

// 章节名与顺序来自 3DM 攻略目录；中间章节该目录未逐一标名，这里只列出有出处的前四章与后两章
// [章节, 区域]
const chapterRows = [
  ['序 · 物是人非', '基础教学'],
  ['第一章 · 逆流直上', '悲泣溪谷'],
  ['第二章 · 林中血，镜中蛇', '血色森林'],
  ['第三章 · 失心村', '陆家村'],
  ['第四章 · 死镇', '庞镇'],
  ['第八章 · 戏梦山庄', '戏梦山庄'],
  ['最终章 · 断魂山', '断魂山'],
]

export const endings = endingRows.map(([id, nameZh, nameEn, condition, summary, source]) => ({
  id,
  name: nameZh || nameEn,
  nameEn,
  zhPending: nameZh === null,
  condition,
  summary,
  source,
}))

export const difficulties = difficultyRows.map(([id, name, tier, text]) => ({ id, name, tier, text }))

export const mechanics = mechanicRows.map(([name, text, source]) => ({ name, text, source }))

export const chapters = chapterRows.map(([name, region]) => ({ name, region }))

export const endingStats = {
  total: endings.length,
  difficulties: difficulties.length,
  zhPending: endings.filter((item) => item.zhPending).length,
}

export default endings
