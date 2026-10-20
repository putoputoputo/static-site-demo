// 把「紧凑行」武器数据转成图鉴使用的完整对象，并与手写详细条目合并
// 合并规则：同名时保留手写条目（内容更完整），补充条目只填补空缺

import rosterA from './weaponsRosterA.js'
import rosterB from './weaponsRosterB.js'
import rosterC from './weaponsRosterC.js'
import rosterD from './weaponsRosterD.js'
import rosterE from './weaponsRosterE.js'
import rosterF from './weaponsRosterF.js'
import rosterG from './weaponsRosterG.js'

const ROWS = [...rosterA, ...rosterB, ...rosterC, ...rosterD, ...rosterE, ...rosterF, ...rosterG]

const ATTRS = ['str', 'dex', 'int', 'fai', 'arc']

// 各类型的通用配装模板：属性点按武器主加点方向给一套「能打」的基准
const BUILD_BY_TYPE = {
  匕首: { vigor: 40, mind: 15, endurance: 20, str: 12, dex: 40, int: 9, fai: 9, arc: 9, talismans: ['红羽剩徽记', '钩爪护符', '绿龟护符'] },
  投掷刃: { vigor: 40, mind: 15, endurance: 22, str: 12, dex: 40, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '斧护符'] },
  刺剑: { vigor: 40, mind: 18, endurance: 22, str: 10, dex: 40, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽剩徽记'] },
  重型刺剑: { vigor: 45, mind: 15, endurance: 25, str: 12, dex: 45, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '长矛护符', '绿龟护符'] },
  直剑: { vigor: 45, mind: 18, endurance: 25, str: 20, dex: 30, int: 9, fai: 9, arc: 9, talismans: ['红琥珀链坠', '绿龟护符', '亚历山大的碎片'] },
  轻大剑: { vigor: 45, mind: 16, endurance: 26, str: 20, dex: 32, int: 9, fai: 9, arc: 9, talismans: ['红琥珀链坠', '绿龟护符', '亚历山大的碎片'] },
  大剑: { vigor: 50, mind: 16, endurance: 30, str: 30, dex: 24, int: 9, fai: 9, arc: 9, talismans: ['亚历山大的碎片', '绿龟护符', '大壶的武具袋'] },
  特大剑: { vigor: 55, mind: 15, endurance: 34, str: 40, dex: 20, int: 9, fai: 9, arc: 9, talismans: ['亚历山大的碎片', '大壶的武具袋', '绿龟护符'] },
  曲剑: { vigor: 42, mind: 15, endurance: 24, str: 14, dex: 38, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽剩徽记'] },
  大曲剑: { vigor: 48, mind: 15, endurance: 30, str: 26, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['亚历山大的碎片', '绿龟护符', '钩爪护符'] },
  反手剑: { vigor: 42, mind: 15, endurance: 24, str: 14, dex: 38, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽剩徽记'] },
  刀: { vigor: 45, mind: 15, endurance: 26, str: 18, dex: 38, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽剩徽记'] },
  大刀: { vigor: 50, mind: 15, endurance: 32, str: 28, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['亚历山大的碎片', '绿龟护符', '斧护符'] },
  双头剑: { vigor: 45, mind: 16, endurance: 26, str: 20, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['亚历山大的碎片', '绿龟护符', '钩爪护符'] },
  斧: { vigor: 48, mind: 15, endurance: 28, str: 30, dex: 20, int: 9, fai: 9, arc: 9, talismans: ['斧护符', '绿龟护符', '大壶的武具袋'] },
  大斧: { vigor: 55, mind: 15, endurance: 34, str: 40, dex: 18, int: 9, fai: 9, arc: 9, talismans: ['斧护符', '大壶的武具袋', '绿龟护符'] },
  锤: { vigor: 48, mind: 15, endurance: 28, str: 32, dex: 18, int: 9, fai: 9, arc: 9, talismans: ['斧护符', '绿龟护符', '大壶的武具袋'] },
  连枷: { vigor: 48, mind: 15, endurance: 28, str: 30, dex: 20, int: 9, fai: 9, arc: 9, talismans: ['斧护符', '绿龟护符', '大壶的武具袋'] },
  大锤: { vigor: 55, mind: 15, endurance: 34, str: 40, dex: 16, int: 9, fai: 9, arc: 9, talismans: ['斧护符', '大壶的武具袋', '绿龟护符'] },
  特大武器: { vigor: 60, mind: 15, endurance: 40, str: 50, dex: 16, int: 9, fai: 9, arc: 9, talismans: ['斧护符', '大壶的武具袋', '亚历山大的碎片'] },
  枪: { vigor: 45, mind: 15, endurance: 26, str: 20, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['长矛护符', '绿龟护符', '大壶的武具袋'] },
  大枪: { vigor: 50, mind: 15, endurance: 32, str: 30, dex: 30, int: 9, fai: 9, arc: 9, talismans: ['长矛护符', '大壶的武具袋', '绿龟护符'] },
  戟: { vigor: 50, mind: 15, endurance: 30, str: 32, dex: 26, int: 9, fai: 9, arc: 9, talismans: ['长矛护符', '绿龟护符', '大壶的武具袋'] },
  镰刀: { vigor: 48, mind: 15, endurance: 28, str: 24, dex: 30, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '亚历山大的碎片'] },
  鞭: { vigor: 45, mind: 15, endurance: 24, str: 18, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽剩徽记'] },
  拳套: { vigor: 42, mind: 15, endurance: 22, str: 18, dex: 36, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽剩徽记'] },
  徒手武艺: { vigor: 42, mind: 15, endurance: 24, str: 20, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽剩徽记'] },
  爪: { vigor: 42, mind: 15, endurance: 22, str: 16, dex: 38, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '红羽剩徽记'] },
  兽爪: { vigor: 45, mind: 15, endurance: 26, str: 24, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['钩爪护符', '绿龟护符', '亚历山大的碎片'] },
  香水瓶: { vigor: 45, mind: 20, endurance: 26, str: 14, dex: 22, int: 9, fai: 9, arc: 30, talismans: ['调香师的护符', '绿龟护符', '红琥珀链坠'] },
  轻弓: { vigor: 40, mind: 15, endurance: 20, str: 10, dex: 34, int: 9, fai: 9, arc: 9, talismans: ['弓箭手护符', '绿龟护符', '红琥珀链坠'] },
  弓: { vigor: 42, mind: 15, endurance: 22, str: 14, dex: 36, int: 9, fai: 9, arc: 9, talismans: ['弓箭手护符', '绿龟护符', '红琥珀链坠'] },
  大弓: { vigor: 48, mind: 15, endurance: 28, str: 30, dex: 30, int: 9, fai: 9, arc: 9, talismans: ['弓箭手护符', '大壶的武具袋', '绿龟护符'] },
  弩: { vigor: 42, mind: 15, endurance: 22, str: 14, dex: 24, int: 9, fai: 9, arc: 9, talismans: ['弓箭手护符', '绿龟护符', '红琥珀链坠'] },
  弩炮: { vigor: 48, mind: 15, endurance: 30, str: 24, dex: 20, int: 9, fai: 9, arc: 9, talismans: ['弓箭手护符', '大壶的武具袋', '绿龟护符'] },
  法杖: { vigor: 40, mind: 40, endurance: 20, str: 10, dex: 12, int: 60, fai: 9, arc: 9, talismans: ['魔法师块护符', '绿色龟壳护符', '红琥珀链坠'] },
  圣印记: { vigor: 45, mind: 35, endurance: 22, str: 12, dex: 12, int: 9, fai: 55, arc: 9, talismans: ['信仰护符', '绿龟护符', '红琥珀链坠'] },
  火把: { vigor: 40, mind: 15, endurance: 22, str: 14, dex: 18, int: 9, fai: 9, arc: 9, talismans: ['红琥珀链坠', '绿龟护符', '大壶的武具袋'] },
  刺盾: { vigor: 50, mind: 15, endurance: 32, str: 30, dex: 22, int: 9, fai: 9, arc: 9, talismans: ['大盾护符', '绿龟护符', '大壶的武具袋'] },
  小盾: { vigor: 40, mind: 15, endurance: 22, str: 14, dex: 16, int: 9, fai: 9, arc: 9, talismans: ['大盾护符', '绿龟护符', '红琥珀链坠'] },
  中盾: { vigor: 45, mind: 15, endurance: 26, str: 22, dex: 14, int: 9, fai: 9, arc: 9, talismans: ['大盾护符', '绿龟护符', '大壶的武具袋'] },
  大盾: { vigor: 50, mind: 15, endurance: 40, str: 40, dex: 12, int: 9, fai: 9, arc: 9, talismans: ['大盾护符', '大壶的武具袋', '绿龟护符'] },
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
  if (Number(weight) >= 12) list.push(`重量 ${weight}，必须堆耐力，或搭配大壶的武具袋之类的负重护符。`)
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

export const rosterWeapons = ROWS.map(toWeapon)

export default rosterWeapons
