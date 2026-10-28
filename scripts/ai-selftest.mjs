// 接口层自测：用本地 mock 网关验证 analyzeImage 的请求体与返回解析，
// 不依赖真实模型，跑 npm run check:ai。
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
    if (mode === 'truncated') {
      // 真实场景：模型写到「具体问题」就把 max_tokens 用完了
      res.end(JSON.stringify({
        model: 'gemini-3.8-flash-high',
        choices: [{
          finish_reason: 'length',
          message: { role: 'assistant', content: '### 整体评价\n主体清楚。\n### 具体问题\n- 天空占比过大' },
        }],
        usage: { prompt_tokens: 1200, completion_tokens: 1500 },
      }))
      return
    }
    res.end(JSON.stringify({
      model: 'gemini-3.8-flash-high',
      choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: ANSWER } }],
      usage: { prompt_tokens: 1180, completion_tokens: 620 },
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

// 页面上保存的配置，逐次传给 analyzeImage —— 不再有全局可变的 AI_CONFIG
const SETTINGS = { baseUrl: endpoint, apiKey: 'test-key', model: 'deepseek-flash' }

// 请求日志：跟 src/utils/ai.js 内部 import 的是同一份模块实例
const { clearLogs, getLogs } = await import(new URL('../src/utils/aiLog.js', import.meta.url).href)
clearLogs()

/* ---- 1. 配置不全时不发请求 ---- */
for (const [label, draft] of [
  ['全空', { baseUrl: '', apiKey: '', model: '' }],
  ['缺模型名', { baseUrl: endpoint, apiKey: 'test-key', model: '' }],
]) {
  try {
    await analyzeImage({ size: 1000, type: 'image/png', name: 'a.png' }, draft)
    check(`${label}应抛错`, false, true)
  } catch (error) {
    check(`${label}抛 AIConfigError`, error instanceof AIConfigError, true)
  }
}
check('缺配置时请求没发出去', received, null)

/* ---- 2. 正常请求 ---- */
const stages = []
const result = await analyzeImage(
  { size: 1000, type: 'image/png', name: 'a.png' },
  SETTINGS,
  (stage) => stages.push(stage)
)

check('阶段提示顺序', stages, ['正在读取图片…', '正在请求模型…'])
check('请求带 Bearer', received.headers.authorization, 'Bearer test-key')
check('请求 Content-Type', received.headers['content-type'], 'application/json')
check('请求用页面上填的模型名', received.body.model, SETTINGS.model)
check('单条 user 消息', received.body.messages.length, 1)
check('先文本后图片', received.body.messages[0].content.map((part) => part.type), ['text', 'image_url'])
check('提示词原文照发', received.body.messages[0].content[0].text.startsWith('你是一位专业摄影指导'), true)
check('图片以 data URL 传', received.body.messages[0].content[1].image_url.url.startsWith('data:image/'), true)
check('解析出模型名', result.model, 'gemini-3.8-flash-high')
check('max_tokens 用配置值而不是 1500', received.body.max_tokens, AI_CONFIG.maxTokens)
check('正常结束不判为截断', [result.finishReason, result.truncated], ['stop', false])
check('带回 token 用量', result.usage, { prompt: 1180, completion: 620 })

/* ---- 2.2 日志：请求与响应都要留档 ---- */
const successLog = getLogs()[0]
check('成功请求留下了日志', Boolean(successLog), true)
check('日志记录模型名与耗时', [successLog.model, successLog.durationMs >= 0], [SETTINGS.model, true])
check('日志的请求地址与真实请求一致', successLog.request.url, endpoint)
check('日志里 Authorization 已脱敏', successLog.request.headers.Authorization, 'Bearer ********')
check('日志不含完整 Key', successLog.request.headers.Authorization.includes('test-key'), false)
check('日志保留完整提示词', successLog.request.body.includes('你是一位专业摄影指导'), true)
check('图片 base64 在日志中省略', successLog.request.body.includes('日志中省略'), true)
check('日志记录图片尺寸', [successLog.image.width, successLog.image.height], [100, 80])
check('日志保存响应原文', successLog.response.body.includes('整体评价'), true)
check('日志记录响应状态', successLog.response.status, 200)

const parsed = parseAnalysis(result.text)
check('小节数量', parsed.sections.length, 4)
check('英文提示词抽出', parsed.promptText, 'Reframe with rule-of-thirds horizon, lift shadows, warm highlights.')
check('四段齐全', parsed.missing, [])

/* ---- 2.5 输出被 max_tokens 截断 ---- */
mode = 'truncated'
const cut = await analyzeImage({ size: 10, type: 'image/png', name: 'cut.png' }, SETTINGS)
check('finish_reason=length 判为截断', [cut.finishReason, cut.truncated], ['length', true])
check('截断时缺段被标出来', parseAnalysis(cut.text).missing, ['优化建议', '图像编辑提示词'])

/* ---- 3. 接口报错 ---- */
mode = 'error'
try {
  await analyzeImage({ size: 10, type: 'image/png', name: 'b.png' }, SETTINGS)
  check('接口 500 应抛错', false, true)
} catch (error) {
  check('错误信息含状态码与原因', error.message.includes('500') && error.message.includes('upstream overloaded'), true)
}

// 失败那一次同样要落到日志里，否则「为什么没结果」无从查起
const errorLog = getLogs()[0]
check('失败请求也留日志', errorLog.response.status, 500)
check('失败日志带接口原因', errorLog.error.message, 'upstream overloaded')

/* ---- 4. 超时 ---- */
mode = 'ok'
const hang = createServer((req) => req.on('data', () => {}))
await new Promise((resolve) => hang.listen(8788, resolve))
const previousTimeout = AI_CONFIG.timeoutMs
AI_CONFIG.timeoutMs = 150
try {
  await analyzeImage(
    { size: 10, type: 'image/png', name: 'c.png' },
    { ...SETTINGS, baseUrl: 'http://127.0.0.1:8788/v1/chat/completions' }
  )
  check('超时应抛错', false, true)
} catch (error) {
  check('超时提示可读', error.message.includes('超时'), true)
} finally {
  AI_CONFIG.timeoutMs = previousTimeout
}

const timeoutLog = getLogs()[0]
check('超时也留日志', timeoutLog.error.name, 'TimeoutError')
check('超时没有响应体', timeoutLog.response, null)

server.close()
hang.close()
console.log(failed ? `\n${failed} 项未通过` : '\n全部通过')
process.exit(failed ? 1 : 0)
