// 《影之刃零》BOSS 数据
//
// 数据口径（2026-11 整理）：
// - 位置、掉落、阶段与打法要点：Fextralife 英文 wiki 各 BOSS 页（见每条的 source）。
//   wiki 上没有写的字段一律留空：phases 只在页面明确出现多阶段时才填，否则为 null；
//   打法要点只转述页面原文提到的机制，页面是空模板的写「待补」。
// - 中文名与区域名：游民星空《全收集列表》《白金奖杯攻略》的成就名、《影之刃零 六十三个 BOSS 战斗机制拆解》
//   三处交叉核对，中英对应通过「区域 + 掉落」双条件验证。55 个 BOSS 已全部补齐，nameZh 不再留 null。
//   追命拆成两场：The Hunt 是马车追逐战，The Hunt, Sixfold Scythe 是二阶段「六绝凶镰」，避免重名。
// - 招式名、铃铛名与道具名同样是中文：英文 wiki 只有英文名，这里按字面意译，与官方中文版可能有出入；
//   没有可靠中文名的 BOSS（部分戏梦山庄人偶）在图鉴里就叫「几号 + 类型」，不硬造人名。
//   nameEn 字段保留英文原名，只用于检索与核对，页面不展示。

const WIKI = 'https://phantombladezero.wiki.fextralife.com/'

