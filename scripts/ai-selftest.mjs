// 临时自测：用本地 mock 网关验证 analyzeImage 的请求体与返回解析。
// 不放进项目，验证完即删。
import { createServer } from 'node:http'
import { analyzeImage, parseAnalysis, AIConfigError } from 'file:///E:/mock/elldeng/src/utils/ai.js'
import { AI_CONFIG } from 'file:///E:/mock/elldeng/src/config/ai.js'

/* ---- 浏览器 API 的最小替身 ---- */
globalThis.URL.createObjectURL = () => 'blob:mock'
globalThis.URL.revokeObjectURL = () => {}
globalThis.Image = class {
  set src(value) {
    this.naturalWidth = 100
    this.naturalHeight = 80
    setTimeout(() => this.onload && this.onload(), 0)
  }
}
globalThis.FileReader = class {
  readAsDataURL() {
    this.result = 'data:image/png;base64,MOCK'
    setTimeout(() => this.onload && this.onload(), 0)
  }
}
globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage() {} }), toDataURL: () => 'data:image/jpeg;base64,SHRUNK' }),
}

const ANSWER = [
  '### 整体评价',
  '主体清楚，**地平线略歪**。',
  '### 具体问题',
  '- 天空占比过大',
  '- 前景缺少引导线',
  '### 优化建议',
  '1. 机位下压，天空留三分之一',
  '### 图像编辑提示词（英文）',
  '```',
  'Reframe with rule-of-thirds horizon, lift shadows, warm highlights.',
  '```',
].join('\n')

let received = null
let mode = 'ok'

const server = createServer((req, res) => {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => {
    if (mode === 'error') {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: { message: 'upstream overloaded' } }))
      return
    }
    received = { headers: req.headers, body: JSON.parse(body) }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      model: 'gemini-3.8-flash-high',
      choices: [{ message: { role: 'assistant', content: ANSWER } }],
    }))
  })
})

await new Promise((resolve) => server.listen(8787, resolve))
const endpoint = 'http://127.0.0.1:8787/v1/chat/completions'

let failed = 0
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failed += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${JSON.stringify(actual)}${ok ? '' : `  期望 ${JSON.stringify(expected)}`}`)
}

/* ---- 1. 未配置时不发请求 ---- */
try {
  await analyzeImage({ size: 1000, type: 'image/png', name: 'a.png' })
  check('未配置应抛错', false, true)
} catch (error) {
  check('未配置抛 AIConfigError', error instanceof AIConfigError, true)
}

/* ---- 2. 正常请求 ---- */
AI_CONFIG.baseUrl = endpoint
AI_CONFIG.apiKey = 'test-key'
const stages = []
const result = await analyzeImage(
  { size: 1000, type: 'image/png', name: 'a.png' },
  (stage) => stages.push(stage)
)

check('阶段提示顺序', stages, ['正在读取图片…', '正在请求模型…'])
check('请求带 Bearer', received.headers.authorization, 'Bearer test-key')
check('请求 Content-Type', received.headers['content-type'], 'application/json')
check('模型名写死正确', received.body.model, 'gemini-3.8-flash-high')
check('单条 user 消息', received.body.messages.length, 1)
check('先文本后图片', received.body.messages[0].content.map((part) => part.type), ['text', 'image_url'])
check('提示词原文照发', received.body.messages[0].content[0].text.startsWith('你是一位专业摄影指导'), true)
check('图片以 data URL 传', received.body.messages[0].content[1].image_url.url.startsWith('data:image/'), true)
check('解析出模型名', result.model, 'gemini-3.8-flash-high')

const parsed = parseAnalysis(result.text)
check('小节数量', parsed.sections.length, 4)
check('英文提示词抽出', parsed.promptText, 'Reframe with rule-of-thirds horizon, lift shadows, warm highlights.')

/* ---- 3. 接口报错 ---- */
mode = 'error'
try {
  await analyzeImage({ size: 10, type: 'image/png', name: 'b.png' })
  check('接口 500 应抛错', false, true)
} catch (error) {
  check('错误信息含状态码与原因', error.message.includes('500') && error.message.includes('upstream overloaded'), true)
}

/* ---- 4. 超时 ---- */
mode = 'ok'
AI_CONFIG.baseUrl = 'http://127.0.0.1:8787/hang'
const hang = createServer((req) => req.on('data', () => {}))
await new Promise((resolve) => hang.listen(8788, resolve))
AI_CONFIG.baseUrl = 'http://127.0.0.1:8788/v1/chat/completions'
AI_CONFIG.timeoutMs = 150
try {
  await analyzeImage({ size: 10, type: 'image/png', name: 'c.png' })
  check('超时应抛错', false, true)
} catch (error) {
  check('超时提示可读', error.message.includes('超时'), true)
}

server.close()
hang.close()
console.log(failed ? `\n${failed} 项未通过` : '\n全部通过')
process.exit(failed ? 1 : 0)
