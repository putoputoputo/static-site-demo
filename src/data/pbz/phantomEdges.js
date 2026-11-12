// 《影之刃零》影之武装（Phantom Edges）图鉴数据
//
// 数据口径（2026-11 整理）：
// - 分类、数值、战斗技能、探索用途、获取方式：Fextralife 英文 wiki 各影之武装页（见每条的 source）。
//   面板数值在各页面标注的等级不同，这里原样带上等级；wiki 未标注等级的写「未标注」。
// - 中文名：3DM《全流程 全收集图文攻略》目录页与《全结局通关流程攻略》目录页中出现的官方中文名，
//   没有出现的 nameZh 留 null，不自行翻译。
// - Remnant Spark 是使用影之武装消耗的资源，沿用英文版名称。

const WIKI = 'https://phantombladezero.wiki.fextralife.com/'

// [id, 中文名, 英文名, 类别, 数值[[标签, 值]], 面板等级, 战斗技能, 探索用途, 获取, wiki 页面名]
const rows = [
  // ==================== 机关 ====================
  [
    'bastion', '拙壁盾', 'Bastion', '机关', [['伤害', 226], ['破防', 198]], 1,
    '长按 R2 举盾挡下所有攻击，举盾时按 L1 推开正面敌人。举盾持续消耗杀气，杀气耗尽盾会碎裂；在耗尽前松开 R2 会砸地放出冲击波，举盾期间吸收的伤害越多冲击波越强。消耗 1 格 Remnant Spark。',
    '可以挡下连弩机关射出的弩箭（Bolt Ward）。',
    '陆家村：击败主线 BOSS「拙壁」掉落。',
    'Bastion',
  ],
  [
    'flaming-mane', '烈焰狮头', 'Flaming Mane', '机关', [['伤害', 248], ['异常积累', 178]], 1,
    '按 R2 喷出一道火焰，造成伤害并点燃敌人，持续消耗 Remnant Spark。',
    '获得后即使不装备，也能烧掉潮湿的荆棘。',
    '庞镇：击败舞狮尊主后得到「熄火烈焰狮头」，带到 Jingyang Hall 铃铛处，进门找 NPC Lei Dang 修复。',
    'Flaming_Mane',
  ],
  [
    'flying-guillotine', '血滴子', 'Flying Guillotine', '机关', [['伤害', 380], ['破防', 309]], 1,
    '连按 R2 打出最多 3 段中距离攻击，整套消耗 1 格 Remnant Spark。敌人可被处决时按 R2 可以远程处决。',
    '获得后即使不装备，也能操作荒行子特制的机关。',
    '枷笼山：击败 BOSS「荒行子」掉落。',
    'Flying_Guillotine',
  ],
  [
    'illusory-pipa', '幻术琵琶', 'Illusory Pipa', '机关', [['伤害', 276], ['破防', 234]], 1,
    '连按 R2 放出 2 道蓝色音刃和 1 道红色音刃，整套消耗 1 格 Remnant Spark。蓝色音刃削减杀气，红色音刃伤害更高且无视减伤，两者都无法被格挡；红色音刃命中破防的敌人会将其控制，让它攻击其他敌人（对强敌无效）。',
    '获得后即使不装备，也能驱散遮蔽幻境屏障的雾气。',
    '梅谷湖：完成「浮华引」任务线，集齐幻术琵琶的全部部件后交给 Myst 获得。',
    'Illusory_Pipa',
  ],
  [
    'you-loongs-deluge', '游龙头', "You Loong's Deluge", '机关', [['伤害', 382], ['破防', 342]], 10,
    '长按 R2 喷出高压水柱，持续消耗 Remnant Spark。攻击附加潮湿：敌人更怕雷与冰，同时对持火属性武器的敌人增伤。',
    '可以扑灭地面的火焰；获得后即使不装备，也能熄灭燃烧的荆棘。',
    '庞镇：击败 BOSS「游龙」（Green Serpent House 铃铛以西的水域）掉落。',
    'You_Loong%27s_Deluge',
  ],

  // ==================== 破坏 ====================
  [
    'dread-axe', '巨凶斧', 'Dread Axe', '破坏', [['伤害', 309], ['破防', 208]], null,
    '长按 R2 蓄力，最多 2 段，松开劈出一记重斩，蓄力段数越高伤害越高。消耗 1 格 Remnant Spark。',
    '获得后即使不装备，也能劈断拦路的铁链。',
    '悲泣溪谷：在 Mandate Outpost 外击败 BOSS「斧老大彭猛」掉落，是流程中获得的第一件影之武装。',
    'Dread_Axe',
  ],
  [
    'bashpole', '长柄金瓜', 'Bashpole', '破坏', [['伤害', 221], ['破防', 237]], 1,
    '长按 R2 抡动金瓜大范围横扫，松开以一记震地重砸收尾。消耗 1 格 Remnant Spark。',
    '获得后即使不装备，也能砸开封住地面的木板。',
    '正道大营：击败 BOSS「万钧」掉落。',
    'Bashpole',
  ],
  [
    'wolfjaw', '贪狼', 'Wolfjaw', '破坏', [['伤害', 261], ['破防', 280]], 1,
    '长按 R2 挥击敌人并吸取生命回复自身，对人偶等无血肉的敌人无效。消耗 1 格 Remnant Spark。',
    '无。',
    '庞镇：击败 BOSS「武轩」掉落。',
    'Wolfjaw',
  ],
  [
    'tiger-cannon', '虎炮', 'Tiger Cannon', '破坏', [['伤害', 310], ['异常积累', 208]], 1,
    '长按 R2 蓄力，最多 3 段，松开射出一发炮弹，蓄力段数越高伤害越高。消耗 1 格 Remnant Spark。可以引爆爆炸物，也能击碎被冻结的敌人（精英除外）。',
    '获得后即使不装备，也能轰开脆弱的石墙。',
    '戏梦山庄（Mirage Estate）：击败 BOSS Lei Dang 掉落。',
    'Tiger_Cannon',
  ],
  [
    'war-wagon', null, 'War Wagon', '破坏', [['伤害', 310], ['破防', 208]], 1,
    '长按 R2 召唤战车向前冲撞沿途敌人，冲锋中可以转向，持续消耗 Remnant Spark。',
    '无。',
    '梅谷湖：完成「归途」任务后，乘船前往西北的 Frozen Lake Dock 铃铛，Old Man Gen 会把它交给魂。',
    'War_Wagon',
  ],

  // ==================== 武技 ====================
  [
    'hunters-chain-sickle', '追命锁镰', "Hunter's Chain Sickle", '武技', [['伤害', 963], ['破防', 831]], 30,
    '按 R2 打出最多 3 段中远距离斩击，整套消耗 1 格 Remnant Spark。镰刃造成主要伤害，锁链部分只有镰刃伤害的 30%。',
    '获得后即使不装备，也能钩住远处的锚点进行移动。',
    '悲泣溪谷：在 Great Waterfall 击败章末 BOSS「追命」第二形态后掉落。',
    'Hunter%27s_Chain_Sickle',
  ],
  [
    'iron-gauntlets', '铁拳套', 'Iron Gauntlets', '武技', [['伤害', 1018], ['破防', 870]], 30,
    '连按 R2 打出最多 3 段拳击，整套消耗 1 格 Remnant Spark。每次命中积累 Fist Focus，8 秒内提高主武器造成的所有伤害。破盾能力强。',
    '无。',
    '血色森林：从 Mirrorwood Entrance 铃铛沿路下梯子，击败 BOSS「铁狂」掉落。',
    'Iron_Gauntlets',
  ],
  [
    'fire-meteor', '火流星', 'Fire Meteor', '武技', [['伤害', 380], ['异常积累', 309]], 1,
    '连按 R2 打出最多 3 段中远距离挥击，整套消耗 1 格 Remnant Spark。附带磷火：绿色火焰点燃敌人，造成伤害的同时降低其攻击力。',
    '无。',
    '庞镇：在 South Gate Bridge 铃铛之后击败进城后的第一个主线 BOSS 掉落（3DM 目录记作「火流星」，wiki 记作 Blaze, Phosphor Consciousness）。',
    'Fire_Meteor',
  ],
  [
    'thunder-spear', '雷霆枪', 'Thunder Spear', '武技', [['伤害', 450], ['异常积累', 360]], 1,
    '连按 R2 打出最多 3 段枪法，整套消耗 1 格 Remnant Spark。攻击附带麻痹并放出雷电。',
    '获得后即使不装备，也能在中远距离击落某些悬挂物。',
    '庞镇：在 Ancestral Shrine Square 铃铛之后击败 BOSS「长鸿」掉落。',
    'Thunder_Spear',
  ],
  [
    'ink-cut', '墨血无痕', 'Ink Cut', '武技', [['伤害', 400], ['破防', 324]], 1,
    '连按 R2 打出最多 3 段中距离剑击，整套消耗 1 格 Remnant Spark。在第二段后收招会留下一柄旋转的剑持续伤害敌人，5 秒后引爆。',
    '无。',
    '枷笼山：完成「英雄悲歌」任务获得。',
    'Ink_Cut',
  ],

  // ==================== 远程 ====================
  [
    'feather-bow', '羽弓', 'Feather Bow', '远程', [['伤害', 309], ['破防', 208]], 30,
    '长按 R2 蓄力，松开射出一箭，消耗 1 格 Remnant Spark。对满血的敌人增伤。',
    '获得后即使不装备，也能在中远距离击落某些悬挂物。',
    '悲泣溪谷：完成「清理门户」任务。在 Ruthless Archer Camp 拿到断弦的弓，交给 Mandate Outpost 的 Brooding Old Archer。',
    'Feather_Bow',
  ],
  [
    'flying-dagger', '妙手飞刀', 'Flying Dagger', '远程', [['伤害', 251], ['破防', 216]], 1,
    '连按 R2 掷出最多 3 轮飞刀，整套消耗 1 格 Remnant Spark。攻击附带中毒积累。',
    '获得后即使不装备，也能在中远距离击落某些悬挂物。',
    '血色森林：替 NPC Quick Hand Zhang 收集齐 3 件宝物后获得。',
    'Flying_Dagger',
  ],
  [
    'goldblaze', '黄金火铳', 'Goldblaze', '远程', [['伤害', 843], ['破防', 453]], 20,
    '按 R2 远程射击，连按可以连续开火，一整轮消耗 1 格 Remnant Spark。对满血的敌人增伤。',
    '获得后即使不装备，也能在中远距离击落某些悬挂物。',
    '庞镇：前往 Zhang\'s Hideout 与 Quick Hand Zhang 对话获得。',
    'Goldblaze',
  ],
  [
    'loong-trident', '游龙叉', 'Loong Trident', '远程', [['伤害', 195], ['破防', 175]], 30,
    '长按 R2 蓄力，松开将游龙叉远距离掷出，消耗 1 格 Remnant Spark。攻击附加潮湿，敌人受到的雷与冰伤害提高，对持火属性武器的敌人有优势。对藏在水里或雪里的敌人会出现 R2 提示，按下可以把它逼出来并造成更高伤害。',
    '获得后即使不装备，也能在中远距离击落某些悬挂物。',
    '梅谷湖：在 Blackwater Crew Dock 铃铛处第二次击败 BOSS「游龙」掉落。',
    'Loong_Trident',
  ],
  [
    'one-eyed-bow', '独眼弓', 'One-Eyed Bow', '远程', [['伤害', 214], ['破防', 162]], 1,
    '长按 R2 蓄力，松开射出一箭，消耗 1 格 Remnant Spark。对满血的敌人增伤。',
    '获得后即使不装备，也能在中远距离击落某些悬挂物。',
    '梅谷湖：在 One-Eyed Isle Dock 铃铛处击败 BOSS「独眼弓客」掉落。',
    'One-Eyed_Bow',
  ],

  // ==================== 召唤 ====================
  [
    'inanis-radiant-fan', '虚空华扇', "Inanis' Radiant Fan", '召唤', [['生命回复', 342], ['杀气回复', 207]], 1,
    '按 R2 在自身周围展开一个持续 8 秒的结界，结界内生命与杀气逐渐回复。消耗 2 格 Remnant Spark。',
    '无。',
    '枷笼山：完成 Whence the Weeping 任务后获得（冥使「虚空」所赠）。',
    'Inanis%27_Radiant_Fan',
  ],
  [
    'kuye-temple-prayer-beads', '苦叶寺珠串', 'Kuye Temple Prayer Beads', '召唤', [], 1,
    '在杀气浓郁的区域（图标发出特殊光芒时）按 R2 召唤 3 名铜人，最多战斗 15 秒，被击败则提前消失。召唤物不能叠加，再次召唤会替换现有的。消耗 2 格 Remnant Spark。',
    '无。',
    '陆家村：在 Smuggler\'s Tunnel 击败主线 BOSS「碧海大师残躯」掉落。',
    'Kuye_Temple_Prayer_Beads',
  ],
  [
    'puppeteers-bell', '操偶铃铛', "Puppeteer's Bell", '召唤', [], 1,
    '在杀气浓郁的区域按 R2 召唤 1 个剑盾人偶和 1 个枪盾人偶，最多战斗 15 秒，被击败则提前消失。召唤物不能叠加。消耗 2 格 Remnant Spark。',
    '无。',
    '陆家村：跳入 Broken Puppet Pit 底部，击败支线 BOSS「荡秽」掉落。',
    'Puppeteer%27s_Bell',
  ],
  [
    'swordsmans-summon', '剑客召集令', "Swordsman's Summon", '召唤', [], 1,
    '在杀气浓郁的区域按 R2 召唤 1 名剑客队长和 2 名剑客弟子，最多战斗 15 秒，被击败则提前消失。召唤物不能叠加。消耗 2 格 Remnant Spark。',
    '无。',
    '正道大营：击败 BOSS「大师兄」（七星剑阵）掉落。',
    'Swordsman%27s_Summon',
  ],
]