// [id, 中文名, 英文名, 区域, 位置, 掉落, 阶段数（未知为 null）, 要点, wiki 页面名]
const rows = [
  // ==================== 悲泣溪谷 ====================
  [
    'zuo-shang', '左殇', "Zuo Shang, the Order's Shadow Sovereign", '悲泣溪谷', '开场教学关', '',
    2,
    '教学关 BOSS：先作为普通敌人出现，讲解杀气与招架，随后才是正式的 BOSS 战。攻击以基础斩击为主，可以招架或闪避；他会闪开时机不对的进攻并反击，注意红光与蓝光提示。',
    'Zuo_Shang_the_Order%27s_Shadow_Sovereign',
  ],
  [
    'the-hunt', '追命', 'The Hunt, Hunter of the Order', '悲泣溪谷', '第一章「逆流直上」，前往悲泣溪谷的路上（马车追逐战）', '',
    2,
    '第一张地图的章末剧情 BOSS，也是游戏里第一个双阶段 BOSS。使用双锁镰，普通连段是多段镰击并带有远程攻击；锁链类武器的起手动作比较长。招式：锁镰乱斩、悬空连斩、锁镰连击。',
    'The_Hunt_Hunter_of_the_Order',
  ],
  [
    'the-hunt-sixfold-scythe', '六绝凶镰', 'The Hunt, Sixfold Scythe', '悲泣溪谷', '大瀑布，击败「追命」之后连战', '追命锁镰',
    null,
    '追命长出两条额外的手臂，攻击次数翻倍，并新增风属性投射物。贴身时他会用近距离黑光攻击，必须闪避，否则会被打出硬直。在这一阶段阵亡后重来，仍然从这一阶段开始。',
    'The_Hunt_Sixfold_Scythe',
  ],
  [
    'jagged-steel-boss', '残钢', 'Jagged Steel, the Frenzied Brute', '悲泣溪谷', '红线屏障之后的道路上（遇到时他正与两名武者交战）', '残钢刃',
    null,
    '进攻型 BOSS，开场的连段看着慢实则凶狠。建议偏防守，不要在他连段中途硬拼；多数连段以一记慢速收招结尾，等这一下招架破防后再反击。侧向移动绕到他身后更安全。',
    'Jagged_Steel_the_Frenzied_Brute',
  ],
  [
    'peng-meng', '斧老大彭猛', 'Peng Meng, the Axemaster', '悲泣溪谷', '溪谷哨站外', '巨凶斧',
    null,
    '手持巨凶斧的大块头，出手慢，蓄力与起手都很明显。如果读不准招式，可以拉开距离逼他用冲锋攻击，比近距离的连续挥砍好处理。',
    'Peng_Meng_the_Axemaster',
  ],
  [
    'hua-deadly-betrothed', '新娘阿花', 'Hua, Deadly Betrothed', '悲泣溪谷', '溪谷杀气塔顶铃铛之后，靠近山顶', '红妆鬼斩',
    null,
    '第一章隐藏 BOSS，机动性高，离远了会瞬移过来攻击，整场要保持移动。「白莲」放出缓慢飘来的莲花，横向移动即可躲开，但莲花靠近时她常会接一次抓取，命中是一记重击。近身时她的斩击通常 2~3 下结束，可以挡第一下、招架下一下。补丁 1.0302256 下调了她在「入阵者 / 破局者」难度下的抓取频率。',
    'Hua_Deadly_Betrothed',
  ],
  [
    'aberrant-three-faced-puppet', '魔偶', 'Aberrant Three-Faced Puppet', '悲泣溪谷', '圣母裂隙铃铛附近，上到神龛处', '三头小娃娃（剧情道具）',
    null,
    '支线「三面混沌」的挑战 BOSS。游戏早期就能找到，但强度明显是为后期准备的，魂自己也会说「晚点再来」；大约到第四章再来会好打很多。招式：裂隙现世、回身连斩。',
    'Aberrant_Three-Faced_Puppet',
  ],
  [
    'the-gold-masked-one', '金面具黑衣人', 'The Gold-Masked One', '悲泣溪谷', '龙柱内：悲泣溪谷的龙柱、血色森林镜林的龙柱（全流程多次遭遇）', '反击护腕、神异剑鞘',
    null,
    '与龙柱互动后被传送去交手的神秘黑衣人，是全游戏强度最高的对手之一，流程中会多次遭遇。第一根龙柱的那一场通常最难，因为是第一次接触他的招式。招式：跃斩连击、飞踢、赤色旋涡、赤色斩、空中斩。',
    'The_Gold-Masked_One',
  ],

  // ==================== 血色森林 ====================
  [
    'hua-qianxiao', '花千笑', 'Hua Qianxiao, the Sword Fanatic', '血色森林', '庞镇桥观景台铃铛之后', '痴者残剑',
    null,
    '剑快，并且有防御手段，不容易找到破绽。最好的输出时机是他使用「泡影护盾」的时候：他会定在泡泡里，先把泡泡打破，他随即陷入硬直。他用「潮生剑」时拉开距离；他掷剑时随时准备格挡或闪避。',
    'Hua_Qianxiao_the_Sword_Fanatic',
  ],
  [
    'jing-ye', '荆野', 'Jing Ye, the Outlaw', '血色森林', '「亡命陷阱」与「离雾」附近的人面榕', '亡命斩马刀',
    2,
    '第二张地图的第二个 BOSS，花样很多。初见时他骑在马上，绕场用双手刀劈砍。一阶段招式：旋刃、赤雨、踏地斩、马上连斩；二阶段招式：扑击连击、跃斩、沙遁、炫目斩。',
    'Jing_Ye_the_Outlaw',
  ],
  [
    'stone-hand-iron-fever', '铁狂', 'Stone Hand Iron Fever', '血色森林', '镜林入口铃铛之后，顺梯子下去', '铁拳套',
    2,
    '徒手格斗，出手快且擅长闪避，要兼顾攻防。他可以被打出硬直从而打断出招，抓机会压制但不要贪刀；他也能弹开你的攻击并立刻反击，被他招架后要马上转入防守。开场先谨慎观察他的跳跃与扑击。',
    'Stone_Hand_Iron_Fever',
  ],
  [
    'bai-chilian', '白赤练', 'Bai Chilian, the Sacrificial Serpent', '血色森林', '缚线巨树铃铛之后', '白蟒赤练、残破的幻术琵琶',
    2,
    '第二张地图的章末剧情 BOSS，双阶段。一阶段使用两把短剑，以蛇一样的身法在场地里游走，从各个角度快速出手。一阶段招式：扑击斩、旋风、飞掠连斩、潜地蛇群、毒蛇突刺、掷剑突进；二阶段招式：毒蛇斩、旋蛇。在二阶段阵亡不需要重打一阶段。',
    'Bai_Chilian_the_Sacrificial_Serpent',
  ],

  // ==================== 陆家村 ====================
  [
    'zhuo-bi', '拙壁', 'Zhuo Bi, the Gatekeeper', '陆家村', '老根头藏身处铃铛正西', '拙壁盾',
    null,
    '打法直接：他的多数攻击起手明显，或者距离短、走直线。这一战要主动进攻，目标是打空他的杀气，在他硬直时处决，这是主要的伤害来源。贴身并绕到背后，因为他的大部分攻击只覆盖正面；在盾牌正面时用重攻击可以把他打出硬直。',
    'Zhuo_Bi_the_Gatekeeper',
  ],
  [
    'master-bi-yuan', '毕远掌门残躯', 'Master Bi Yuan of the Tianxuan Sect', '陆家村', '石像广场（石像广场入口铃铛旁的台阶之后）', '天玄青铜剑',
    null,
    '身法敏捷，能迅速闪开攻击并用青铜剑反击。偏防守打，等空档再出手，不要试图强压，他的快斩可以和闪避动作连起来。保持在中近距离：离得太远他会频繁使用「刀波」与「气爆」，两者飞行速度都很快。',
    'Master_Bi_Yuan_of_the_Tianxuan_Sect',
  ],
  [
    'master-bi-hai', '碧海大师残躯', 'Master Bi Hai of Kuye Temple', '陆家村', '走私隧道（「受伤的贼」之后）', '苦叶寺珠串',
    null,
    '以快速掌击为主，看清起手后横向闪避。他的攻击大多走直线，侧闪很有效；中距离只需要留意「虚掌」，那是一发直线飞行的慢速投射物。你的攻击可以打断他，因此可以打得主动一些，但不要贪刀。',
    'Master_Bi_Hai_of_Kuye_Temple',
  ],
  [
    'acolyte-yanru', '炎茹', 'Acolyte Yanru', '陆家村', '机关巨人残骸（梯田铃铛正东），与贴着符咒的稻草人互动后传送进场', '炎茹的赤焰面具',
    null,
    '稻草人幻术师之一，火属性，是少数完全依赖远程攻击的 BOSS，所以这一战主要靠闪避而不是招架。开场她会召唤多枚悬浮在场地各处的火雷。招式：炎雷阵、连发火球、火雨、烈焰爆破、喷火、地火喷发。',
    'Acolyte_Yanru',
  ],
  [
    'dusk-the-puppeteer', '荡秽', 'Dusk, the Puppeteer', '陆家村', '破偶深坑铃铛旁跳下深坑，坑底', '操偶铃铛、幻术琵琶的琴头',
    2,
    '支线上的可选 BOSS，藏在雾墙之后的深坑里。不打也能通关，但如果想达成某个特定结局，他所在的支线是必须完成的。身为操偶师，他的攻击以召唤大量人偶为主。一阶段招式：连射、飞掠连斩、翻斩、巨臂砸击、召唤人偶；二阶段招式：飞掌、人偶之阵、人偶连斩。',
    'Dusk_the_Puppeteer',
  ],
  [
    'yuzan', '玉瓒', 'Yuzan, No. 3 Musician Puppet', '陆家村', '井下铃铛之后，洞窟里的建筑内', '催心琵琶',
    null,
    '以乐器为武器，主要用各种音波远程攻击。音波分颜色：蓝波可以招架，红波必须闪避；两者都不能触发鬼步反击。被命中时，蓝波削减的杀气更多，红波造成的生命伤害更高。',
    'Yuzan_No._3_Musician_Puppet',
  ],
  [
    'mu-xiaokui', '沐小葵', 'Mu Xiaokui, Queen of Iron and Jade', '陆家村', '湖畔（人偶试验场以西的升降梯）', '',
    3,
    '第三张地图的章末剧情 BOSS，无法跳过，也是少数拥有三个阶段的 BOSS。一阶段她主要用剑，近战与远程混合。击败后前方码头上有乱莺剑，离开该区域前记得拾取。',
    'Mu_Xiaokui_Queen_of_Iron_and_Jade',
  ],
  [
    'iron-fiend-and-jade-dancer', '玉妖与铁鬼', "Iron Fiend and Jade Dancer, Young Mistress's Guardians", '陆家村', '湖畔，击败沐小葵后立刻连战', '妖锯、44 号人偶之眼、拳之碎片·核',
    null,
    '沐小葵战的第三阶段：同时面对她的两名护卫铁鬼与玉妖，这次他们不是幻影，会同时出手；两人的部分招式在二阶段已经见过。被护卫击败后可以直接重新挑战他们，不必再打沐小葵。妖锯可错过，需要完成「少主」任务。',
    'Iron_Fiend_and_Jade_Dancer_Young_Mistress%27s_Guardians',
  ],

  // ==================== 庞镇 ====================
  [
    'blaze', '火流星', 'Blaze, Phosphor Consciousness', '庞镇', '南门桥铃铛之后的路上', '火流星',
    2,
    '进入庞镇后遇到的第一个 BOSS，影卫队长，剧情必打。他使用火流星：带锤头的锁链兵器，点燃后能把战场变成火海。一阶段招式：流星挥击、掷锤、旋锤、炽烈重砸、缠锁、后撤斩、滚锤。',
    'Blaze_Phosphor_Consciousness',
  ],
  [
    'cavalrybane', '斩骑', 'Cavalrybane, Elite Shadow Warden', '庞镇', '黄府路口，「组织」地下酒馆外', '破军',
    null,
    '精锐影卫。初见时他正轻松放倒两名骑兵，然后才转向你。使用双手长柄武器破军，连段相对简单。招式：跃起重砸、擦身连击、二连击、穿刺冲锋、蓄力连斩、回身斩。',
    'Cavalrybane_Elite_Shadow_Warden',
  ],
  [
    'wu-xuan', '武轩', 'Wu Xuan, the Fallen General', '庞镇', '后街牌坊之后路边的空地', '贪狼',
    2,
    '重甲敌人，没有盾牌，但和拙壁一样必须先打破他的护甲才能造成有效伤害。带上破盾能力高的影之武装（如巨凶斧、铁拳套）会快很多。一阶段招式：缠身锤、双重砸击；二阶段招式：枯萎重砸、旋风、回身砸击、腐化狂乱、旋锤。',
    'Wu_Xuan_the_Fallen_General',
  ],
  [
    'gu-wanyue', '骨婉约', 'Gu Wanyue, the Wailing Wraith', '庞镇', '残歌池铃铛之后，循着歌声到井边', '残存的执念·痴（铸魂材料）',
    null,
    '少数必须先彻底破防才能伤到生命值的 BOSS，因为她被自身的杀气保护着。她在场地里飘浮，近战与远程混用。她有一招蓝光远程：快速掷出混沌火球，完美招架触发鬼步反击后，魂会把火球掷回去，造成可观的伤害。击败她之后解锁正道大营地图。',
    'Gu_Wanyue_the_Wailing_Wraith',
  ],
  [
    'xie-quidong', '谢秋冬', 'Xie Quidong, the Divine Healer', '庞镇', '魏三川井外的院落', '不尽水（回复药）',
    null,
    '游戏里两个「群体 BOSS」之一，难点在于同时应付多名普通敌人，而不是 BOSS 本身的招式。他是治疗型敌人，用丝线连着周围八名敌人，抽取他们的生命去治疗你真正在对付的那些敌人。招式：穿刺藤蔓、掷根、藤拳、散射、汲命。',
    'Xie_Quidong_the_Divine_Healer',
  ],
  [
    'you-loong-pangzhen', '游龙', 'You Loong, Leader of the Blackwater Crew', '庞镇', '青蛇屋铃铛以西的水域', '游龙头',
    null,
    '少数需要打多次的 BOSS，第一次是在庞镇街头。两场战斗的场地都积满了水，他用叉与水炮攻击。招式：掷叉、水击、旋身斩、无常水势、水息。',
    'You_Loong_Leader_of_the_Blackwater_Crew',
  ],
  [
    'chang-hong', '长鸿', 'Chang Hong, the Thunder Lancer', '庞镇', '祠堂广场铃铛之后，舞狮堂东北', '雷霆枪',
    2,
    '魂的旧日同伴，使长枪，出招时会引下雷电。连段由刺与扫组成；连段末尾他向后跳开时，会把枪砸进地面放出一道向前的雷电冲击波，被命中会积累麻痹。一阶段招式：飞刺、回身斩、旋斩、落雷击、雷抓、坠雷、雷原。',
    'Chang_Hong_the_Thunder_Lancer',
  ],
  [
    'the-lion-dance-grandmaster', '烈焰', "The Lion Dance Grandmaster's Final Dance", '庞镇', '舞狮堂深处铃铛之后的场地', '熄火烈焰狮头',
    null,
    '主要用狮头面具上的各种刀刃攻击，配合跺地与喷火。开场他会从崖上跃下，是一记红光攻击，把你按在地上；没能用鬼步反击的话，需要连按挣脱狮头才能正式开打。招式：狮扑、扇踢、角击、狂怒踏地、火矢、炼狱狂踏。',
    'The_Lion_Dance_Grandmaster%27s_Final_Dance',
  ],
  [
    'acolyte-lei-ting', '雷婷', 'Acolyte Lei Ting', '庞镇', '老根头家铃铛东北，断桥方向的稻草人', '雷婷的霹雳面具（剧情道具）',
    null,
    '能挑战的第三位稻草人幻术师，雷属性，以远程攻击为主。最常见的一招是分身成两个，打一套很长的连段，连段大多是带颜色提示的攻击，以蓝色的投雷起手。招式：闪电击、电场、雷电连击、雷击之场。',
    'Acolyte_Lei_Ting',
  ],
  [
    'soulclaimer', '勾魂', 'Soulclaimer, Elite Shadow Warden', '庞镇', '码头货栈铃铛：下到木坡道再上楼梯，到顶即开战', '别离残钩',
    null,
    '精锐影卫，使用一对钩刃，开战时身边带着两名白山斥候。他的攻击里有大量旋转招式；常规连段是先砍两下，然后绕着你移动，再接一串命中四次的旋转斩。招式：穿刺钩连击、旋转蓝光攻击、跃斩攻击、格挡反击、飞踢攻击。',
    'Soulclaimer_Elite_Shadow_Warden',
  ],

  // ==================== 梅谷湖 ====================
  [
    'heartpiercer', '断肠', 'Heartpiercer, Elite Shadow Warden', '梅谷湖', '白蛇屋：从铃铛处开门进入院子', '天煞双钺',
    null,
    '精锐影卫，剧情必打，守着一件推进剧情的关键道具，位于湖中的一座岛上。和其他影卫一样招式相对简单，以普通连段为主；使用天煞双钺。',
    'Heartpiercer_Elite_Shadow_Warden',
  ],
  [
    'one-eyed-archer', '独眼弓客', 'One-Eyed Archer', '梅谷湖', '独眼岛码头铃铛（从湖榕码头铃铛前往东北方的岛）', '独眼弓',
    null,
    '以弓为主武器，招式与流程中遇到的精英弓手相近，射箭与剑击混用，另外还有一种放出光束的特殊能力。生命降到约 70% 时，他会跳到场地中央，向四面八方放出大量光束，这些光束会绕场旋转。',
    'One-Eyed_Archer',
  ],
  [
    'yan-qiansui', '烟千岁', 'Yan Qiansui, the Zither Maiden', '梅谷湖', '陆家浅滩码头铃铛以西的岛', '痴者碎片·配件',
    null,
    '以乐器攻击的戏伶，主要使用投射物。她是鬼魂型敌人，在杀气被打空之前，身体受到保护、无法被攻击命中。战斗中她会放出多波带颜色的投射物，每一波以红色为主，夹杂一两颗蓝色；红色的不能弹回去。',
    'Yan_Qiansui_the_Zither_Maiden',
  ],
  [
    'you-loong-lake', '游龙', 'You Loong, the Frenzied Blackwater Crew Leader', '梅谷湖', '黑水帮码头铃铛，进入积水区域', '游龙叉',
    null,
    '第二次与游龙交手，地点在湖区黑水帮的村落，场地同样积满了水，他用叉与水炮攻击。招式：狂乱连击、旋浪、钢叉连击、钢叉重砸。',
    'You_Loong_the_Frenzied_Blackwater_Crew_Leader',
  ],
  [
    'acolyte-guhe', '蛊鹤', 'Acolyte Guhe', '梅谷湖', '梅谷村东码头铃铛以南，岛边缘的稻草人', '蛊鹤的毒面具',
    null,
    '四位稻草人幻术师之一，他们守着一个秘密，属于一条可以在地图上追踪的支线。wiki 页面尚未写出招式与打法，待补。',
    'Acolyte_Guhe',
  ],
  [
    'grief-stricken-jin', '悲痛欲绝的阿瑾', 'Grief-Stricken Jin', '梅谷湖', '陆家浅滩码头铃铛东南的空地', '绣花鞋',
    null,
    '湖区的可选战斗，与主线无关。这是游戏里仅有的两场「剑阵」战之一：和七星剑阵一样要面对七名敌人，区别在于这一场只有一个阶段，而且七人全部是赤衣剑客，阿瑾本人也在阵中。',
    'Grief-Stricken_Jin',
  ],
  [
    'blizzard-blademaster', '风雪刀客', 'Blizzard Blademaster', '梅谷湖', "白影陨落处铃铛附近", '白影',
    null,
    'wiki 的这一页还是空模板，只有位置与掉落，打法待补。注意：掉落武器「白影」的页面把获取区域写成了枷笼山，与本页的梅谷湖不一致，待核实。',
    'Blizzard_Blademaster',
  ],
  [
    'mo-yuan', '魔渊', 'Mo Yuan, Leader of the Bastion of Mo', '梅谷湖', '东南岛屿上的龙柱内的隐藏场地', '',
    null,
    '隐藏 BOSS，暗魔天堡之主，由甄子丹饰演，对应支线「血脉觉醒」的终章。wiki 的这一页还是空模板，打法待补；页面的掉落一栏写着「别离残钩」，与勾魂的掉落重复，疑为误填，这里不采用。',
    'Mo_Yuan_Leader_of_the_Bastion_of_Mo',
  ],

  // ==================== 正道大营 ====================
  [
    'wan-jun', '万钧', 'Wan Jun the Coppermaul', '正道大营', '瞭望塔下铃铛附近，打断挡路的锁链后进入', '长柄金瓜',
    null,
    '体型最大的 BOSS 之一，使用巨大的铜锤，依靠体型与重击造成高额伤害。他砸锤时会扬起大片尘土遮挡视线，这是这一战的主要难点；他的连段本身很慢。',
    'Wan_Jun_the_Coppermaul',
  ],
  [
    'wu-lengshuang', '乌冷霜', 'Wu Lengshuang the Soft Sword', '正道大营', '演武场之路铃铛右侧，大屋后院楼梯上的场地', '灵蛇软剑',
    null,
    '难点在她的软剑：除非她处于硬直或破防状态，否则能轻易拨开你的大部分攻击。她会用一记打出硬直的攻击反制你，然后接带颜色提示的攻击；如果她把你的攻击招架成硬直，会接一记黑光攻击把你击飞。',
    'Wu_Lengshuang_the_Soft_Sword',
  ],
  [
    'chief-disciple-seven-star', '大师兄', 'Chief Disciple of the Seven-Star Formation', '正道大营', '三塔铃铛下方，三座火塔所在的空地', '剑客召集令、演武场钥匙',
    null,
    '七星剑阵。虽然是面对多名敌人，但并不是传统意义上的群体战：七个人作为一个整体行动。开战时 BOSS 必定以一记红光攻击起手。',
    'Chief_Disciple_of_the_Seven-Star_Formation',
  ],
  [
    'yubi-no-21', '玉璧', 'Yubi, No. 21 Swordfighter Puppet', '正道大营', '演武场场地内（需要演武场钥匙）', '白山风雷剑',
    null,
    '人偶 BOSS，双持两把带属性的剑，除了剑招还要留意属性效果。她有一招红光攻击：跃起后向你下劈。',
    'Yubi_No._21_Swordfighter_Puppet',
  ],
  [
    'corpse-eating-xue', '吞噬尸体的小雪', 'Corpse-Eating Xue', '正道大营', '万人坑：崖边栈道入口铃铛附近，上到木平台高层，用正道谷门钥匙开门', '',
    null,
    '第二个「群体 BOSS」，整场都要同时应付多名敌人。她会召唤多名手持不同武器的疯女人，自己体型稍大、使用耙子；她本人的攻击模式简单，容易读。击败后开启新任务「小雪，慕英雄者」。招式：召唤、钉耙重砸。',
    'Corpse-Eating_Xue',
  ],
  [
    'red-the-mysterious-swordswoman', '红衣女剑客', 'Red the Mysterious Swordswoman', '正道大营', '鸽楼铃铛旁的塔顶', '',
    null,
    '红衣女剑客，用快速的剑击与踢技，在屋顶的狭小场地里对拼，几乎没有远程攻击。注意：在这里与她开打，会导致无法获得一朵记忆之花和一件饰品，wiki 建议先离开这里，让她之后加入另一场 BOSS 战。',
    'Red_the_Mysterious_Swordswoman',
  ],

  // ==================== 枷笼山 ====================
  [
    'iron-butcher', '铁杀', 'Iron Butcher, the Frenzied Brute', '枷笼山', '区域起点附近', '铁屠夫面具',
    null,
    '第二个「狂徒」，招式与游戏里第一个 BOSS 相近，多了几手。其中一招是连续的大范围横扫，离他远时更容易出：左右挥四下，再接两次突进，最后一次突进是红光攻击，会抓住你造成大量伤害。',
    'Iron_Butcher_the_Frenzied_Brute',
  ],
  [
    'kui-yanyan', '奎艳艳', 'Kui Yanyan, the Deranged', '枷笼山', '神庙外门附近的下层区域', '缺失的升降梯摇把、杀气琥珀碎片',
    null,
    '枷笼山的小 BOSS，是疯女人敌人的精英版，使用棍棒；遇到她时她正与两名面具敌人交战。普通攻击是慢速挥棍，第三下可能是蓝光攻击；另有一招挥棍转三圈的旋转攻击。',
    'Kui_Yanyan_the_Deranged',
  ],
  [
    'bi-feng', '毕峰', 'Bi Feng, Giant Saber Commander', '枷笼山', '将军台（洞窟通道铃铛之后）', '荡寇凶刃',
    null,
    '使用大砍刀，挥砍范围很大，实际覆盖面积比看上去的近战攻击更大；拿着重武器却相当灵活。常规连段是两到三下挥砍，并在向后跳开时放出刀气。如果他腾空转两圈，接下来是一记红光下劈，没有完美闪避就会被打出硬直。',
    'Bi_Feng_Giant_Saber_Commander',
  ],
  [
    'jade-face', '玉面郎君', 'Jade-Face', '枷笼山', '圣母祠的大门处', '玉双环',
    null,
    '荒行子的精锐面具护卫之首，一路上面具敌人会不断提起他。这场战斗的特别之处在于「一个 BOSS」由三名敌人组成；其中铁面具与金面具和流程中遇到的普通版本相同，可以在战斗中击杀。',
    'Jade-Face',
  ],
  [
    'huangxing', '荒行子', 'Huangxing, the Kunlun Renegade', '枷笼山', '圣母祠之后的寺庙内（击败玉面郎君后进入）', '血滴子',
    null,
    '使用血滴子，能直接取人首级。战斗中既要留意血滴子，也要应付他的剑招，以及把血滴子的旋转刀刃当锁链兵器使的攻击。开场他会旋转血滴子并抛向空中，是一记意在斩首的红光攻击；即使他不在视野内，这一击也有预兆可以察觉。',
    'Huangxing_the_Kunlun_Renegade',
  ],

  // ==================== 戏梦山庄 ====================
  [
    'yuding-no-12', '玉鼎', 'Yuding, No. 12 Crescent Blade Puppet', '戏梦山庄', '演武场（经戏楼进入）', '偃月刀',
    null,
    '人偶 BOSS，使用带风属性的巨大偃月刀。普通攻击是大范围的挥砍，段数不多，连段通常三到四下，但威力大，正面硬接会损失大量杀气。',
    'Yuding_No._12_Crescent_Blade_Puppet',
  ],
  [
    'qiu-feng', '囚锋', 'Qiu Feng, the Crimson Boneblade', '戏梦山庄', '悼亡堂铃铛附近上楼梯，开门进入场地', '鬼面',
    null,
    '戴绯红面具的影刺。wiki 页面的打法正文较少，招式与要点待补。',
    'Qiu_Feng_the_Crimson_Boneblade',
  ],
  [
    'lei-dang', '雷当', 'Lei Dang, One-Armed Tiger', '戏梦山庄', '完璧池铃铛之后的楼梯顶端', '虎炮',
    null,
    '魂的旧日同伴，「组织」的精锐之一。一阶段他依靠手臂上的虎炮和蛮力打出重击。开战后他会先蓄力再开一炮，瞄准之后不会继续追踪魂，看到他举炮就向侧面闪避。',
    'Lei_Dang_One-Armed_Tiger',
  ],

  // ==================== 断魂山 ====================
  [
    'the-crusher-and-the-saw', '力者和锯者', 'The Crusher and the Saw', '断魂山', '巨人之巢铃铛附近，从有开口的墙面爬上去', '断肢锯',
    null,
    'wiki 的这一页只有位置与掉落，打法待补。',
    'The_Crusher_and_the_Saw',
  ],
  [
    'leng-tu', '冷荼', 'Leng Tu, Herald of the Veil', '断魂山', '断魂崖的最后一个铃铛之后（不可返回）', '',
    null,
    '倒数第二个 BOSS。正式开打前，他会用丝线束缚的力量召唤出许多你之前打过的 BOSS。进入前建议把支线清完：到达最后一个铃铛后无法返回，必须打完连战才能离开。',
    'Leng_Tu_Herald_of_the_Veil',
  ],
  [
    'meng-hua', '救苦救难梦华圣母娘娘', 'Meng Hua, the Merciful Lady of the Blossom Veil', '断魂山', '断魂崖（最终战）', '圣母邪扇、传令者的残丝、圣母之冠',
    null,
    '最终战的最后一段，对手是「圣母」。她使用两把带刃的扇子并配合法术攻击。开场她会召唤四道绕场旋转的光束，向她脚下的一点汇聚，这一招覆盖整个场地。',
    'Meng_Hua_the_Merciful_Lady_of_the_Blossom_Veil',
  ],
]

