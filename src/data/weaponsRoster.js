// 把「紧凑行」武器数据转成图鉴使用的完整对象，并与手写详细条目合并
// 合并规则：同名时保留手写条目（内容更完整），补充条目只填补空缺

import rosterA from './weaponsRosterA.js'
import rosterB from './weaponsRosterB.js'
import rosterC from './weaponsRosterC.js'
import rosterD from './weaponsRosterD.js'
import rosterE from './weaponsRosterE.js'
import rosterF from './weaponsRosterF.js'
import rosterG from './weaponsRosterG.js'
import rosterH from './weaponsRosterH.js'

const ROWS = [...rosterA, ...rosterB, ...rosterC, ...rosterD, ...rosterE, ...rosterF, ...rosterG, ...rosterH]

// 官方译名修正：早期版本按英文直译，与 wiki / 百科 / 攻略站的统一写法不一致
// 依据：bwiki 武器一览、百度百科「黄金树幽影」词条、游民星空 DLC 全武器一览
const RENAME = {
  角战士之剑: '角战士曲剑',
  角战士大剑: '角战士大曲剑',
  镰形剑: '镰型刀',
  流纹手斧: '流纹斧',
  棘刺杖矛: '倒刺杖矛',
}

// 早期把一批本体武器误标成了 DLC，连地区和获取位置也写成了幽影之地。
// 这里按「游民星空·全武器获取方法一览表」「全盾牌获取方式一览表」逐条改回本体。
const BASE_FIX = {
  颚齿斧: {
    region: '希芙拉河',
    location: '希芙拉河·祖灵森林，背箭袋的祖灵之民掉落',
    note: '本体武器，刃口带齿、附带出血，前期就能刷。',
  },
  高地斧: {
    region: '宁姆格福',
    location: '宁姆格福·史东薇尔城，城墙塔下方房间的大幅画像下',
    note: '本体武器，自带战吼类战技，力量流前期过渡不错。',
  },
  玛莉卡的石槌: {
    region: '圆桌厅堂',
    location: '圆桌厅堂·恩雅，用「艾尔登之兽的追忆」兑换',
    note: '本体武器，玛莉卡的石槌，圣属性打击武器。',
  },
  兽牙棒: {
    region: '巨人山顶',
    location: '巨人山顶·古遗迹降雪谷东北方，魔像左转后的大只亚人掉落',
    note: '本体武器，打击属性，力量需求不高。',
  },
  大角槌: {
    region: '希芙拉河',
    location: '希芙拉河·祖灵森林，头上牛角发光的祖灵之民掉落',
    note: '本体武器，祖灵系列的大槌，重量偏沉。',
  },
  斗技锤: {
    region: '王城罗德尔',
    location: '王城罗德尔·王城西边城墙往斗技场方向，持槌决斗者掉落（烧树前）',
    note: '本体武器，烧树后就刷不到了，要趁早。',
  },
  腐败斗技锤: {
    region: '巨人山顶',
    location: '巨人山顶·化圣雪原十点钟方向石棺群，腐败斗士掉落',
    note: '本体武器，带猩红腐败的斗技锤。',
  },
  砌石槌: {
    region: '宁姆格福',
    location: '宁姆格福·史东薇尔城，被关小黑屋附近的尸体上',
    note: '本体武器，早期就能拿的大槌。',
  },
  兽爪大锤: {
    region: '盖利德',
    location: '盖利德·野兽神殿，向古兰格交付第 7 根死根获得',
    note: '本体武器，死根支线奖励，重击带旋风效果。',
  },
  大龙爪: {
    region: '亚坛高原',
    location: '亚坛高原·王城城墙前方，击败龙装大树守卫掉落',
    note: '本体武器，特大武器里少见的力量向爪型武器。',
  },
  魔像戟: {
    region: '亚坛高原',
    location: '亚坛高原·各地持戟魔像掉落',
    note: '本体武器，魔像随处可刷，面板中规中矩。',
  },
  拷问烛台: {
    region: '格密尔火山',
    location: '火山官邸·地下拷问所，击败双铁处女 BOSS 获得',
    note: '本体武器，火焰伤害的矛类武器。',
  },
  烛台棒: {
    region: '宁姆格福',
    location: '宁姆格福·史东薇尔城，小接肢附近持烛台的流刑士兵掉落',
    note: '本体武器，火属性矛，刷流刑士兵就能出。',
  },
  残缺波纹戟: {
    region: '利耶尼亚',
    location: '利耶尼亚·学院门前镇，持半月形戟的白金之子掉落',
    note: '本体武器，波纹系列的戟，面板偏低但轻。',
  },
  恶兵钩剑: {
    region: '盖利德',
    location: '盖利德·野兽神殿一带的恶兵掉落',
    note: '本体武器，恶兵是野兽神殿周边的常驻敌人。',
  },
  恶兵锯齿刀: {
    region: '盖利德',
    location: '盖利德·野兽神殿一带的恶兵掉落',
    note: '本体武器，锯齿刀带出血，刷恶兵可同时出两把。',
  },
  昆虫剑刃戟: {
    region: '盖利德',
    location: '盖利德·瑟利亚结晶坑道，或安瑟尔河·腐败湖大回廊的腐败眷属掉落',
    note: '本体武器，腐败眷属掉落，带猩红腐败。',
  },
  守卫剑枪: {
    region: '盖利德',
    location: '盖利德·龙墓岔路往小黄金树的斜坡，土里的黄金守卫掉落',
    note: '本体武器，戟类里动作偏刺击的一把。',
  },
  软鞭剑: {
    region: '利耶尼亚',
    location: '利耶尼亚·卡利亚城寨上部，坐电梯出城墙后跳向左侧城墙',
    note: '本体武器，鞭类里少见的带刃版本。',
  },
  棘刺搏击手套: {
    region: '盖利德',
    location: '盖利德·隐居商人的破屋，商人出售',
    note: '本体武器，带出血的拳套，商人直接买。',
  },
  攀附手骨: {
    region: '利耶尼亚',
    location: '利耶尼亚·白金村拿圣树秘密符节后，回圆桌厅堂击败入侵的「王骸」夏恩',
    note: '本体武器，拳套里伤害偏高的一把，靠支线入侵获得。',
  },
  铁球拳套: {
    region: '王城罗德尔',
    location: '食粪者支线放出他后，在王城罗德尔外与虾哥对话并刷新，从虾哥尸体上拾取',
    note: '本体武器，打击属性拳套，支线限定。',
  },
  钢丝火把: {
    region: '啜泣半岛',
    location: '啜泣半岛·摩恩城，从拜火祭坛跳上旁边平台，出另一个口爬梯子左转尽头',
    note: '本体武器，火把里攻击距离较长的一把。',
  },
  灵火火把: {
    region: '宁姆格福',
    location: '击败碎星后，从宁姆格福陨石坑下到永恒之城诺克隆恩，沿城墙跳右侧塔楼平台拾取',
    note: '本体武器，带魔法伤害与冻伤积累，打灵体类敌人好用。',
  },
  裂缝盾: {
    region: '利耶尼亚',
    location: '利耶尼亚·彼鲁姆教堂北方的流浪商人出售（1800 卢恩）',
    note: '本体武器，最轻的小盾之一，纯过渡。',
  },
  熏烧盾: {
    region: '格密尔火山',
    location: '火山官邸·牢镇教堂出发，经屋顶下落至岩浆附近墓地，大壶守着的尸体上',
    note: '本体武器，火属性减伤不错的小盾。',
  },
}

