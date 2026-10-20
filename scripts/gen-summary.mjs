// 构建期生成 src/data/summary.js
// 目的：首页只需要几个统计数字，不应该因此把整份武器 / 支线 / 主线数据（约 200KB）打进首屏。
// 该脚本在 npm run dev / npm run build 之前自动执行（见 package.json 的 predev / prebuild）。
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import weapons from '../src/data/weapons.js'
import { questStats } from '../src/data/quests.js'
import { mainStats } from '../src/data/mainline.js'

const weaponTypeCount = new Set(weapons.map((item) => item.type)).size
const dlcCount = weapons.filter((item) => item.dlc).length

const out = `// 本文件由 scripts/gen-summary.mjs 自动生成，请勿手动修改。
// 首页只从这里读取统计数字，避免把整份武器 / 支线 / 主线数据打进首屏。
export const weaponCount = ${weapons.length}
export const weaponTypeCount = ${weaponTypeCount}
export const weaponDlcCount = ${dlcCount}
export const questStats = ${JSON.stringify(questStats, null, 2)}
export const mainStats = ${JSON.stringify(mainStats, null, 2)}
`

const target = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/summary.js')
writeFileSync(target, out, 'utf-8')
console.log(
  `[gen-summary] 武器 ${weapons.length} 件 / ${weaponTypeCount} 类（DLC ${dlcCount}），支线 ${questStats.total} 条 / 已整理 ${questStats.ready} 条，主线 ${mainStats.total} 章（本体 ${mainStats.base} + DLC ${mainStats.dlc}）/ ${mainStats.steps} 步`
)
