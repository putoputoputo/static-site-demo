// 按 id 精确替换 src/data/quests.js 中的支线条目
// 用法: node scripts/replace-quest.mjs <staging文件>
// staging 文件里每条用一个独占一行的 @@SPLIT@@ 分隔
import fs from 'node:fs'

const stagingPath = process.argv[2]
if (!stagingPath) {
  console.error('缺少 staging 文件路径')
  process.exit(1)
}

const target = new URL('../src/data/quests.js', import.meta.url)
let src = fs.readFileSync(target, 'utf8')

const chunks = fs.readFileSync(stagingPath, 'utf8').split(/^@@SPLIT@@\s*$/m)
let count = 0

for (const chunk of chunks) {
  const block = chunk.trim()
  if (!block) continue

  const idMatch = block.match(/id: '([^']+)'/)
  if (!idMatch) throw new Error('staging 块缺少 id')
  const id = idMatch[1]

  const startMark = `  {\n    id: '${id}',`
  const start = src.indexOf(startMark)
  if (start < 0) throw new Error(`未找到条目: ${id}`)

  // 从对象起始的 { 开始做花括号配对，精确定位对象结尾
  let depth = 0
  let end = -1
  for (let i = start + 2; i < src.length; i++) {
    const ch = src[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        end = i + 1
        break
      }
    }
  }
  if (end < 0) throw new Error(`花括号不匹配: ${id}`)

  let after = end
  if (src[after] === ',') after++

  src = src.slice(0, start) + block + src.slice(after)
  count++
}

fs.writeFileSync(target, src)
console.log(`已替换 ${count} 条支线`)
