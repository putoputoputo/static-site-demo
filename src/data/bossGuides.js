// BOSS 攻略数据 · 合并入口
//
// 三层来源合成一条记录：
//   regions.js        → 所在区域、地点、是否必打、是否追忆、关联支线
//   bossGuidesA/B/C   → 推荐等级、危险度、阶段、弱点抗性、打法要点、掉落、召唤
//   remembrances.js   → 追忆能换什么
//
// 攻略数据按「区域 → BOSS 名」两层组织（见 bossGuidesA.js 顶部说明），
// 这里把它压平成 `${regionId}::${name}` 的单层表，供按地址反查。
//
// 家族（bossGuidesFamilies.js）提供同一类 BOSS 的共用弱点与打法，
// 逐个 BOSS 只写差异：显式字段覆盖家族字段，extraTips 追加在家族要点之后。

import guidesA from './bossGuidesA.js'
import guidesB from './bossGuidesB.js'
import guidesC from './bossGuidesC.js'
import { bossFamilies } from './bossGuidesFamilies.js'

const rawGuides = { ...guidesA, ...guidesB, ...guidesC }

export const bossGuides = {}

Object.entries(rawGuides).forEach(([regionId, bosses]) => {
  Object.entries(bosses).forEach(([name, guide]) => {
    const family = guide.family ? bossFamilies[guide.family] : null
    if (guide.family && !family) {
      throw new Error(`[bossGuides] ${regionId}/${name} 引用了不存在的家族 "${guide.family}"`)
    }

    const baseTips = guide.tips ?? family?.tips ?? []

    bossGuides[`${regionId}::${name}`] = {
      key: `${regionId}::${name}`,
      regionId,
      name,
      family: guide.family || '',
      type: guide.type || family?.type || '未分类',
      level: guide.level || '—',
      blessing: guide.blessing || '',
      upgrade: guide.upgrade || '',
      danger: guide.danger ?? 3,
      phases: guide.phases ?? 1,
      weak: guide.weak ?? family?.weak ?? [],
      resist: guide.resist ?? family?.resist ?? [],
      immune: guide.immune ?? family?.immune ?? [],
      tips: [...baseTips, ...(guide.extraTips || [])],
      summon: guide.summon || [],
      drop: guide.drop || [],
    }
  })
})

export default bossGuides