// 不在任何官方清单里的条目：DLC 共 10 面盾（流纹/黑夜/梅瑟莫士兵/狼徽章/蛇徽章/黄金狮子/黑铁/铜绿/决斗/卡利亚突刺），
// 本体 82 面盾也没有「山铜盾」，故移除。
const DROP = new Set(['山铜盾'])

const ATTRS = ['str', 'dex', 'int', 'fai', 'arc']

// 各类型的通用配装模板：属性点按武器主加点方向给一套「能打」的基准
const BUILD_BY_TYPE = {
  匕首: { vigor: 40, mind: 15, endurance: 20, str: 12, dex: 40, int: 9, fai: 9, arc: 9, talismans: ['红羽七刃剑', '钩爪护符', '绿龟护符'] },
  投掷刃: { vigor: 40, mind: 15, endurance: 22, str: 12, dex: 40, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '斧护符'] },
  刺剑: { vigor: 40, mind: 18, endurance: 22, str: 10, dex: 40, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽七刃剑'] },
  重型刺剑: { vigor: 45, mind: 15, endurance: 25, str: 12, dex: 45, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '矛护符', '绿龟护符'] },
  直剑: { vigor: 45, mind: 18, endurance: 25, str: 20, dex: 30, int: 9, fai: 9, arc: 9, talismans: ['红琥珀链坠', '绿龟护符', '亚历山大的碎片'] },
  轻大剑: { vigor: 45, mind: 16, endurance: 26, str: 20, dex: 32, int: 9, fai: 9, arc: 9, talismans: ['红琥珀链坠', '绿龟护符', '亚历山大的碎片'] },
  大剑: { vigor: 50, mind: 16, endurance: 30, str: 30, dex: 24, int: 9, fai: 9, arc: 9, talismans: ['亚历山大的碎片', '绿龟护符', '大壶众武护符'] },
  特大剑: { vigor: 55, mind: 15, endurance: 34, str: 40, dex: 20, int: 9, fai: 9, arc: 9, talismans: ['亚历山大的碎片', '大壶众武护符', '绿龟护符'] },
  曲剑: { vigor: 42, mind: 15, endurance: 24, str: 14, dex: 38, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽七刃剑'] },
  大曲剑: { vigor: 48, mind: 15, endurance: 30, str: 26, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['亚历山大的碎片', '绿龟护符', '钩爪护符'] },
  反手剑: { vigor: 42, mind: 15, endurance: 24, str: 14, dex: 38, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽七刃剑'] },
  刀: { vigor: 45, mind: 15, endurance: 26, str: 18, dex: 38, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽七刃剑'] },
  大刀: { vigor: 50, mind: 15, endurance: 32, str: 28, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['亚历山大的碎片', '绿龟护符', '斧护符'] },
  双头剑: { vigor: 45, mind: 16, endurance: 26, str: 20, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['亚历山大的碎片', '绿龟护符', '钩爪护符'] },
  斧: { vigor: 48, mind: 15, endurance: 28, str: 30, dex: 20, int: 9, fai: 9, arc: 9, talismans: ['斧护符', '绿龟护符', '大壶众武护符'] },
  大斧: { vigor: 55, mind: 15, endurance: 34, str: 40, dex: 18, int: 9, fai: 9, arc: 9, talismans: ['斧护符', '大壶众武护符', '绿龟护符'] },
  锤: { vigor: 48, mind: 15, endurance: 28, str: 32, dex: 18, int: 9, fai: 9, arc: 9, talismans: ['斧护符', '绿龟护符', '大壶众武护符'] },
  连枷: { vigor: 48, mind: 15, endurance: 28, str: 30, dex: 20, int: 9, fai: 9, arc: 9, talismans: ['斧护符', '绿龟护符', '大壶众武护符'] },
  大锤: { vigor: 55, mind: 15, endurance: 34, str: 40, dex: 16, int: 9, fai: 9, arc: 9, talismans: ['斧护符', '大壶众武护符', '绿龟护符'] },
  特大武器: { vigor: 60, mind: 15, endurance: 40, str: 50, dex: 16, int: 9, fai: 9, arc: 9, talismans: ['斧护符', '大壶众武护符', '亚历山大的碎片'] },
  枪: { vigor: 45, mind: 15, endurance: 26, str: 20, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['矛护符', '绿龟护符', '大壶众武护符'] },
  大枪: { vigor: 50, mind: 15, endurance: 32, str: 30, dex: 30, int: 9, fai: 9, arc: 9, talismans: ['矛护符', '大壶众武护符', '绿龟护符'] },
  戟: { vigor: 50, mind: 15, endurance: 30, str: 32, dex: 26, int: 9, fai: 9, arc: 9, talismans: ['矛护符', '绿龟护符', '大壶众武护符'] },
  镰刀: { vigor: 48, mind: 15, endurance: 28, str: 24, dex: 30, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '亚历山大的碎片'] },
  鞭: { vigor: 45, mind: 15, endurance: 24, str: 18, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽七刃剑'] },
  拳套: { vigor: 42, mind: 15, endurance: 22, str: 18, dex: 36, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽七刃剑'] },
  徒手武艺: { vigor: 42, mind: 15, endurance: 24, str: 20, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽七刃剑'] },
  爪: { vigor: 42, mind: 15, endurance: 22, str: 16, dex: 38, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽七刃剑'] },
  兽爪: { vigor: 45, mind: 15, endurance: 26, str: 24, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '亚历山大的碎片'] },
  香水瓶: { vigor: 45, mind: 20, endurance: 26, str: 14, dex: 22, int: 9, fai: 9, arc: 30, talismans: ['调香师的护符', '绿龟护符', '红琥珀链坠'] },
  轻弓: { vigor: 40, mind: 15, endurance: 20, str: 10, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['远箭护符', '绿龟护符', '红琥珀链坠'] },
  弓: { vigor: 42, mind: 15, endurance: 22, str: 14, dex: 36, int: 9, fai: 9, arc: 9, talismans: ['远箭护符', '绿龟护符', '红琥珀链坠'] },
  大弓: { vigor: 48, mind: 15, endurance: 28, str: 30, dex: 30, int: 9, fai: 9, arc: 9, talismans: ['远箭护符', '大壶众武护符', '绿龟护符'] },
  弩: { vigor: 42, mind: 15, endurance: 22, str: 14, dex: 24, int: 9, fai: 9, arc: 9, talismans: ['远箭护符', '绿龟护符', '红琥珀链坠'] },
  弩炮: { vigor: 48, mind: 15, endurance: 30, str: 24, dex: 20, int: 9, fai: 9, arc: 9, talismans: ['远箭护符', '大壶众武护符', '绿龟护符'] },
  法杖: { vigor: 40, mind: 40, endurance: 20, str: 10, dex: 12, int: 60, fai: 9, arc: 9, talismans: ['魔法师块护符', '绿龟护符', '红琥珀链坠'] },
  圣印记: { vigor: 45, mind: 35, endurance: 22, str: 12, dex: 12, int: 9, fai: 55, arc: 9, talismans: ['信徒的立誓布', '绿龟护符', '红琥珀链坠'] },
  火把: { vigor: 40, mind: 15, endurance: 22, str: 14, dex: 18, int: 9, fai: 9, arc: 9, talismans: ['红琥珀链坠', '绿龟护符', '大壶众武护符'] },
  刺盾: { vigor: 50, mind: 15, endurance: 32, str: 30, dex: 22, int: 9, fai: 9, arc: 9, talismans: ['大盾护符', '绿龟护符', '大壶众武护符'] },
  小盾: { vigor: 40, mind: 15, endurance: 22, str: 14, dex: 16, int: 9, fai: 9, arc: 9, talismans: ['大盾护符', '绿龟护符', '红琥珀链坠'] },
  中盾: { vigor: 45, mind: 15, endurance: 26, str: 22, dex: 14, int: 9, fai: 9, arc: 9, talismans: ['大盾护符', '绿龟护符', '大壶众武护符'] },
  大盾: { vigor: 50, mind: 15, endurance: 40, str: 40, dex: 12, int: 9, fai: 9, arc: 9, talismans: ['大盾护符', '大壶众武护符', '绿龟护符'] },
}

const DEFAULT_SKILL_DESC = '该战技的完整动作、削韧与耗蓝以游戏内为准；装配战技后会被替换。'

function splitNum(text, length) {
  const parts = String(text).split('/')
  const out = []
  for (let i = 0; i < length; i++) out.push(Number(parts[i] || 0))
  return out
}

function splitLetters(text) {
  return String(text).split('/')
}

function buildGameplay(row, scaling) {
  const [name, type, , , weight, , , skillName, status, , comment] = row
  const list = [comment]
  // 补正方向
  const labels = { str: '力量', dex: '灵巧', int: '智力', fai: '信仰', arc: '感应' }
  const best = Object.entries(scaling)
    .filter(([, v]) => v !== '-')
    .sort((a, b) => 'SABCDE'.indexOf(a[1]) - 'SABCDE'.indexOf(b[1]))
    .slice(0, 2)
    .map(([k, v]) => `${labels[k]} ${v}`)
  if (best.length) list.push(`主要补正 ${best.join(' / ')}，加点优先堆这两项。`)
  if (status) list.push(`自带「${status}」，双持或高攻速下叠加速度会明显提升。`)
  if (Number(weight) >= 12) list.push(`重量 ${weight}，必须堆耐力，或搭配大壶众武护符之类的负重护符。`)
  if (skillName && skillName !== '格挡') list.push(`战技「${skillName}」，${type === '法杖' || type === '圣印记' ? '装配后可以放对应体系的法术。' : '在狭窄地形容易被墙壁挡住，开阔地再用。'}`)
  if (row[11] === 'DLC') list.push('DLC 武器，需要在幽影之地拿到；本体流程里拿不到。')
  return list.slice(0, 4)
}

function toWeapon(row) {
  const [name, type, region, dmg, weight, req, scalingText, skillName, status, location, comment, dlcFlag] = row
  const [physical, magic, fire, lightning, holy] = splitNum(dmg, 5)
  const [str, dex, int, fai, arc] = req
  const letters = splitLetters(scalingText)
  const scaling = { str: letters[0], dex: letters[1], int: letters[2], fai: letters[3], arc: letters[4] }
  const template = BUILD_BY_TYPE[type] || BUILD_BY_TYPE['直剑']
  const { talismans, ...stats } = template

  return {
    id: name,
    name,
    dlc: dlcFlag === 'DLC',
    type,
    region,
    status: status ? String(status).split('、') : [],
    description: comment,
    stats: { physical, magic, fire, lightning, holy, critical: 100, weight },
    scaling,
    requirements: { str, dex, int, fai, arc },
    skill: { name: skillName || '无战技', description: DEFAULT_SKILL_DESC },
    gameplay: buildGameplay(row, scaling),
    build: {
      stats,
      talismans,
      weapons: [`${name}（主手）`, type === '小盾' || type === '中盾' || type === '大盾' ? '主手武器' : '副手盾牌或第二把同系武器'],
      sorceries: [],
      incantations: [],
    },
    location,
  }
}

// 先把译名、地区与 DLC 标记修正到 row 上，再转成对象
function applyFix(row) {
  const next = [...row]
  const name = row[0]
  if (RENAME[name]) next[0] = RENAME[name]
  const fix = BASE_FIX[name]
  if (fix) {
    next[2] = fix.region
    next[9] = fix.location
    next[10] = fix.note
    next[11] = undefined
  }
  return next
}

export const rosterWeapons = ROWS.filter((row) => !DROP.has(row[0])).map(applyFix).map(toWeapon)

export default rosterWeapons
