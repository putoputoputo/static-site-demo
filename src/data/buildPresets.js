// 构筑器预设：四个能直接上手抄的配装
//
// 只写「四件装备 + 八个属性」这些真正需要手填的东西，重量、FP、记忆格
// 全部由数据层现算，不在这里抄一遍数字 —— 抄一遍就一定会有一天和数据对不上。
//
// 引用方式统一用 name（武器 / 护符 / 法术的 name 在各自表里都不重复），
// 由 views/BuildView.vue 解析成对象；解析不到会在开发期直接抛错，
// 免得改完数据后预设静默变成空构筑。

export const buildPresets = [
  {
    key: 'moonveil',
    name: '月光剑法系',
    tag: '智力',
    summary: '名刀月隐打近身，陨石杖补远程。前期最容易成型的「战技 + 法术」双修。',
    stats: { vigor: 40, mind: 25, endurance: 20, str: 12, dex: 20, int: 40, fai: 10, arc: 10 },
    main: '名刀月隐',
    off: '陨石杖',
    talismans: ['大壶众武护符', '魔法师球护符', '绿龟护符', '黄金树的恩惠+2'],
    spells: ['辉石迅魔砾', '岩石球'],
    notes: [
      '陨石杖不吃智力补正强化，纯粹为了岩石球，不必强化。',
      '魔法师球护符只加魔法，月隐的月光波是战技伤害、不吃这个加成。',
    ],
  },
  {
    key: 'bloodhound',
    name: '力敏出血',
    tag: '力敏',
    summary: '猎犬长牙主打战技，打刀附出血当副手。容错高，几乎不用法术资源。',
    stats: { vigor: 45, mind: 15, endurance: 30, str: 40, dex: 35, int: 10, fai: 10, arc: 15 },
    main: '猎犬长牙',
    off: '打刀',
    talismans: ['大壶众武护符', '亚历山大的碎片', '绿龟护符', '黄金树的恩惠+2'],
    spells: [],
    notes: [
      '亚历山大的碎片加成战技伤害，正好对上猎犬长牙的战技。',
      '双持两把武器时「双手剑护符」不生效，别浪费栏位。',
    ],
  },
  {
    key: 'golden-order',
    name: '信仰战士',
    tag: '信仰',
    summary: '黄金律法大剑配同系圣印记，先用黄金树立誓叠自身 buff，再靠雷电枪打远程。',
    stats: { vigor: 45, mind: 20, endurance: 30, str: 25, dex: 21, int: 10, fai: 50, arc: 12 },
    main: '黄金律法大剑',
    off: '黄金律法圣印记',
    talismans: ['大壶众武护符', '信徒的立誓布', '黄金树的恩惠+2', '大山羊护符'],
    spells: ['黄金树立誓', '雷电枪', '感受巨人火焰吧'],
    notes: [
      '黄金树立誓要 25 信仰，开打前先放，是信仰流最通用的一层增益。',
      '圣印记的强化等级决定祷告伤害，别只堆属性忘了强化。',
    ],
  },
  {
    key: 'greatshield',
    name: '重装大盾',
    tag: '力量',
    summary: '指纹石盾物理减伤拉满，粉碎巨人槌负责反击。负重吃紧，护符先保负重。',
    stats: { vigor: 50, mind: 15, endurance: 50, str: 60, dex: 15, int: 8, fai: 10, arc: 10 },
    main: '粉碎巨人槌',
    off: '指纹石盾',
    talismans: ['大壶众武护符', '大山羊护符', '绿龟护符', '黄金树的恩惠+2'],
    spells: [],
    notes: [
      '指纹石盾要 48 力气，不够就拿不起来，先用双手持握过渡也不行（盾不吃双手加成）。',
      '这一套压在 40% 上下，想进轻负重需要接近 80 耐力，实战上不值得。',
    ],
  },
]

/** 预设里用到的名字 → 值，方便检查脚本断言「预设没有指向不存在的东西」 */
export function presetNames() {
  return buildPresets.flatMap((preset) => [preset.main, preset.off, ...preset.talismans, ...preset.spells]).filter(Boolean)
}
