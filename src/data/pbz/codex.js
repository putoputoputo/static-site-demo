// 影之刃零板块的图鉴注册表
//
// 与艾尔登法环的 src/data/codex.js 分开维护：那张表被 utils/search.js、views/ProgressView.vue、
// utils/remembrances.js、scripts/check.mjs 全量遍历，混进来会污染艾尔登法环的搜索与统计。
//
// 字段与 codex.js 保持一致，页面逻辑复用 views/pbz/PbzCodexView.vue 与 PbzCodexDetailView.vue。
// 与艾尔登法环不同的两点：
// - 没有 tier：推荐度是主观评级，这里没有可信来源，不做评级，列表与详情只用 metrics 展示数值。
// - 没有 dlc：本作目前没有 DLC，相关筛选项不出现。

import weapons, { weaponCategories } from './weapons.js'
import phantomEdges, { phantomEdgeCategories } from './phantomEdges.js'

export const pbzModules = {
  weapons: {
    key: 'pbz-weapons',
    path: '/pbz/weapons',
    title: '武器图鉴',
    eyebrow: '主武器 · Weapons',
    intro:
      '主武器只有刀剑一类，分单手、双持、双手三种。每把武器都有自己的独有机制：叠层、形态切换、吸血、冻结、远程处决等。这里按类别整理伤害、破防、连段、独有机制与铸魂效果，数值都标注了对应的武器等级，跨等级不能直接比大小。',
    itemLabel: '武器',
    categoryLabel: '类别',
    items: weapons,
    categories: weaponCategories,
    sortOptions: [
      { value: 'default', label: '默认（按类别）' },
      { value: 'name', label: '名称' },
    ],
    notes: {
      单手: '单手刀剑共 11 把，包含初始武器黑伤。独有机制差别很大：有的靠饮酒把攻击变成飞剑，有的能在三种形态间切换，有的格挡更省杀气但不能招架。',
      双持: '双持共 9 把，标准连段多为 5~6 段、杀气连段多为 4 段，是三类里段数最多的。多数带有随命中积累的槽或层数，攒满后进入强化状态。',
      双手: '双手共 9 把，标准连段多为 4 段、杀气连段多为 2~3 段。武器说明里多数标注了较高的破盾能力，另有吸血、冻结、直接击杀弱敌等机制。',
    },
  },
  phantomEdges: {
    key: 'pbz-phantom-edges',
    path: '/pbz/phantom-edges',
    title: '影之武装图鉴',
    eyebrow: '副武器 · Phantom Edges',
    intro:
      '影之武装是副武器，也是探索工具：斧能砍断铁链，血滴子能远程处决，羽弓能击落悬挂物，琵琶能驱散雾墙。多数一整套消耗 1 格 Remnant Spark，召唤类消耗 2 格，喷火、水柱、战车这类则是持续消耗。这里按五类整理数值、战斗技能与各自对应的地图机关。',
    itemLabel: '影之武装',
    categoryLabel: '类型',
    items: phantomEdges,
    categories: phantomEdgeCategories,
    sortOptions: [
      { value: 'default', label: '默认（按类型）' },
      { value: 'name', label: '名称' },
    ],
    notes: {
      机关: '盾、狮头、水炮、琵琶与血滴子。除了战斗效果，每一件都对应一种地图机关：挡弩箭、烧荆棘、灭火、驱散雾气、操作特制机关。',
      破坏: '斧、锤、炮一类重型武装，多为长按蓄力后出手。wiki 的武轩页面提到，带上巨凶斧这类破盾能力高的影之武装，打重甲敌人会快很多。',
      武技: '锁镰、拳套、流星锤、长枪与剑，都是连按 R2 打出最多 3 段。追命锁镰还能钩住远处的锚点移动。',
      远程: '弓、飞刀、火铳、飞叉。两把弓与黄金火铳对满血的敌人增伤；五件都能在中远距离击落悬挂物。',
      召唤: '三件召唤帮手，一件展开回复结界，都消耗 2 格 Remnant Spark。召唤帮手只能在杀气浓郁的区域（图标发出特殊光芒时）使用，帮手最多战斗 15 秒。',
    },
  },
}

export const pbzList = Object.values(pbzModules)

export function getPbzModule(key) {
  return pbzModules[key] || null
}
