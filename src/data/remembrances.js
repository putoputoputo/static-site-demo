// 追忆兑换数据：25 个追忆 BOSS，每个追忆在圆桌厅堂「解指」恩雅处兑换 1~3 件物品
//
// 名称来源：游民星空《各BOSS追忆与可兑换奖励一览》（本体 15 个）、
// 游民星空 DLC 武器图鉴 + 巴哈姆特 DLC 物品整理 + 百度百科各 BOSS 词条（DLC 10 个）。
// 物品名与站内图鉴（weapons / sorceries / incantations / talismans）对齐，
// 找不到对应图鉴条目的（战灰、道具）只显示名称与类型。
//
// 说明：追忆用掉就没了，但可以在漫步灵庙复制；约定之王拉塔恩的追忆是全游戏唯一可换 3 件的。

export const remembranceNotice =
  '追忆交给恩雅即为消耗，一次只能换一件；需要在同一周目拿第二件，可先去漫步灵庙复制追忆。带铃铛的灵庙只能复制半神追忆，其余追忆任意灵庙都能复制。'

const remembrances = [
  // ==================== 本体 ====================
  {
    id: 'godrick',
    boss: '接肢葛瑞克',
    remembrance: '接肢的追忆',
    dlc: false,
    runes: 20000,
    items: [
      { name: '葛瑞克的王斧', type: '武器' },
      { name: '接肢飞龙', type: '武器' },
    ],
  },
  {
    id: 'rennala',
    boss: '满月女王蕾娜菈',
    remembrance: '满月女王的追忆',
    dlc: false,
    runes: 20000,
    items: [
      { name: '卡利亚权杖', type: '武器' },
      { name: '蕾娜菈的满月', type: '魔法' },
    ],
  },
  {
    id: 'radahn',
    boss: '碎星拉塔恩',
    remembrance: '碎星的追忆',
    dlc: false,
    runes: 40000,
    items: [
      { name: '碎星大剑', type: '武器' },
      { name: '狮子大弓', type: '武器' },
    ],
  },
  {
    id: 'regal-ancestor',
    boss: '祖灵之王',
    remembrance: '祖灵之王的追忆',
    dlc: false,
    runes: 30000,
    items: [
      { name: '展翼大角', type: '武器' },
      { name: '祖灵角', type: '护符' },
    ],
  },
  {
    id: 'astel',
    boss: '黑暗弃子艾丝缇',
    remembrance: '黑暗弃子的追忆',
    dlc: false,
    runes: 30000,
    items: [
      { name: '弃子的繁星', type: '武器' },
      { name: '黑暗波动', type: '战灰' },
    ],
  },
  {
    id: 'hoarah-loux',
    boss: '荷莱·露',
    remembrance: '荷莱·露的追忆',
    dlc: false,
    runes: 30000,
    items: [
      { name: '葛孚雷的王斧', type: '武器' },
      { name: '荷莱·露的撼地', type: '战灰' },
    ],
  },
  {
    id: 'maliketh',
    boss: '黑剑玛利喀斯',
    remembrance: '黑剑的追忆',
    dlc: false,
    runes: 30000,
    items: [
      { name: '玛利喀斯的黑剑', type: '武器' },
      { name: '黑剑', type: '祷告' },
    ],
  },
  {
    id: 'rykard',
    boss: '亵渎君王拉卡德',
    remembrance: '亵渎君王的追忆',
    dlc: false,
    runes: 50000,
    items: [
      { name: '拉卡德的怨魂', type: '魔法' },
      { name: '亵渎圣剑', type: '武器' },
    ],
  },
  {
    id: 'fire-giant',
    boss: '火焰巨人',
    remembrance: '火焰巨人的追忆',
    dlc: false,
    runes: 30000,
    items: [
      { name: '巨人红发鞭', type: '武器' },
      { name: '火焰啊，吞噬一切！', type: '祷告' },
    ],
  },
  {
    id: 'morgott',
    boss: '恶兆王蒙葛特',
    remembrance: '恶兆王的追忆',
    dlc: false,
    runes: 30000,
    items: [
      { name: '蒙葛特咒剑', type: '武器' },
      { name: '王室恶兆幼子像', type: '道具' },
    ],
  },
  {
    id: 'placidusax',
    boss: '龙王普拉顿桑克斯',
    remembrance: '龙王的追忆',
    dlc: false,
    runes: 30000,
    items: [
      { name: '龙王岩剑', type: '武器' },
      { name: '普拉顿桑克斯的凋亡', type: '祷告' },
    ],
  },
  {
    id: 'fortissax',
    boss: '死龙弗尔桑克斯',
    remembrance: '死龙的追忆',
    dlc: false,
    runes: 30000,
    items: [
      { name: '弗尔桑克斯的雷枪', type: '祷告' },
      { name: '死亡雷击', type: '祷告' },
    ],
  },
  {
    id: 'elden-beast',
    boss: '艾尔登之兽',
    remembrance: '艾尔登的追忆',
    dlc: false,
    runes: 50000,
    items: [
      { name: '玛莉卡的石槌', type: '武器' },
      { name: '神躯化剑', type: '武器' },
    ],
  },
  {
    id: 'malenia',
    boss: '玛莲妮亚',
    remembrance: '腐败女神的追忆',
    dlc: false,
    runes: 50000,
    items: [
      { name: '玛莲妮亚的义手刀', type: '武器' },
      { name: '猩红艾奥尼亚', type: '祷告' },
    ],
  },
  {
    id: 'mohg',
    boss: '鲜血君王蒙格',
    remembrance: '鲜血君王的追忆',
    dlc: false,
    runes: 30000,
    items: [
      { name: '蒙格温圣矛', type: '武器' },
      { name: '授血', type: '祷告' },
    ],
  },

  // ==================== 黄金树幽影 ====================
  {
    id: 'dancing-lion',
    boss: '神兽舞狮',
    remembrance: '舞狮的追忆',
    dlc: true,
    runes: null,
    items: [
      { name: '狂怒神兽', type: '护符' },
      { name: '神兽冻霜踏地', type: '战灰' },
    ],
  },
  {
    id: 'rellana',
    boss: '双月骑士蕾菈娜',
    remembrance: '双月骑士的追忆',
    dlc: true,
    runes: null,
    items: [
      { name: '蕾菈娜的对剑', type: '武器' },
      { name: '蕾菈娜的双月', type: '魔法' },
    ],
  },
  {
    id: 'putrescent-knight',
    boss: '融泥骑士',
    remembrance: '融泥的追忆',
    dlc: true,
    runes: null,
    items: [
      { name: '融泥大柴刀', type: '武器' },
      { name: '融泥漩', type: '魔法' },
    ],
  },
  {
    id: 'gaius',
    boss: '老将盖乌斯',
    remembrance: '山猪骑士的追忆',
    dlc: true,
    runes: null,
    items: [
      { name: '剑型长矛', type: '武器' },
      { name: '岩块刀刃', type: '魔法' },
    ],
  },
  {
    id: 'scadutree-avatar',
    boss: '幽影树化身',
    remembrance: '影轮草的追忆',
    dlc: true,
    runes: null,
    items: [
      { name: '影轮草大花', type: '武器' },
      { name: '幽影之地', type: '祷告' },
    ],
  },
  {
    id: 'romina',
    boss: '花蕾圣女萝蜜娜',
    remembrance: '花蕾圣女的追忆',
    dlc: true,
    runes: null,
    items: [
      { name: '花蕾刀', type: '武器' },
      { name: '腐败蝶', type: '祷告' },
    ],
  },
  {
    id: 'midra',
    boss: '癫火之王米德拉',
    remembrance: '癫火之王的追忆',
    dlc: true,
    runes: null,
    items: [
      { name: '永罚大剑', type: '武器' },
      { name: '米德拉的癫火', type: '祷告' },
    ],
  },
  {
    id: 'metyr',
    boss: '指头之母梅蒂尔',
    remembrance: '指头之母的追忆',
    dlc: true,
    runes: null,
    items: [
      { name: '无上远方杖', type: '武器' },
      { name: '凝望指头', type: '武器' },
    ],
  },
  {
    id: 'messmer',
    boss: '穿刺者梅瑟莫',
    remembrance: '穿刺者的追忆',
    dlc: true,
    runes: null,
    items: [
      { name: '穿刺者矛', type: '武器' },
      { name: '梅瑟莫的火球', type: '祷告' },
    ],
  },
  {
    id: 'promised-consort',
    boss: '约定之王拉塔恩',
    remembrance: '神祇与王的追忆',
    dlc: true,
    runes: null,
    // 全游戏唯一可以三选一的追忆
    items: [
      { name: '拉塔恩的大剑（王）', type: '武器' },
      { name: '拉塔恩的大剑（光）', type: '武器' },
      { name: '米凯拉的光', type: '祷告' },
    ],
  },
]

export const remembranceTypes = ['武器', '魔法', '祷告', '护符', '战灰', '道具']

// 追忆物品的类别 → 站内图鉴模块
export const typeToModule = {
  武器: 'weapons',
  魔法: 'sorceries',
  祷告: 'incantations',
  护符: 'talismans',
}

export const remembranceStats = {
  total: remembrances.length,
  base: remembrances.filter((item) => !item.dlc).length,
  dlc: remembrances.filter((item) => item.dlc).length,
  items: remembrances.reduce((sum, item) => sum + item.items.length, 0),
}

export default remembrances
