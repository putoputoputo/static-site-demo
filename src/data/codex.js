// 图鉴模块注册表：四个模块共用同一套列表页与详情页
// 只在这里描述「这个模块长什么样」，页面逻辑放在 views/CodexView.vue

import talismans, { talismanCategories } from './talismans.js'
import sorceries, { sorcerySchools } from './sorceries.js'
import incantations, { incantationSchools } from './incantations.js'
import spiritAshes, { spiritTypes } from './spiritAshes.js'

export const codexModules = {
  talismans: {
    key: 'talismans',
    path: '/runes',
    title: '护符图鉴',
    eyebrow: '符文 · 护符',
    intro:
      '护符只有四个栏位，真正的取舍不在「收集了多少」，而在「这四个位置放什么」。这里按效果分类整理重量、数值与获取路线，并标出各流派的核心件。',
    itemLabel: '护符',
    categoryLabel: '分类',
    dlcLabel: 'DLC 护符',
    tierLabel: '核心件',
    items: talismans,
    categories: talismanCategories,
    sortOptions: [
      { value: 'default', label: '默认（按分类）' },
      { value: 'tier', label: '推荐度' },
      { value: 'name', label: '名称' },
      { value: 'weight-asc', label: '重量 从轻到重' },
    ],
    notes: {
      属性提升: '属性类护符是「保底收益」：红/蓝/绿琥珀与黄金树的恩惠几乎任何 build 都能塞。烙印系用 10%~15% 的额外受伤换 3~5 点属性，前期冲需求很好用，后期建议换掉。',
      减伤抗性: '减伤按属性对号入座，别只堆物理。龙徽大盾与珍珠盾是通用件，其余按 boss 属性临时换。抗性类护符只在特定场景（腐败湖、癫火、出血 boss）才值得占栏位。',
      动作强化: '动作类护符吃具体打法：跳劈流必带钩爪，盾反流带曲剑，弓箭流带硬箭/远硬箭。双手剑护符只对「双手共持一把武器」生效，双持两把不吃加成。',
      术法强化: '魔法师球/块与信徒立誓布是独立乘区，法师和信仰流优先。源辉石刀用 15% HP 换 25% FP 消耗，适合蓝量吃紧的 build。',
      特殊强化: '对蝎系 +12% 属性攻击但 -10% 物理减伤，四个可以同时戴，代价会叠加。大山羊、铜绿圆碟这类防御件适合重甲流。',
      特殊效果: '条件触发类要围绕条件搭：低血流配红羽，满血流配献斗剑，连击流配翼剑徽章。击杀回血/回蓝适合推图，打 boss 时价值下降。',
      大卢恩: '大卢恩不占护符栏，但同时只能装备一个，而且必须去对应神授塔激活。前期最实用的是葛瑞克（全属性 +5）与拉塔恩（三围上限），洗点则离不开蕾娜菈。',
    },
  },
  sorceries: {
    key: 'sorceries',
    path: '/sorceries',
    title: '魔法图鉴',
    eyebrow: '魔法 · Sorceries',
    intro:
      '魔法只看三件事：FP 效率、记忆格占用、以及能不能在被 boss 追着打的时候放出来。这里按学派整理全部魔法，标出各阶段的输出核心与功能件。',
    itemLabel: '魔法',
    categoryLabel: '学派',
    dlcLabel: 'DLC 魔法',
    tierLabel: '核心法术',
    items: sorceries,
    categories: sorcerySchools,
    sortOptions: [
      { value: 'default', label: '默认（按学派）' },
      { value: 'tier', label: '推荐度' },
      { value: 'fp-asc', label: 'FP 消耗 从低到高' },
      { value: 'slots-asc', label: '记忆格 从少到多' },
      { value: 'name', label: '名称' },
    ],
    notes: {
      辉石魔法: '法师的粮食。辉石魔砾/迅魔砾负责填充，辉石彗星与帚星负责中后期单体，魔法之境开 boss 前先铺。',
      起源魔法: '三件都是「站桩换血」型：需要骨灰吸仇恨或无限蓝露滴，施法前摇长，别在 boss 突进时硬读。',
      卡利亚魔法: '近战法师的根基。卡利亚迅剑 4 FP 的性价比无可替代，亚杜拉的月光剑兼顾伤害与冻伤，满月/暗月负责增伤。',
      黑夜魔法: '黑夜彗星与奇袭魔砾的最大价值是敌人不会主动闪避，打女武神、黑剑这类高机动 boss 特别稳。',
      熔岩魔法: '智力信仰双修，伤害不算顶尖，胜在命中后留下地形持续压制。',
      寒冷魔法: '冻伤是百分比削血，配合冰系武器可以反复触发。结冰武器是近战法师的常用附魔。',
      结晶人魔法: '弹幕型法术，近距离全中伤害很高，远距离散射严重，适合清走廊与群怪。',
      重力魔法: '物理伤害，能吃物理增伤。岩石球 18 FP 的削韧在前期可以越级打大部分 boss。',
      指头魔法: 'DLC 尤弥尔一系，PVP 价值高于 PVE；守护指头能弹开远程，打法师与弓箭手很好用。',
      泥人神谕: '泡泡弹速慢，主要用来封走位与压起身，纯输出不如辉石系。',
      荆棘魔法: '只看信仰，不需要智力。罪恶荆棘/责罚荆棘会自伤，但 FP 效率极高，信仰流打 boss 的补充输出。',
      死亡魔法: '怨魂追踪性强，菲雅烟雾的「死亡」异常对人形敌人几乎是秒杀级威胁。',
    },
  },
  incantations: {
    key: 'incantations',
    path: '/incantations',
    title: '祷告图鉴',
    eyebrow: '祷告 · Incantations',
    intro:
      '祷告的强度一半在数值，一半在「你有没有提前上 buff」。这里按体系整理全部祷告，包含治疗、防护、附魔与龙飨吐息。',
    itemLabel: '祷告',
    categoryLabel: '体系',
    dlcLabel: 'DLC 祷告',
    tierLabel: '核心祷告',
    items: incantations,
    categories: incantationSchools,
    sortOptions: [
      { value: 'default', label: '默认（按体系）' },
      { value: 'tier', label: '推荐度' },
      { value: 'fp-asc', label: 'FP 消耗 从低到高' },
      { value: 'slots-asc', label: '记忆格 从少到多' },
      { value: 'name', label: '名称' },
    ],
    notes: {
      双指祷告: '治疗与防护的基础库。王之圣防护打拉达冈/艾尔登之兽必带，各属性防护按 boss 换。',
      黄金树祷告: '黄金树立誓是全覆盖的 15% 增伤 + 10% 减伤，团队与单人都值得占一个记忆格；黄金树庇佑则是最高阶属性防护。',
      黄金律法基本主义: '光环只要 3 FP，是全游戏 FP 效率最高的远程祷告之一。注意这一系大多需要智力与信仰双修。',
      王城古龙信仰: '雷电枪是信仰流的稳定远程，弗尔桑克斯的雷枪是爆发顶点；红雷系对龙类与大型 boss 效果拔群。',
      螺旋祷告: 'DLC 塔之镇一系，弯弧类偏清群，旋流与龙卷风偏控制，整体是补充手段。',
      火焰祷告: '投火与火焰啊喷发吧是开荒双核心；火焰啊赐予我力量是近战信仰流必带的增伤 buff。',
      梅瑟莫之火: 'DLC 火焰系，梅瑟莫的火球伤害与范围都属顶级，但 60 信仰门槛不低。',
      黑焰祷告: '黑焰的持续削血按最大 HP 比例计算，对高血量 boss 特别有效；黑焰刀刃适合快速武器。',
      野兽祷告: '古兰格交付死根后逐步解锁，耗蓝低、起手快，兽石是很好的填充技。',
      熊飨祷告: '只有鲁格利亚的咆哮一则，收藏价值大于实战。',
      血盟祷告: '信仰感应双修，血焰刀刃给快速武器附出血是核心用法；蝇群适合远程叠出血。',
      腐败祷告: '以猩红腐败与毒为主，打 boss 需要时间生效，适合消耗流。',
      癫火祷告: '爆发高但会累积自身发狂，注意理智度与「镇定」魔法；米德拉的癫火是 DLC 主输出。',
      龙飨祷告: '吐息类需要信仰 + 感应，站桩输出极高；腐败吐息与艾格基斯的腐败是打 boss 的主力。贝勒两则只看感应，是纯感应流的核心。',
    },
  },
  spirits: {
    key: 'spirits',
    path: '/spirits',
    title: '骨灰图鉴',
    eyebrow: '骨灰 · Spirit Ashes',
    intro:
      '骨灰不是「越贵越强」：FP 消耗、召唤位置、攻击欲望与抗打断，决定了它能不能真的帮你扛住 boss。这里按定位整理全部骨灰与获取路线。',
    itemLabel: '骨灰',
    categoryLabel: '定位',
    dlcLabel: 'DLC 骨灰',
    tierLabel: '强力骨灰',
    items: spiritAshes,
    categories: spiritTypes,
    sortOptions: [
      { value: 'default', label: '默认（按定位）' },
      { value: 'tier', label: '推荐度' },
      { value: 'fp-asc', label: 'FP 消耗 从低到高' },
      { value: 'name', label: '名称' },
    ],
    notes: {
      近战: '近战骨灰的价值在「吸仇恨 + 打削韧」。失乡骑士奥雷格、黑刀狄希攻击欲望高，适合给法师创造读条窗口。',
      远程: '远程骨灰输出稳定但很容易被 boss 近身秒掉，召唤后要主动把仇恨拉回来。',
      群体: '群殴型骨灰能快速堆伤害与出血，但怕范围攻击；打大型 boss 时容易被一次扫场清空。',
      坦克: '坦克骨灰输出可以忽略，核心指标是血量与抗打断。大盾士兵五人组是最经典的仇恨机器。',
      辅助: '辅助骨灰提供治疗、buff 或照明，适合长线探索与特定机制，不适合硬拼。',
      特殊: '仿身泪滴复制你当前的装备、法术与道具，召唤消耗 HP 而不是 FP；召唤前把快捷栏换成有用的东西。',
    },
  },
}

export const codexList = Object.values(codexModules)

export function getCodexModule(key) {
  return codexModules[key] || null
}