const bosses = rows.map(([id, nameZh, nameEn, region, place, drop, phases, tips, slug]) => ({
  id,
  name: nameZh || nameEn,
  nameEn,
  zhPending: nameZh === null,
  region,
  place,
  drop,
  phases,
  tips,
  source: `${WIKI}${slug}`,
}))

// 区域顺序按 3DM 两篇攻略的目录顺序排列；章节名只写目录里出现过的
export const bossRegions = [
  { id: '悲泣溪谷', label: '悲泣溪谷', desc: '第一章「逆流直上」。教学 BOSS 左殇、残钢、斧老大彭猛都在这里，另有隐藏 BOSS 新娘阿花与支线 BOSS 魔偶。' },
  { id: '血色森林', label: '血色森林', desc: '第二章「林中血，镜中蛇」。花千笑、荆野、铁狂，章末是双阶段的白赤练。' },
  { id: '陆家村', label: '陆家村', desc: '第三章「失心村」。两位师父的残躯、人偶 BOSS，章末是三阶段的沐小葵。' },
  { id: '庞镇', label: '庞镇', desc: '第四章「死镇」。BOSS 最密集的区域，多名精锐影卫与旧日同伴都在这里。' },
  { id: '梅谷湖', label: '梅谷湖', desc: '湖区与各个岛屿。主线的断肠之外，多数是分布在岛上的可选战斗。' },
  { id: '正道大营', label: '正道大营', desc: '击败骨婉约后解锁。七星剑阵、万钧、乌冷霜等都在这里。' },
  { id: '枷笼山', label: '枷笼山', desc: '面具敌人的地盘，终点是玉面郎君与荒行子。' },
  { id: '戏梦山庄', label: '戏梦山庄', desc: '第八章「戏梦山庄」。玉鼎、囚锋与雷当都在这一章，人偶 BOSS 的编号也标在名字里。' },
  { id: '断魂山', label: '断魂山', desc: '最终章「断魂山」。到达最后一个铃铛后无法返回。' },
]

export const bossStats = {
  total: bosses.length,
  regions: bossRegions.length,
  zhPending: bosses.filter((item) => item.zhPending).length,
}

export default bosses
