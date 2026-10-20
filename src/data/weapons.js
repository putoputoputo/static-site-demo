// 艾尔登法环武器图鉴数据
// dlc: true 表示该武器来自 DLC「黄金树幽影」，名称显示为「xx(DLC)」
// attackType: 攻击类型（打击 / 斩击 / 突刺 / 斩击与突刺混用）
// status: 自带异常状态累积（出血 / 冻伤 / 黑焰等），空数组表示无
// 数值整理自游戏内武器面板，仅供配装参考

import weaponsExtra from './weaponsExtra.js'

const weapons = [
  // ==================== 刀 ====================
  {
    id: 'uchigatana',
    name: '打刀',
    dlc: false,
    type: '刀',
    region: '宁姆格福',
    attackType: '斩击',
    status: ['出血'],
    description:
      '黄金一族的随从——武士所用的刀。讲究以锐利刀刃斩击要害，攻击轻快且能引发出血异常状态，是褪色者前期最容易上手的入门武器。',
    stats: { physical: 115, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 5.5 },
    scaling: { str: 'D', dex: 'D', int: '-', fai: '-', arc: '-' },
    requirements: { str: 11, dex: 15, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '居合',
      description: '摆出收刀入鞘的架势，再度按下可施展速度极快的拔刀斩，可接续普通攻击或重攻击派生。',
    },
    gameplay: [
      '攻击模组优秀，重攻击削韧可观，出血累积高，是出血流的核心武器之一。',
      '居合战技出手快、削韧强，可用于打断敌人动作，配合翻滚取消非常灵活。',
      '双持两把打刀跳劈流是经典流派，出血叠加效率极高。',
    ],
    build: {
      stats: { vigor: 40, mind: 20, endurance: 25, str: 12, dex: 55, int: 9, fai: 9, arc: 17 },
      talismans: ['腐败翼剑徽记', '钩爪护符', '腐坏血刃护符', '绿龟护符'],
      weapons: ['打刀（主手）', '打刀（副手双持）'],
      sorceries: [],
      incantations: ['火焰的授予力量（可选）'],
    },
    location: '宁姆格福·死亡臣民的地下墓地：进入后第一个房间拉杆石室内的尸体上拾取。',
  },
  {
    id: 'moonveil',
    name: '名刀月隐',
    dlc: false,
    type: '刀',
    region: '盖利德',
    attackType: '斩击',
    status: [],
    description:
      '源自月之民狩猎仪式的刀。刀身泛着青白色的月光，可以射出贯穿一切的月光波，是法术骑士流的标志性武器。',
    stats: { physical: 96, magic: 52, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 6.5 },
    scaling: { str: 'E', dex: 'D', int: 'B', fai: '-', arc: '-' },
    requirements: { str: 12, dex: 18, int: 23, fai: 0, arc: 0 },
    skill: {
      name: '瞬间月光',
      description: '摆出居合架势，再度按下可向前方射出大范围横斩月光波（横扫）或纵斩月光波（直刺），专注值消耗较高。',
    },
    gameplay: [
      '智力号的近战神兵，月光波伤害高、范围大，是推图与 PVP 的热门选择。',
      '横扫月光波适合清群怪，纵斩月光波单点爆发强，可按场景切换。',
      '普通攻击削韧不错，配合远程魔法形成远近结合的战斗节奏。',
    ],
    build: {
      stats: { vigor: 35, mind: 30, endurance: 15, str: 12, dex: 22, int: 55, fai: 9, arc: 9 },
      talismans: ['卡利亚奉还', '蓝秘文戒指（专注领域）', '魔法师球', '绿龟护符'],
      weapons: ['名刀月隐', '学院辉石杖或卢恩杖'],
      sorceries: ['彗星亚兹勒', '迅魔砾'],
      incantations: [],
    },
    location: '盖利德·盖尔隧道：击败深处的 BOSS「熔岩土龙玛卡」后掉落。隧道需从宁姆格福一侧或盖利德一侧进入。',
  },
  {
    id: 'rivers-of-blood',
    name: '尸山血河',
    dlc: false,
    type: '刀',
    region: '巨人山顶',
    attackType: '斩击',
    status: ['出血'],
    description:
      '缠绕在血怪尸体上的妖刀，刀身铭刻着横尸遍野的战场记忆。连续攻击会产生血刃风暴，出血流派的巅峰武器。',
    stats: { physical: 121, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 6.5 },
    scaling: { str: 'E', dex: 'D', int: '-', fai: '-', arc: 'D' },
    requirements: { str: 12, dex: 18, int: 0, fai: 0, arc: 20 },
    skill: {
      name: '尸山血河',
      description: '交叉刀身连续挥出三段血刃波，攻击范围与出血累积都极为恐怖。',
    },
    gameplay: [
      '战技血刃波范围大、段数多，一次命中即可叠满大部分敌人的出血条。',
      '左手持同系出血刀、右手尸山血河的跳劈流是版本答案之一。',
      '战技专注值消耗较高，建议搭配回蓝手段或蓝瓶分配。',
    ],
    build: {
      stats: { vigor: 45, mind: 20, endurance: 25, str: 13, dex: 45, int: 9, fai: 9, arc: 45 },
      talismans: ['腐败翼剑徽记', '钩爪护符', '腐坏血刃护符', '神皮布偶'],
      weapons: ['尸山血河（主手）', '神皮缝针或打刀（副手）'],
      sorceries: [],
      incantations: ['血焰武器'],
    },
    location: '巨人山顶北部：在雪原区域被血指「翁」入侵，击败入侵者后获得。',
  },
  {
    id: 'hand-of-malenia',
    name: '玛莲妮亚的义手刀',
    dlc: false,
    type: '刀',
    region: '圣树',
    attackType: '斩击',
    status: ['出血'],
    description:
      '玛莲妮亚以义手挥舞的修长刀。剑技华丽如飞鸟掠水，攻击衔接极快，是技术流玩家追求的毕业级刀。',
    stats: { physical: 129, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 7.0 },
    scaling: { str: 'E', dex: 'S', int: '-', fai: '-', arc: '-' },
    requirements: { str: 10, dex: 16, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '水鸟乱舞',
      description: '连续施展三次如水鸟掠过水面般的极速连斩，全命中的伤害与出血累积毁天灭地。',
    },
    gameplay: [
      '水鸟乱舞是全游戏最强的输出战技之一，但出招前摇明显，需抓住敌人硬直释放。',
      '普通攻击模组干净利落，配合狮子斩可补足削韧短板。',
      '高灵巧加点后物理面板极高，出血流与纯敏攻流皆可胜任。',
    ],
    build: {
      stats: { vigor: 40, mind: 15, endurance: 25, str: 10, dex: 70, int: 9, fai: 9, arc: 9 },
      talismans: ['亚历山大的碎片', '腐坏血刃护符', '钩爪护符', '绿龟护符'],
      weapons: ['玛莲妮亚的义手刀'],
      sorceries: [],
      incantations: ['黄金树恩惠（回血续航）'],
    },
    location: '圣树分支·艾布雷菲尔：击败 BOSS「玛莲妮亚，腐朽刃」，用其追忆在大赐福的指头女侍恩雅处兑换。',
  },

  // ==================== 大刀（DLC 新增类型） ====================
  {
    id: 'great-katana',
    name: '大刀',
    dlc: true,
    type: '大刀',
    region: '影之地·墓地平原',
    attackType: '斩击与突刺',
    status: ['出血'],
    description:
      'DLC 新增武器类型「大刀」的基础款，官方译名即「大刀」（大太刀）。刀身极长、重量惊人，斩击与突刺兼用，一刀下去往往直接触发大出血。',
    stats: { physical: 145, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 9.0 },
    scaling: { str: 'D', dex: 'D', int: '-', fai: '-', arc: '-' },
    requirements: { str: 14, dex: 18, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '大上段',
      description: '将刀举至头顶摆出架势，轻攻击派生踏步下劈，重攻击派生「一文字」三连斩，是兼具范围与爆发的架式类战技。',
    },
    gameplay: [
      '攻击距离在近战武器里名列前茅，横斩贴脸清群非常舒服。',
      '自带出血，配合「鲜血斩击」或出血附魔可以快速叠条。',
      '重量偏大，建议搭配绿龟护符与足够耐力，或直接骑乘作战。',
    ],
    build: {
      stats: { vigor: 45, mind: 15, endurance: 30, str: 20, dex: 55, int: 9, fai: 9, arc: 20 },
      talismans: ['腐坏血刃护符', '钩爪护符', '绿龟护符', '红羽剩徽记'],
      weapons: ['大刀', '黄铜盾或无盾'],
      sorceries: [],
      incantations: ['血焰武器（可选）'],
    },
    location: '影之地·墓地平原：地图西侧湖泊中央（灵火龙所在的湖）拾取；可先沿三叉口中间的路北上前往置病村。',
  },

  // ==================== 大曲刀 ====================
  {
    id: 'bloodhounds-fang',
    name: '猎犬长牙',
    dlc: false,
    type: '大曲剑',
    region: '宁姆格福',
    attackType: '斩击',
    status: ['出血'],
    description:
      '沾染猎犬血肉的大曲刀，刀身细长如犬牙。攻击范围大、伤害高，战技自带无敌位移，是公认的通关利器。',
    stats: { physical: 141, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 10.5 },
    scaling: { str: 'D', dex: 'C', int: '-', fai: '-', arc: '-' },
    requirements: { str: 18, dex: 17, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '血犬剑技',
      description: '向后高高跃起规避攻击，再以势大力沉的斜斩反击，追加攻击可派生回旋斩。',
    },
    gameplay: [
      '前期即可获得，攻击范围极大、出血累积可观，全流程强度在线。',
      '战技前半段带有无敌帧，可躲开敌人攻击的同时贴脸反击，是 PVP 神技。',
      '重攻击削韧优秀，对付人型 BOSS 压制力极强。',
    ],
    build: {
      stats: { vigor: 45, mind: 15, endurance: 30, str: 20, dex: 50, int: 9, fai: 9, arc: 9 },
      talismans: ['腐坏血刃护符', '钩爪护符', '绿龟护符', '红羽剩徽记'],
      weapons: ['猎犬长牙', '黄金树大盾或无盾'],
      sorceries: [],
      incantations: ['血焰武器（可选）'],
    },
    location: '宁姆格福·无主猎犬的封印监牢：进入封印监牢击败 BOSS「猎犬骑士达瑞威尔」后获得。',
  },
  {
    id: 'morgotts-cursed-sword',
    name: '蒙葛特的咒刀',
    dlc: false,
    type: '大曲剑',
    region: '王城罗德尔',
    attackType: '斩击',
    status: ['出血'],
    description:
      '「诅咒之王」蒙葛特挥舞的黄金咒刀。以金色血液凝成的咒刃挥砍，将王城的诅咒具现为攻击。',
    stats: { physical: 118, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 9.5 },
    scaling: { str: 'D', dex: 'C', int: '-', fai: '-', arc: '-' },
    requirements: { str: 14, dex: 21, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '诅咒之王的野心',
      description: '向前方挥出大范围黄金咒血斩击，命中后引发爆炸，威力与冲击力兼备。',
    },
    gameplay: [
      '战技范围极大，清群怪效率一流，出手速度在大曲刀里也属上乘。',
      '自带出血属性，配合感应加点可以快速触发异常状态。',
      '攻击模组以横扫为主，适合对付大体型 BOSS。',
    ],
    build: {
      stats: { vigor: 45, mind: 15, endurance: 30, str: 16, dex: 55, int: 9, fai: 9, arc: 20 },
      talismans: ['腐坏血刃护符', '钩爪护符', '绿龟护符', '红羽剩徽记'],
      weapons: ['蒙葛特的咒刀'],
      sorceries: [],
      incantations: ['血焰武器（可选）'],
    },
    location: '王城罗德尔：击败 BOSS「诅咒之王」蒙葛特，用其追忆在大赐福的指头女侍恩雅处兑换。',
  },
  {
    id: 'magma-wyrm-scalesword',
    name: '熔岩土龙的鳞剑',
    dlc: false,
    type: '大曲剑',
    region: '利耶尼亚',
    attackType: '斩击',
    status: [],
    description:
      '以熔岩土龙的鳞片与骨骼锻造的剑。挥砍时喷洒灼热熔岩，是力量与火焰的暴力美学。',
    stats: { physical: 115, magic: 0, fire: 62, lightning: 0, holy: 0, critical: 100, weight: 11.0 },
    scaling: { str: 'C', dex: 'E', int: '-', fai: '-', arc: '-' },
    requirements: { str: 22, dex: 15, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '土龙的咆哮',
      description: '向前方喷出扇形熔岩并挥出灼热斩击，地面残留的熔岩会持续燃烧。',
    },
    gameplay: [
      '物理与火焰双属性面板，对付弱火 BOSS 收益极高。',
      '战技会在地面残留熔岩伤害，可以卡地形持续输出。',
      '力量号专属大剑，搭配狮子斩战灰可补足灵活性。',
    ],
    build: {
      stats: { vigor: 45, mind: 15, endurance: 35, str: 60, dex: 15, int: 9, fai: 14, arc: 9 },
      talismans: ['火对蝎', '亚历山大的碎片', '绿龟护符', '恩惠的肉眼'],
      weapons: ['熔岩土龙的鳞剑'],
      sorceries: [],
      incantations: ['火焰的授予力量'],
    },
    location: '利耶尼亚·遗迹密道：沿坑道深入击败深处的熔岩土龙后掉落（该坑道是通往亚坛高原的捷径之一）。',
  },

  // ==================== 直剑 ====================
  {
    id: 'longsword',
    name: '长剑',
    dlc: false,
    type: '直剑',
    region: '大赐福',
    attackType: '斩击与突刺',
    status: [],
    description:
      '最标准、最均衡的骑士用剑。攻击速度快、耗精低，战技可派生多种攻击，是万年不过时的基本功武器。',
    stats: { physical: 110, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 3.5 },
    scaling: { str: 'D', dex: 'D', int: '-', fai: '-', arc: '-' },
    requirements: { str: 10, dex: 10, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '架势',
      description: '摆出中段架势，可派生上挑斩或突刺，削韧效果好，是可攻可守的全能战技。',
    },
    gameplay: [
      '万金油武器，任何流派都可以用附魔或战灰改造成对应属性。',
      '直剑攻击频率高，配合出血战灰效率可观。',
      '新手推荐先把架势战技的派生练熟，收益贯穿全流程。',
    ],
    build: {
      stats: { vigor: 40, mind: 20, endurance: 25, str: 40, dex: 20, int: 9, fai: 9, arc: 9 },
      talismans: ['亚历山大的碎片', '绿龟护符', '红羽剩徽记', '曲剑护符'],
      weapons: ['长剑', '黄铜盾或乌龟盾'],
      sorceries: [],
      incantations: ['黄金树的恩惠（可选）'],
    },
    location: '初始职业「流浪骑士」自带；也可在大赐福的孪生老妪处购买。',
  },
  {
    id: 'lordsworn-sword',
    name: '君王军直剑',
    dlc: false,
    type: '直剑',
    region: '宁姆格福',
    attackType: '斩击与突刺',
    status: [],
    description:
      '君王军士兵佩用的直剑。锻造工艺优良，致命一击倍率高于普通直剑，前期性价比极高。',
    stats: { physical: 112, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 110, weight: 3.5 },
    scaling: { str: 'D', dex: 'D', int: '-', fai: '-', arc: '-' },
    requirements: { str: 10, dex: 10, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '摆好架势',
      description: '压低重心摆出架势，派生攻击带有强力削韧，适合打出处决。',
    },
    gameplay: [
      '110 的致命一击倍率，配合处决流玩法收益很高。',
      '前期最好的直剑之一，可以从史东薇尔城一路用到中期。',
      '推荐附魔「焰术」或「雷电」针对弱属性 BOSS。',
    ],
    build: {
      stats: { vigor: 40, mind: 15, endurance: 25, str: 40, dex: 20, int: 9, fai: 15, arc: 9 },
      talismans: ['亚历山大的碎片', '绿龟护符', '红羽剩徽记', '蓝秘文戒指'],
      weapons: ['君王军直剑', '黄铜盾'],
      sorceries: [],
      incantations: ['焰术武器', '黄金树的恩惠'],
    },
    location: '宁姆格福·史东薇尔城内，士兵类敌人随机掉落，也常见于城内士兵尸体上拾取。',
  },
  {
    id: 'sword-of-night-and-flame',
    name: '夜与火之剑',
    dlc: false,
    type: '直剑',
    region: '利耶尼亚',
    attackType: '斩击与突刺',
    status: [],
    description:
      '描绘夜与火预言的仪式剑。剑柄左右刻着月亮与太阳，战技可释放月光波或火焰魔砾，集魔法与信仰于一身。',
    stats: { physical: 91, magic: 63, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 5.0 },
    scaling: { str: 'E', dex: 'E', int: 'D', fai: 'D', arc: '-' },
    requirements: { str: 12, dex: 12, int: 24, fai: 24, arc: 0 },
    skill: {
      name: '夜与火的架势',
      description: '水平持剑摆出架势：普通攻击放出大范围月光波，重攻击放出多段火球，两种属性自由切换。',
    },
    gameplay: [
      '月光波清图、火球打 BOSS，一把武器覆盖两种属性输出。',
      '智力与信仰双修加点后战技伤害爆炸，是著名的「版本之子」武器。',
      '武器自身近战较弱，主要靠战技吃饭，注意专注值管理。',
    ],
    build: {
      stats: { vigor: 35, mind: 35, endurance: 15, str: 12, dex: 12, int: 40, fai: 40, arc: 9 },
      talismans: ['魔法师球', '圣职者司祭（信仰+2）', '绿龟护符', '亚历山大的碎片'],
      weapons: ['夜与火之剑'],
      sorceries: ['彗星亚兹勒（可选）'],
      incantations: ['黄金树恩惠（可选）'],
    },
    location: '利耶尼亚·卡利亚城寨：城寨内部房间的宝箱中，需要穿过书架迷宫区域抵达。',
  },

  // ==================== 大剑 ====================
  {
    id: 'dark-moon-greatsword',
    name: '暗月大剑',
    dlc: false,
    type: '大剑',
    region: '利耶尼亚',
    attackType: '斩击',
    status: ['冻伤'],
    description:
      '菈妮交给褪色者的「暗月大剑」，即传说中的月光大剑。剑刃缠绕青白寒气，挥出的每一斩都附带冻伤。',
    stats: { physical: 101, magic: 85, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 8.0 },
    scaling: { str: 'E', dex: 'E', int: 'S', fai: '-', arc: '-' },
    requirements: { str: 16, dex: 12, int: 38, fai: 0, arc: 0 },
    skill: {
      name: '月光大剑',
      description: '为剑刃附加强力魔法冻伤属性，附加期间重攻击会射出月光波。',
    },
    gameplay: [
      '战技附魔后每次攻击附带魔力与冻伤双重伤害，续航与爆发兼备。',
      '重攻击远程月光波可以安全消耗 BOSS，近战远程两开花。',
      '法师毕业近战武器，智力号全流程强度顶级。',
    ],
    build: {
      stats: { vigor: 35, mind: 30, endurance: 20, str: 16, dex: 12, int: 70, fai: 9, arc: 9 },
      talismans: ['魔法师球', '亚历山大的碎片', '绿龟护符', '红羽剩徽记'],
      weapons: ['暗月大剑', '卢恩杖'],
      sorceries: ['彗星亚兹勒', '迅魔砾'],
      incantations: [],
    },
    location: '完成菈妮支线：推进至月光祭坛，在结局阶段由菈妮授予（支线全程约需经过地下城与安瑟尔主流域）。',
  },
  {
    id: 'golden-order-greatsword',
    name: '黄金律法大剑',
    dlc: false,
    type: '大剑',
    region: '巨人山顶',
    attackType: '斩击',
    status: [],
    description:
      '由黄金律法力量铸成的大剑，剑身流转金色光辉。唯有信仰与灵巧兼备者才能挥动，是信仰流的门面武器。',
    stats: { physical: 106, magic: 0, fire: 0, lightning: 0, holy: 62, critical: 100, weight: 9.0 },
    scaling: { str: 'E', dex: 'D', int: '-', fai: 'B', arc: '-' },
    requirements: { str: 16, dex: 21, int: 0, fai: 28, arc: 0 },
    skill: {
      name: '确立秩序',
      description: '向天举起剑召唤黄金律法的力量，随后向下轰出大范围圣光冲击波。',
    },
    gameplay: [
      '战技「确立秩序」范围大、削韧高，是清场和处决衔接的核心手段。',
      '圣属性伤害对死系、幽灵系敌人特攻，推图如砍瓜切菜。',
      '信敏流加点下圣属性面板极高，配合圣附魔伤害更上一层。',
    ],
    build: {
      stats: { vigor: 40, mind: 25, endurance: 25, str: 16, dex: 22, int: 9, fai: 55, arc: 9 },
      talismans: ['圣对蝎', '亚历山大的碎片', '绿龟护符', '红羽剩徽记'],
      weapons: ['黄金律法大剑'],
      sorceries: [],
      incantations: ['黄金树的恩惠', '圣律剑刃'],
    },
    location: '巨人山顶·化圣雪原的洞窟深处：击败 BOSS「混种十字军」后获得（洞窟入口在雪原西侧断崖下方）。',
  },
  {
    id: 'royal-greatsword',
    name: '王室巨剑',
    dlc: false,
    type: '大剑',
    region: '利耶尼亚',
    attackType: '斩击',
    status: ['冻伤'],
    description:
      '王室骑士布莱泽挥舞的黑蓝色巨剑。剑身附带寒气魔力，挥砍时冷气逼人，狼群般的一击撕裂敌人。',
    stats: { physical: 120, magic: 55, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 10.0 },
    scaling: { str: 'C', dex: 'E', int: 'D', fai: '-', arc: '-' },
    requirements: { str: 26, dex: 18, int: 22, fai: 0, arc: 0 },
    skill: {
      name: '狼群突击',
      description: '向前方高高跃起，召唤狼影向下猛砸，引发大范围寒气爆炸并附加冻伤。',
    },
    gameplay: [
      '战技「狼群突击」突进距离极远，可用于快速贴脸或脱离战场。',
      '自带魔力与冻伤属性，力量法师双修流的核心武器。',
      '攻击模组大开大合，注意与敌人保持中距离输出。',
    ],
    build: {
      stats: { vigor: 40, mind: 25, endurance: 30, str: 45, dex: 18, int: 35, fai: 9, arc: 9 },
      talismans: ['魔对蝎', '亚历山大的碎片', '绿龟护符', '蓝秘文戒指'],
      weapons: ['王室巨剑'],
      sorceries: ['迅魔砾（可选）'],
      incantations: [],
    },
    location: '完成菈妮支线：在菈妮的魔法师塔前与「布莱泽」对决，击败后获得。',
  },
  {
    id: 'greatsword-of-solitude',
    name: '孤牢大剑',
    dlc: true,
    type: '大剑',
    region: '影之地·墓地平原',
    attackType: '斩击',
    status: [],
    description:
      '孤牢骑士团使用的钢铁大剑。剑身刻着两枚徽章——诞生时的光辉与孤独。重量与面板都偏向力量型，破防能力出色。',
    stats: { physical: 138, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 15.0 },
    scaling: { str: 'C', dex: 'E', int: '-', fai: '-', arc: '-' },
    requirements: { str: 30, dex: 12, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '孤月斩',
      description: '以巨剑迅速下砍，向前方释放弧形光波；发动后接重攻击可以前冲追击，兼具远距离与位移。',
    },
    gameplay: [
      '战技「孤月斩」带远程光波，弥补大剑贴脸吃力的短板。',
      '纯力量加点面板优秀，配合「狮子斩」打削韧非常稳。',
      '重量 15.0，需要足够的耐力或负重护符支撑。',
    ],
    build: {
      stats: { vigor: 50, mind: 15, endurance: 35, str: 60, dex: 12, int: 9, fai: 9, arc: 9 },
      talismans: ['亚历山大的碎片', '绿龟护符', '大盾护符', '红羽剩徽记'],
      weapons: ['孤牢大剑', '黄铜盾或无盾'],
      sorceries: [],
      incantations: ['黄金树的恩惠（可选）'],
    },
    location: '影之地·墓地平原西北方的「西方无名灵庙」：击败 BOSS「孤牢骑士」后掉落（同时获得孤牢套装）。',
  },

  // ==================== 特大剑 ====================
  {
    id: 'starscourge-greatsword',
    name: '碎星大剑',
    dlc: false,
    type: '特大剑',
    region: '盖利德',
    attackType: '斩击',
    status: [],
    description:
      '「碎星」拉塔恩挥舞的一对特大剑。剑身沉重如星，双手各持一把时可进入双手持剑的特殊攻击模式。',
    stats: { physical: 129, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 20.0 },
    scaling: { str: 'C', dex: 'E', int: 'C', fai: '-', arc: '-' },
    requirements: { str: 19, dex: 16, int: 21, fai: 0, arc: 0 },
    skill: {
      name: '呼唤星云',
      description: '将两把巨剑插入地面呼唤重力，把周围敌人吸到身前后引发重力爆炸，可接续跳劈。',
    },
    gameplay: [
      '双持模式下攻速快、范围大，配合「呼唤星云」聚怪后跳劈清场极其爽快。',
      '力量与智力双修后面板优秀，是法师号转型近战的首选。',
      '重力爆炸削韧极强，对大体型 BOSS 压制力恐怖。',
    ],
    build: {
      stats: { vigor: 45, mind: 25, endurance: 35, str: 50, dex: 16, int: 35, fai: 9, arc: 9 },
      talismans: ['亚历山大的碎片', '绿龟护符', '红羽剩徽记', '恩惠的肉眼'],
      weapons: ['碎星大剑（一对）'],
      sorceries: ['重力魔砾（可选）'],
      incantations: [],
    },
    location: '盖利德·红狮子城：击败 BOSS「碎星将军」拉塔恩，用其追忆在大赐福的指头女侍恩雅处兑换。',
  },
  {
    id: 'malikeths-black-blade',
    name: '玛利喀斯的黑剑',
    dlc: false,
    type: '特大剑',
    region: '法姆亚兹拉',
    attackType: '斩击',
    status: [],
    description:
      '黑剑玛利喀斯所持的死亡卢恩大剑。挥出的每一斩都在铭刻「命运之死」，神圣伤害穿透一切防御。',
    stats: { physical: 133, magic: 0, fire: 0, lightning: 0, holy: 80, critical: 100, weight: 16.5 },
    scaling: { str: 'C', dex: 'E', int: '-', fai: 'D', arc: '-' },
    requirements: { str: 34, dex: 14, int: 0, fai: 22, arc: 0 },
    skill: {
      name: '命运之死',
      description: '化身金色风暴向前方猛冲乱舞，最后一击轰出巨大范围的黑金色死亡印记爆炸。',
    },
    gameplay: [
      '战技为全游戏顶级演出，多段伤害加大范围爆炸，BOSS 战爆发之王。',
      '圣属性面板极高，信仰力量双修流派的毕业武器。',
      '攻击前摇大，建议用黄金树恩惠等续航手段支撑持久战。',
    ],
    build: {
      stats: { vigor: 45, mind: 25, endurance: 35, str: 50, dex: 14, int: 9, fai: 40, arc: 9 },
      talismans: ['圣对蝎', '亚历山大的碎片', '绿龟护符', '红羽剩徽记'],
      weapons: ['玛利喀斯的黑剑'],
      sorceries: [],
      incantations: ['黄金树的恩惠', '圣律剑刃'],
    },
    location: '法姆亚兹拉：击败 BOSS「黑剑」玛利喀斯，用其追忆在大赐福的指头女侍恩雅处兑换。',
  },
  {
    id: 'ruins-greatsword',
    name: '遗迹大剑',
    dlc: false,
    type: '特大剑',
    region: '盖利德',
    attackType: '斩击',
    status: [],
    description:
      '以古代遗迹石材锻造的重剑，蕴含大地崩裂之力。挥舞时仿佛整个天空都在震颤，是力量流的浪漫。',
    stats: { physical: 132, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 18.0 },
    scaling: { str: 'B', dex: 'E', int: '-', fai: '-', arc: '-' },
    requirements: { str: 30, dex: 0, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '废墟波动',
      description: '举起巨剑引动大地之力，向下猛砸引发大范围冲击波，可将周围敌人击飞。',
    },
    gameplay: [
      '纯力量面板顶级，强化满后 S 级补正堪称数值怪物。',
      '战技冲击波适合被围攻时反打，削韧与击飞一体。',
      '重量极大，务必搭配高耐力与绿龟护符。',
    ],
    build: {
      stats: { vigor: 50, mind: 15, endurance: 40, str: 65, dex: 9, int: 9, fai: 9, arc: 9 },
      talismans: ['亚历山大的碎片', '绿龟护符', '红羽剩徽记', '恩惠的肉眼'],
      weapons: ['遗迹大剑'],
      sorceries: [],
      incantations: [],
    },
    location: '盖利德·红狮子城：击败城内 BOSS 组合「混种战士与尊腐骑士」后获得（庆典期间可挑战）。',
  },
  {
    id: 'sacred-relic-sword',
    name: '神躯化剑',
    dlc: false,
    type: '特大剑',
    region: '灰烬王城',
    attackType: '斩击',
    status: [],
    description:
      '以神躯残骸铸成的圣剑，通体流转黄金光辉。剑波横扫之处亡魂净化，是「圣别」之路的终点。',
    stats: { physical: 118, magic: 0, fire: 0, lightning: 0, holy: 70, critical: 100, weight: 13.0 },
    scaling: { str: 'D', dex: 'D', int: '-', fai: 'C', arc: '-' },
    requirements: { str: 14, dex: 24, int: 22, fai: 22, arc: 0 },
    skill: {
      name: '黄金波动',
      description: '向前方挥出贯穿地平线的巨大金色剑波，对大范围敌人造成圣属性伤害。',
    },
    gameplay: [
      '战技「黄金波动」是全游戏刷卢恩效率之王，一剑一波清屏。',
      '圣属性加高敏捷补正，信敏流毕业级武器。',
      '普通攻击模组轻盈，特大剑里少见的高机动性。',
    ],
    build: {
      stats: { vigor: 40, mind: 30, endurance: 25, str: 14, dex: 40, int: 22, fai: 40, arc: 9 },
      talismans: ['圣对蝎', '亚历山大的碎片', '绿龟护符', '红羽剩徽记'],
      weapons: ['神躯化剑'],
      sorceries: [],
      incantations: ['黄金树的恩惠'],
    },
    location: '击败最终 BOSS「艾尔登之兽」，用其追忆在大赐福的指头女侍恩雅处兑换。',
  },

  // ==================== 轻大剑（DLC 新增类型） ====================
  {
    id: 'rellanas-twinblade',
    name: '蕾菈娜的对剑',
    dlc: true,
    type: '轻大剑',
    region: '影之地·恩西斯城',
    attackType: '斩击与突刺',
    status: [],
    description:
      '「双月骑士」蕾菈娜的双剑。单手时为一对轻大剑，双手共持则会一分为二变成双刀，兼具魔力与火焰两种属性。',
    stats: { physical: 105, magic: 48, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 8.0 },
    scaling: { str: 'D', dex: 'D', int: 'C', fai: '-', arc: '-' },
    requirements: { str: 12, dex: 17, int: 20, fai: 0, arc: 0 },
    skill: {
      name: '月与火的架式',
      description: '举起灌注魔力的双剑摆出架势：轻攻击连射辉石光波（可再追两次），重攻击旋身以火焰横扫周围。',
    },
    gameplay: [
      '战技同时覆盖远程光波与近身火焰龙卷，攻守场景都能用。',
      '双手共持切换双刀模组，攻击段数和演出都极华丽。',
      '重量 8.0，配合轻装可以保持中翻滚。',
    ],
    build: {
      stats: { vigor: 40, mind: 30, endurance: 22, str: 14, dex: 20, int: 50, fai: 9, arc: 9 },
      talismans: ['魔对蝎', '魔法师球', '亚历山大的碎片', '绿龟护符'],
      weapons: ['蕾菈娜的对剑', '学院辉石杖（备用）'],
      sorceries: ['彗星亚兹勒', '星光碎片'],
      incantations: [],
    },
    location: '影之地·恩西斯城深处：击败 BOSS「双月骑士」蕾菈娜，用「双月骑士的追忆」在大赐福的「解指」恩雅处兑换。',
  },
  {
    id: 'milady',
    name: '仕女剑',
    dlc: true,
    type: '轻大剑',
    region: '影之地·恩西斯城',
    attackType: '斩击与突刺',
    status: [],
    description:
      '拥有大剑长度、却把重量压到极限的轻大剑。挥舞速度接近直剑，是大剑爱好者的手感救星。',
    stats: { physical: 96, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 4.5 },
    scaling: { str: 'E', dex: 'C', int: '-', fai: '-', arc: '-' },
    requirements: { str: 8, dex: 14, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '单翼架式',
      description: '单手持剑摆出架式，轻攻击派生可连打的三连斩，重攻击派生突进刺击，攻守转换顺畅。',
    },
    gameplay: [
      '重量只有 4.5，却拥有大剑级的长度与削韧，性价比极高。',
      '战技可无缝接入普通攻击，是轻大剑最舒服的连段核心。',
      '适合敏捷流与法系近战混合加点，可附魔出血或冻伤。',
    ],
    build: {
      stats: { vigor: 40, mind: 20, endurance: 20, str: 12, dex: 50, int: 9, fai: 9, arc: 12 },
      talismans: ['腐败翼剑徽记', '钩爪护符', '绿龟护符', '红羽剩徽记'],
      weapons: ['仕女剑', '黄铜盾或无盾'],
      sorceries: [],
      incantations: ['血焰武器（可选）'],
    },
    location: '影之地·恩西斯城：从「城前方」赐福出发过桥，爬上左侧建筑的楼梯到塔顶，开启宝箱获得。',
  },

  // ==================== 匕首 ====================
  {
    id: 'black-knife',
    name: '黑刀',
    dlc: false,
    type: '匕首',
    region: '亚坛高原',
    attackType: '斩击与突刺',
    status: [],
    description:
      '黑刀刺客所用的仪式匕首。刀刃浸染死亡卢恩的碎片，挥出的黑刃会持续削减敌人生命，是匕首中的特例。',
    stats: { physical: 78, magic: 0, fire: 0, lightning: 0, holy: 65, critical: 110, weight: 2.0 },
    scaling: { str: 'E', dex: 'D', int: '-', fai: 'C', arc: '-' },
    requirements: { str: 8, dex: 12, int: 0, fai: 18, arc: 0 },
    skill: {
      name: '死亡之刃',
      description: '向前挥出黑刃波，命中后持续削减目标最大生命值，对高血量 BOSS 极为有效。',
    },
    gameplay: [
      '战技的黑刃波带有最大生命削减效果，是少数能稳定削减 BOSS 血量的手段。',
      '重量仅 2.0，副手携带几乎不增加负重，适合作为属性补充的挂件。',
      '信仰号主力匕首，配合高致命一击倍率打处决收益可观。',
    ],
    build: {
      stats: { vigor: 40, mind: 25, endurance: 20, str: 10, dex: 20, int: 9, fai: 45, arc: 9 },
      talismans: ['圣对蝎', '红羽剩徽记', '绿龟护符', '亚历山大的碎片'],
      weapons: ['黑刀', '黄金律法大剑或圣印记'],
      sorceries: [],
      incantations: ['黄金树的恩惠', '圣律剑刃'],
    },
    location: '亚坛高原·英雄墓：深入墓地击败 BOSS「黑刀刺客」后掉落。',
  },
  {
    id: 'misericorde',
    name: '慈悲短刀',
    dlc: false,
    type: '匕首',
    region: '宁姆格福',
    attackType: '突刺',
    status: [],
    description:
      '为给予致命一击而生的细身短刀。刀身纤细却极为锋利，致命一击倍率是全游戏最高一档。',
    stats: { physical: 92, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 140, weight: 2.0 },
    scaling: { str: 'E', dex: 'D', int: '-', fai: '-', arc: '-' },
    requirements: { str: 7, dex: 12, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '疾步',
      description: '快速向前滑步规避攻击，可在滑动中调整方向，是轻装近身与走位的通用手段。',
    },
    gameplay: [
      '140 的致命一击倍率全游戏顶级，专门用来打处决与背刺。',
      '常见用法是主手重武器削韧、副手携带慈悲短刀完成处决，收益极高。',
      '重量仅 2.0，作为「处决工具人」几乎零成本。',
    ],
    build: {
      stats: { vigor: 40, mind: 15, endurance: 25, str: 20, dex: 45, int: 9, fai: 9, arc: 9 },
      talismans: ['红羽剩徽记', '猛禽黑羽', '绿龟护符', '亚历山大的碎片'],
      weapons: ['慈悲短刀（副手）', '巨剑或大锤（主手）'],
      sorceries: [],
      incantations: [],
    },
    location: '宁姆格福·史东薇尔城：城内上层房间的尸体上拾取（靠近城墙塔一侧的室内区域）。',
  },

  // ==================== 双头剑 ====================
  {
    id: 'godskin-peeler',
    name: '神皮双头剑',
    dlc: false,
    type: '双头剑',
    region: '盖利德',
    attackType: '斩击与突刺',
    status: ['黑焰'],
    description:
      '神皮使徒所用的双头剑。两端皆为锋刃，挥舞时如纺车般旋转，战技更能卷起黑焰龙卷。',
    stats: { physical: 108, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 8.5 },
    scaling: { str: 'D', dex: 'C', int: '-', fai: '-', arc: '-' },
    requirements: { str: 14, dex: 22, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '黑焰旋风',
      description: '原地旋转双头剑卷起黑焰龙卷，持续多段命中并附加黑焰持续伤害，可边走边放。',
    },
    gameplay: [
      '战技黑焰旋风多段命中，配合出血或黑焰附魔输出极高。',
      '双头剑跳劈模组段数多，是跳劈流的核心武器之一。',
      '攻击距离优秀，适合贴身缠斗型打法。',
    ],
    build: {
      stats: { vigor: 40, mind: 20, endurance: 30, str: 16, dex: 50, int: 9, fai: 9, arc: 9 },
      talismans: ['腐败翼剑徽记', '钩爪护符', '绿龟护符', '红羽剩徽记'],
      weapons: ['神皮双头剑', '另一把双头剑（双持）'],
      sorceries: [],
      incantations: ['血焰武器（可选）'],
    },
    location: '盖利德·神授塔（下层）：击败 BOSS「神皮使徒」后掉落。',
  },
  {
    id: 'eleonoras-poleblade',
    name: '艾蕾诺拉的双持剑',
    dlc: false,
    type: '双头剑',
    region: '亚坛高原',
    attackType: '斩击与突刺',
    status: ['出血'],
    description:
      '血指艾蕾诺拉挥舞的赤红双头剑。刀身如鲜血凝成，战技舞动时化作血色旋风，是出血双头剑的代表。',
    stats: { physical: 105, magic: 0, fire: 45, lightning: 0, holy: 0, critical: 100, weight: 7.0 },
    scaling: { str: 'E', dex: 'D', int: '-', fai: '-', arc: 'D' },
    requirements: { str: 12, dex: 18, int: 0, fai: 0, arc: 19 },
    skill: {
      name: '血舞旋风',
      description: '旋转双头剑连续挥砍，最后以血刃突刺收尾，全程附带出血累积。',
    },
    gameplay: [
      '战技连段长且全程出血，一次命中往往直接触发流血。',
      '自带火焰伤害，感应加点下双属性面板兼顾。',
      'PVP 中战技的突进与收尾极具压制力。',
    ],
    build: {
      stats: { vigor: 45, mind: 15, endurance: 25, str: 13, dex: 35, int: 9, fai: 9, arc: 45 },
      talismans: ['腐败翼剑徽记', '腐坏血刃护符', '钩爪护符', '绿龟护符'],
      weapons: ['艾蕾诺拉的双持剑', '双头剑（副手）'],
      sorceries: [],
      incantations: ['血焰武器'],
    },
    location: '亚坛高原：在玛丽卡第二教会一带被血指「艾蕾诺拉」入侵，击败后获得。',
  },
  {
    id: 'euporia',
    name: '艾珀莉亚',
    dlc: true,
    type: '双头剑',
    region: '影之地·塔之镇贝瑞特',
    attackType: '斩击与突刺',
    status: [],
    description:
      'DLC 的双头剑。剑身金光会随攻击逐渐恢复，光辉越盛，战技威力越强——恢复满后一次战技全部释放。',
    stats: { physical: 108, magic: 0, fire: 0, lightning: 0, holy: 60, critical: 100, weight: 8.5 },
    scaling: { str: 'E', dex: 'D', int: '-', fai: 'C', arc: '-' },
    requirements: { str: 12, dex: 22, int: 0, fai: 18, arc: 0 },
    skill: {
      name: '艾珀莉亚漩涡',
      description: '借漩涡之力激烈旋转剑身，向前方连续斩击；剑的光辉恢复越多威力越强，发动后会消耗全部光辉。',
    },
    gameplay: [
      '战技需要「攒光辉」再放，节奏感强，打满后单次爆发极高。',
      '双头剑跳劈与连段优秀，配合圣属性附魔对亡者类敌人特攻。',
      '专注值消耗 28 偏高，建议搭配蓝瓶与回蓝护符。',
    ],
    build: {
      stats: { vigor: 40, mind: 30, endurance: 25, str: 14, dex: 40, int: 9, fai: 35, arc: 9 },
      talismans: ['亚历山大的碎片', '圣对蝎', '绿龟护符', '蓝秘文戒指'],
      weapons: ['艾珀莉亚'],
      sorceries: [],
      incantations: ['黄金树的恩惠', '圣律剑刃'],
    },
    location: '影之地·塔之镇贝瑞特：沿祭坛路线深入探索，在祭坛上拾取。',
  },

  // ==================== 反手剑（DLC 新增类型） ====================
  {
    id: 'curseblades-cirque',
    name: '咒剑士圆刃刀',
    dlc: true,
    type: '反手剑',
    region: '影之地·墓地平原',
    attackType: '斩击',
    status: ['出血'],
    description:
      '反手剑是 DLC 新增的武器类型：双持出手、招式以旋转斩与位移为主。圆刃刀的弧形刀身专为绕后与走位而生。',
    stats: { physical: 88, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 4.5 },
    scaling: { str: 'E', dex: 'C', int: '-', fai: '-', arc: '-' },
    requirements: { str: 8, dex: 17, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '灾厄之舞',
      description: '双手各持一把圆刃刀快速旋身斩杀；再次发动可使出利落的下压踢，兼具位移与收尾。',
    },
    gameplay: [
      '反手剑的普通攻击自带位移，绕后打背刺非常顺手。',
      '双持两把圆刃刀时连段密集，配合出血附魔叠条飞快。',
      '重量仅 4.5，是轻装敏捷流的优质选择。',
    ],
    build: {
      stats: { vigor: 40, mind: 18, endurance: 22, str: 10, dex: 55, int: 9, fai: 9, arc: 15 },
      talismans: ['腐败翼剑徽记', '钩爪护符', '绿龟护符', '红羽剩徽记'],
      weapons: ['咒剑士圆刃刀', '圆刃刀（副手，可选）'],
      sorceries: [],
      incantations: ['血焰武器（可选）'],
    },
    location: '影之地·墓地平原：起始区域附近的建筑上方，击败咒剑士概率掉落。',
  },

  // ==================== 戟 ====================
  {
    id: 'golden-halberd',
    name: '大树守卫的黄金戟',
    dlc: false,
    type: '戟',
    region: '宁姆格福',
    attackType: '斩击与突刺',
    status: [],
    description:
      '大树守卫所持的黄金大戟，象征黄金树信仰的威严。戟刃沉重、攻击距离极长，攻守一体。',
    stats: { physical: 134, magic: 0, fire: 0, lightning: 0, holy: 40, critical: 100, weight: 14.0 },
    scaling: { str: 'D', dex: 'D', int: '-', fai: 'D', arc: '-' },
    requirements: { str: 30, dex: 14, int: 0, fai: 12, arc: 0 },
    skill: {
      name: '黄金誓约',
      description: '高举大戟宣告黄金树的誓约，为自己与周围同伴提升攻击力与防御力。',
    },
    gameplay: [
      '战技「黄金誓约」自带增伤与减伤，是开局就能拿到的顶级辅助手段。',
      '攻击距离长、突刺与横扫兼备，适合中距离压制。',
      '重量偏大，建议搭配盾牌打防御反击流。',
    ],
    build: {
      stats: { vigor: 45, mind: 20, endurance: 30, str: 40, dex: 15, int: 9, fai: 25, arc: 9 },
      talismans: ['亚历山大的碎片', '绿龟护符', '大盾护符', '红羽剩徽记'],
      weapons: ['大树守卫的黄金戟', '黄铜盾'],
      sorceries: [],
      incantations: ['黄金树的恩惠'],
    },
    location: '宁姆格福·引导之始附近：击败骑着战马的「大树守卫」后掉落（开局即可挑战）。',
  },

  // ==================== 枪 ====================
  {
    id: 'short-spear',
    name: '短枪',
    dlc: false,
    type: '枪',
    region: '宁姆格福',
    attackType: '突刺',
    status: [],
    description:
      '长度适中的短枪。突刺出手快、耗精低，可配合盾牌边挡边戳，是最经典的「盾枪流」起手武器。',
    stats: { physical: 84, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 3.5 },
    scaling: { str: 'D', dex: 'C', int: '-', fai: '-', arc: '-' },
    requirements: { str: 10, dex: 12, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '连续突刺',
      description: '向前方连续突刺，段数多且位移小，适合压住敌人节奏或安全消耗。',
    },
    gameplay: [
      '配合中盾可以实现「举盾突刺」，是新手最稳的输出方式之一。',
      '攻击距离优于直剑，靠距离优势打「一戳一退」非常安全。',
      '面板偏低，建议靠属性附魔与战灰补伤害。',
    ],
    build: {
      stats: { vigor: 40, mind: 15, endurance: 25, str: 20, dex: 40, int: 9, fai: 12, arc: 9 },
      talismans: ['亚历山大的碎片', '绿龟护符', '大盾护符', '红羽剩徽记'],
      weapons: ['短枪', '黄铜盾或铁圆盾'],
      sorceries: [],
      incantations: ['焰术武器（可选）'],
    },
    location: '初始职业「预言家」自带；也可在大赐福的孪生老妪处购买。',
  },

  // ==================== 锤 ====================
  {
    id: 'mace',
    name: '战锤',
    dlc: false,
    type: '锤',
    region: '宁姆格福',
    attackType: '打击',
    status: [],
    description:
      '结构简单的钉头锤。打击属性对重甲与石制敌人有额外收益，削韧表现远超同重量武器。',
    stats: { physical: 96, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 4.5 },
    scaling: { str: 'D', dex: '-', int: '-', fai: '-', arc: '-' },
    requirements: { str: 12, dex: 0, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '战吼',
      description: '发出战吼提升自身攻击力，之后的重攻击会变为突进冲击，是力量号常用的开场手段。',
    },
    gameplay: [
      '打击属性对矿洞、骷髅、重甲敌人有奇效，是推图工具人。',
      '削韧极高，两三次重攻击就能打出硬直接处决。',
      '面板一般，但可以通过「重击」战灰与附魔补足。',
    ],
    build: {
      stats: { vigor: 40, mind: 15, endurance: 25, str: 45, dex: 12, int: 9, fai: 12, arc: 9 },
      talismans: ['亚历山大的碎片', '绿龟护符', '红羽剩徽记', '恩惠的肉眼'],
      weapons: ['战锤', '黄铜盾'],
      sorceries: [],
      incantations: ['焰术武器（可选）'],
    },
    location: '宁姆格福·各处的流浪商人处购买。',
  },

  // ==================== 大锤 ====================
  {
    id: 'giant-crusher',
    name: '巨型粉碎者',
    dlc: false,
    type: '大锤',
    region: '亚坛高原',
    attackType: '打击',
    status: [],
    description:
      '用巨石制成的战锤，巨人战争时代的遗物。重量 26.5，是全游戏最沉重的武器之一，一次蓄力重击就能把小型敌人压平。',
    stats: { physical: 155, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 26.5 },
    scaling: { str: 'C', dex: '-', int: '-', fai: '-', arc: '-' },
    requirements: { str: 60, dex: 0, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '忍耐',
      description: '摆出扎根架势，短时间内大幅提升强韧度与减伤率，让蓄力重击不会被打断。',
    },
    gameplay: [
      '纯力量流的顶点：基础物理 155，强化满后面板近 900。',
      '配合「忍耐」可以硬吃一击完成蓄力重击，是莽夫流核心循环。',
      '重量 26.5，必须堆耐力或带负重护符，否则只能慢滚。',
    ],
    build: {
      stats: { vigor: 55, mind: 15, endurance: 45, str: 70, dex: 9, int: 9, fai: 9, arc: 9 },
      talismans: ['亚历山大的碎片', '绿龟护符', '大壶的武具袋', '红羽剩徽记'],
      weapons: ['巨型粉碎者', '无盾或黄金树大盾'],
      sorceries: [],
      incantations: ['黄金树的恩惠（可选）'],
    },
    location: '王城外围·城外幻影树赐福南侧的营地：大车车厢内的宝箱（靠近时会触发腐败树灵，可绕行取箱）。',
  },

  // ==================== 特大武器 ====================
  {
    id: 'bloodfiends-arm',
    name: '血怪手臂',
    dlc: true,
    type: '特大武器',
    region: '影之地·眺望镇',
    attackType: '打击',
    status: ['出血'],
    description:
      'DLC 的沉重打击武器：把血怪的巨大手臂当锤子用。重量 20，打击与出血兼备，属于特大武器类别。',
    stats: { physical: 130, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 20.0 },
    scaling: { str: 'C', dex: 'E', int: '-', fai: '-', arc: 'D' },
    requirements: { str: 28, dex: 11, int: 0, fai: 0, arc: 16 },
    skill: {
      name: '忍耐',
      description: '摆出扎根架势，短时间内提升强韧度与减伤率，配合重攻击可以正面硬刚。',
    },
    gameplay: [
      '打击加出血的组合很罕见，对重甲敌人和血条厚的 BOSS 都吃得开。',
      '冲击力极强，普通攻击就能把中小型敌人打翻。',
      '重量 20，建议搭配负重护符或轻装上身。',
    ],
    build: {
      stats: { vigor: 50, mind: 15, endurance: 35, str: 55, dex: 10, int: 9, fai: 9, arc: 20 },
      talismans: ['腐坏血刃护符', '亚历山大的碎片', '绿龟护符', '大壶的武具袋'],
      weapons: ['血怪手臂', '无盾'],
      sorceries: [],
      incantations: ['血焰武器（可选）'],
    },
    location: '影之地·眺望镇：从塔之镇贝瑞特城外沿隐蔽路线上行进入眺望镇，爬上房顶后跳到对面高台，击败血怪群掉落。',
  },

  // ==================== 斧 ====================
  {
    id: 'battle-axe',
    name: '战斧',
    dlc: false,
    type: '斧',
    region: '宁姆格福',
    attackType: '斩击',
    status: [],
    description:
      '战士惯用的单手斧。攻击力在单手武器中偏高，削韧也不错，代价是攻击距离稍短、连段略慢。',
    stats: { physical: 96, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 5.5 },
    scaling: { str: 'D', dex: 'D', int: '-', fai: '-', arc: '-' },
    requirements: { str: 12, dex: 8, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '战吼',
      description: '发出战吼提升攻击力，之后的重攻击变为突进冲击，可用来开场加 buff 并拉近身位。',
    },
    gameplay: [
      '面板高于同重量直剑，适合力量流前期过渡。',
      '攻击模组以纵斩为主，对付人型敌人压制力强。',
      '可搭配「野蛮咆哮」「狮子斩」等战灰改造手感。',
    ],
    build: {
      stats: { vigor: 42, mind: 15, endurance: 25, str: 45, dex: 15, int: 9, fai: 9, arc: 9 },
      talismans: ['亚历山大的碎片', '绿龟护符', '红羽剩徽记', '大盾护符'],
      weapons: ['战斧', '黄铜盾'],
      sorceries: [],
      incantations: ['焰术武器（可选）'],
    },
    location: '初始职业「勇者」自带；也可由持斧的士兵与山贼类敌人掉落。',
  },

  // ==================== 大斧 ====================
  {
    id: 'greataxe',
    name: '巨斧',
    dlc: false,
    type: '大斧',
    region: '宁姆格福',
    attackType: '斩击',
    status: [],
    description:
      '需要双手才能挥动的巨大战斧。一击伤害极高，蓄力重攻击能把敌人直接劈翻，是纯粹的力量宣泄。',
    stats: { physical: 142, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 13.0 },
    scaling: { str: 'C', dex: 'E', int: '-', fai: '-', arc: '-' },
    requirements: { str: 28, dex: 10, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '野蛮咆哮',
      description: '咆哮提升攻击力与强韧度，之后的重攻击附加冲击波，适合正面压制与破阵。',
    },
    gameplay: [
      '蓄力重攻击伤害与削韧都极高，配合「狮子斩」可对 BOSS 造成大量硬直。',
      '攻击前摇长，需要靠预判与走位来规避反击。',
      '重量 13.0，建议中装或重装搭配增高强韧。',
    ],
    build: {
      stats: { vigor: 50, mind: 15, endurance: 32, str: 55, dex: 10, int: 9, fai: 9, arc: 9 },
      talismans: ['亚历山大的碎片', '绿龟护符', '红羽剩徽记', '恩惠的肉眼'],
      weapons: ['巨斧', '无盾或大盾'],
      sorceries: [],
      incantations: ['黄金树的恩惠（可选）'],
    },
    location: '宁姆格福·风暴关卡一带，由持巨斧的士兵与巨人族敌人掉落。',
  },

  // ==================== 鞭 ====================
  {
    id: 'thorned-whip',
    name: '荆棘鞭',
    dlc: false,
    type: '鞭',
    region: '巨人山顶',
    attackType: '打击与斩击',
    status: ['出血'],
    description:
      '缠满荆棘的长鞭。攻击无法被盾牌格挡，且自带出血，是对付举盾敌人的奇兵。',
    stats: { physical: 82, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 2.5 },
    scaling: { str: 'E', dex: 'D', int: '-', fai: '-', arc: '-' },
    requirements: { str: 8, dex: 14, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '鞭击乱舞',
      description: '快速连续挥鞭，多段命中并叠加出血，攻击范围覆盖身体两侧。',
    },
    gameplay: [
      '鞭类攻击可以穿过盾牌防御，专治举盾的人型敌人与骑士。',
      '自带出血，配合感应加点与出血护符叠条效率不低。',
      '面板偏低且不能背刺，建议作为副手针对特定敌人。',
    ],
    build: {
      stats: { vigor: 40, mind: 15, endurance: 20, str: 10, dex: 45, int: 9, fai: 9, arc: 25 },
      talismans: ['腐坏血刃护符', '钩爪护符', '绿龟护符', '红羽剩徽记'],
      weapons: ['荆棘鞭', '任意主手武器'],
      sorceries: [],
      incantations: ['血焰武器'],
    },
    location: '巨人山顶·巨人山顶地下墓穴门外：击败持鞭的「火焰大主教」概率掉落。',
  },

  // ==================== 拳爪 ====================
  {
    id: 'cestus',
    name: '搏击拳套',
    dlc: false,
    type: '拳套',
    region: '宁姆格福',
    attackType: '打击',
    status: [],
    description:
      '套在拳上的铁制护手。攻击距离极短，但出手快、体力消耗低，是贴脸连击流的基础。',
    stats: { physical: 78, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 1.5 },
    scaling: { str: 'D', dex: 'D', int: '-', fai: '-', arc: '-' },
    requirements: { str: 5, dex: 10, int: 0, fai: 0, arc: 0 },
    skill: {
      name: '连续拳',
      description: '快速连续出拳，段数多、体力消耗低，适合在敌人硬直期间倾泻伤害。',
    },
    gameplay: [
      '重量仅 1.5，几乎不占负重，适合双持成对使用。',
      '打击属性，对骷髅、矿工一类敌人有额外收益。',
      '攻击距离是最大短板，必须贴脸缠斗，注意及时翻滚。',
    ],
    build: {
      stats: { vigor: 42, mind: 15, endurance: 25, str: 35, dex: 40, int: 9, fai: 9, arc: 9 },
      talismans: ['腐败翼剑徽记', '钩爪护符', '绿龟护符', '红羽剩徽记'],
      weapons: ['搏击拳套', '搏击拳套（副手双持）'],
      sorceries: [],
      incantations: ['焰术武器（可选）'],
    },
    location: '宁姆格福·史东薇尔城正门附近：向门卫葛托克购买（推进对话后开启商店）。',
  },

  // ==================== 弓 ====================
  {
    id: 'longbow',
    name: '长弓',
    dlc: false,
    type: '弓',
    region: '大赐福',
    attackType: '突刺',
    status: [],
    description:
      '标准的长弓。射程与伤害均衡，可以把敌人从远处逐个引来单挑，是「引怪流」最实用的工具。',
    stats: { physical: 78, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 3.5 },
    scaling: { str: 'E', dex: 'D', int: '-', fai: '-', arc: '-' },
    requirements: { str: 9, dex: 15, int: 0, fai: 0, arc: 0 },
    skill: null,
    gameplay: [
      '配合「箭矢」类道具可以在安全距离处理掉落点与精英怪。',
      '推荐搭配「火箭」「毒箭」等属性箭处理特定敌人，配合弓护符还能进一步提升伤害。',
      '近战角色也可以随身携带，用于触发机关或引怪。',
    ],
    build: {
      stats: { vigor: 40, mind: 15, endurance: 20, str: 20, dex: 40, int: 9, fai: 9, arc: 9 },
      talismans: ['鹰眼护符', '绿龟护符', '亚历山大的碎片', '红羽剩徽记'],
      weapons: ['长弓', '任意近战主武器'],
      sorceries: [],
      incantations: [],
    },
    location: '大赐福·孪生老妪处购买。',
  },

  // ==================== 触媒 ====================
  {
    id: 'meteorite-staff',
    name: '陨石杖',
    dlc: false,
    type: '法杖',
    region: '盖利德',
    attackType: '打击',
    status: [],
    description:
      '以陨石锻造的辉石杖。无需强化即可发挥极高魔法威力，是法师前期最强的过渡触媒。',
    stats: { physical: 44, magic: 0, fire: 0, lightning: 0, holy: 0, critical: 100, weight: 4.0 },
    scaling: { str: 'E', dex: '-', int: 'S', fai: '-', arc: '-' },
    requirements: { str: 8, dex: 0, int: 18, fai: 0, arc: 0 },
    skill: null,
    gameplay: [
      '无强化状态即有 S 级智力补正，前期魔法伤害远超强化过的普通辉石杖。',
      '无法强化，中后期需换成学院辉石杖、卢恩杖等可强化触媒。',
      '搭配「重力魔法」系列可额外获得伤害加成，过渡期性价比极高。',
    ],
    build: {
      stats: { vigor: 35, mind: 35, endurance: 15, str: 8, dex: 12, int: 60, fai: 9, arc: 9 },
      talismans: ['魔法师球', '蓝秘文戒指', '拉达冈的肖像', '绿龟护符'],
      weapons: ['陨石杖', '名刀月隐或短剑（近身应急）'],
      sorceries: ['岩石球', '彗星亚兹勒', '迅魔砾'],
      incantations: [],
    },
    location: '盖利德·贤者街废墟：废墟内的尸体上拾取（位于沼泽南侧，需骑马穿过毒沼）。',
  },
]