const phantomEdges = rows.map(([id, nameZh, nameEn, category, stats, level, effect, useHint, location, slug]) => ({
  id,
  name: nameZh || nameEn,
  nameEn,
  zhPending: nameZh === null,
  category,
  level,
  effect,
  useHint,
  location,
  moves: [{ label: '战斗技能', text: effect }],
  metrics: stats.map(([label, value]) => ({
    label: level === null ? `${label}（等级未标注）` : `${label}（Lv${level}）`,
    value: String(value),
  })),
  source: `${WIKI}${slug}`,
}))

export const phantomEdgeCategories = [
  { id: '机关', label: '机关', desc: '盾、喷火狮头、水炮、琵琶与血滴子，每一件都对应一种地图机关。' },
  { id: '破坏', label: '破坏', desc: '斧、锤、炮一类的重型武装，多为长按蓄力后出手，说明里多标注了较高的破盾能力。' },
  { id: '武技', label: '武技', desc: '锁镰、拳套、流星锤、长枪与剑，连按 R2 打出最多 3 段。' },
  { id: '远程', label: '远程', desc: '弓、飞刀、火铳、飞叉，五件都能在中远距离击落悬挂物。' },
  { id: '召唤', label: '召唤', desc: '召唤帮手或展开回复结界，消耗 2 格 Remnant Spark；召唤帮手只能在杀气浓郁的区域使用。' },
]

export const phantomEdgeStats = {
  total: phantomEdges.length,
  categories: phantomEdgeCategories.length,
  zhPending: phantomEdges.filter((item) => item.zhPending).length,
}

export default phantomEdges