// 全游戏 40 类武器（本体 32 类 + DLC 新增 8 类，顺序即图鉴分类顺序）
// 说明：官方 40 类中的「工具」并非攻击性装备，此处替换为「盾」类，便于收录小盾 / 中盾 / 大盾
export const weaponTypes = [
  '匕首',
  '投掷刃',
  '刺剑',
  '重型刺剑',
  '直剑',
  '轻大剑',
  '大剑',
  '特大剑',
  '曲剑',
  '大曲剑',
  '反手剑',
  '刀',
  '大刀',
  '双头剑',
  '斧',
  '大斧',
  '锤',
  '连枷',
  '大锤',
  '特大武器',
  '枪',
  '大枪',
  '戟',
  '镰刀',
  '鞭',
  '拳套',
  '徒手武艺',
  '爪',
  '兽爪',
  '香水瓶',
  '轻弓',
  '弓',
  '大弓',
  '弩',
  '弩炮',
  '法杖',
  '圣印记',
  '火把',
  '刺盾',
  '盾',
]

const TYPE_ORDER = new Map(weaponTypes.map((name, index) => [name, index]))

// 类型分组：40 类平铺太长，列表页按「近战 / 远程与触媒 / 防御与杂项」分三行展示
const RANGED_TYPES = ['轻弓', '弓', '大弓', '弩', '弩炮', '法杖', '圣印记']
const DEFENSE_TYPES = ['火把', '刺盾', '盾']

export const weaponTypeGroups = [
  { label: '近战', types: weaponTypes.filter((t) => !RANGED_TYPES.includes(t) && !DEFENSE_TYPES.includes(t)) },
  { label: '远程', types: RANGED_TYPES },
  { label: '防御', types: DEFENSE_TYPES },
]

// 合并补充数据，按「类型顺序 + 名称」排列，保证图鉴分类连续
const allWeapons = [...weapons, ...weaponsExtra].sort((a, b) => {
  const diff = (TYPE_ORDER.get(a.type) ?? 999) - (TYPE_ORDER.get(b.type) ?? 999)
  if (diff !== 0) return diff
  return a.name.localeCompare(b.name, 'zh-Hans-CN')
})

export default allWeapons
