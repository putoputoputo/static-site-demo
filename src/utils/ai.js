// 带扩展名：这个文件会被 scripts/check.mjs 用原生 ESM 直接 import，裸路径在 Node 下解析不到
import { AI_CONFIG, ANALYSIS_PROMPT } from '../config/ai.js'
import { appendLog, clipText, headersToObject, maskSecret, previewImageUrl } from './aiLog.js'

// 长边超过这个值先缩一次再发：手机直出照片动辄 4000px / 5MB，
// base64 之后会膨胀到 7MB 以上，很容易被网关 413 掉
const MAX_SIDE = 1600
const MAX_BYTES = 2.5 * 1024 * 1024

export class AIConfigError extends Error {}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片解码失败，换一张试试'))
    image.src = url
  })
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.readAsDataURL(blob)
  })
}

/**
 * 把文件转成 data URL。尺寸或体积超标时等比缩小并转 JPEG，
 * 返回的 width / height 是实际发给模型的尺寸。
 */
export async function toDataUrl(file) {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const natural = { width: image.naturalWidth, height: image.naturalHeight }
    const scale = Math.min(1, MAX_SIDE / Math.max(natural.width, natural.height))

    if (scale === 1 && file.size <= MAX_BYTES) {
      return { dataUrl: await blobToDataUrl(file), ...natural, shrunk: false }
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(natural.width * scale))
    canvas.height = Math.max(1, Math.round(natural.height * scale))
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      width: canvas.width,
      height: canvas.height,
      shrunk: scale < 1,
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function extractText(data) {
  const content = data?.choices?.[0]?.message?.content
  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .join('\n')
      .trim()
  }
  // 有些网关直连 Gemini 原生接口，返回 candidates 结构
  const parts = data?.candidates?.[0]?.content?.parts
  if (Array.isArray(parts)) return parts.map((part) => part?.text || '').join('').trim()
  return ''
}

function extractUsage(data) {
  const usage = data?.usage || {}
  const meta = data?.usageMetadata || {}
  const prompt = usage.prompt_tokens ?? meta.promptTokenCount ?? 0
  const completion = usage.completion_tokens ?? meta.candidatesTokenCount ?? 0
  return { prompt, completion }
}

// 只有这两种取值代表「没写完」：OpenAI 系是 length，Gemini 原生是 MAX_TOKENS
function extractFinishReason(data) {
  const reason =
    data?.choices?.[0]?.finish_reason ||
    data?.choices?.[0]?.finishReason ||
    data?.candidates?.[0]?.finishReason ||
    ''
  return String(reason).toLowerCase()
}

/**
 * 调用视觉模型分析一张图片。
 * @param {File} file
 * @param {{ baseUrl: string, apiKey: string, model: string }} settings 页面里保存的接口配置
 * @param {(stage: string) => void} [onStage]
 * @returns {Promise<{ text: string, model: string, elapsed: number, finishReason: string, truncated: boolean, usage: { prompt: number, completion: number }, sentWidth: number, sentHeight: number, shrunk: boolean }>}
 */
export async function analyzeImage(file, settings, onStage) {
  const baseUrl = settings?.baseUrl?.trim()
  const apiKey = settings?.apiKey?.trim()
  const model = settings?.model?.trim()

  if (!baseUrl || !apiKey || !model) {
    throw new AIConfigError('还没选择模型：请点「选择模型」填好接口地址、Key 与模型名并保存')
  }

  onStage?.('正在读取图片…')
  const started = Date.now()
  const image = await toDataUrl(file)

  // 真正发出去的请求体。日志里额外放一份「图片已摘要」的副本，
  // 否则几条 base64 就能把 sessionStorage 撑爆。
  const payload = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: ANALYSIS_PROMPT },
          { type: 'image_url', image_url: { url: image.dataUrl } },
        ],
      },
    ],
    max_tokens: AI_CONFIG.maxTokens,
    temperature: AI_CONFIG.temperature,
  }

  const logRequest = {
    method: 'POST',
    url: baseUrl,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${maskSecret(apiKey)}`,
    },
    body: JSON.stringify(
      {
        ...payload,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: ANALYSIS_PROMPT },
              { type: 'image_url', image_url: { url: previewImageUrl(image.dataUrl) } },
            ],
          },
        ],
      },
      null,
      2
    ),
  }

  const imageInfo = {
    mime: (image.dataUrl.match(/^data:([^;,]+)/) || [])[1] || '',
    bytes: Math.round(((image.dataUrl.length - image.dataUrl.indexOf(',') - 1) * 3) / 4),
    width: image.width,
    height: image.height,
    shrunk: image.shrunk,
  }

  // 一次请求只落一条日志：成功走成功分支，任何一步失败也必须在 throw 之前写掉，
  // 否则「为什么没结果」就无从查起
  let recorded = false
  function record(patch) {
    if (recorded) return
    recorded = true
    appendLog({
      model,
      durationMs: Date.now() - started,
      request: logRequest,
      image: imageInfo,
      ...patch,
    })
  }

  onStage?.('正在请求模型…')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs)

  let response
  try {
    response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify(payload),
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      const seconds = Math.round(AI_CONFIG.timeoutMs / 1000)
      record({ error: { name: 'TimeoutError', message: `超过 ${seconds} 秒未返回，已主动断开` } })
      throw new Error(`模型响应超时（超过 ${seconds} 秒），稍后重试`)
    }
    // fetch 抛 TypeError 时浏览器不会告诉原因：跨域被拦、DNS 错、断网都长这样
    record({ error: { name: error.name || 'TypeError', message: error.message } })
    throw new Error(`请求发不出去：${error.message}。请检查接口地址与网络；浏览器报 Failed to fetch 多半是该接口没允许跨域（CORS），需要走自己的代理。`)
  } finally {
    clearTimeout(timer)
  }

  const responseLog = {
    status: response.status,
    statusText: response.statusText,
    headers: headersToObject(response.headers),
    body: '',
    durationMs: Date.now() - started,
  }

  let raw = ''
  try {
    raw = await response.text()
  } catch (error) {
    record({ response: responseLog, error: { name: 'ReadError', message: error.message } })
    throw new Error(`读取响应内容失败：${error.message}`)
  }
  responseLog.body = clipText(raw)

  let data = null
  try {
    data = JSON.parse(raw)
  } catch {
    // 网关偶尔直接返回 HTML 错误页，下面统一按状态码报错
  }

  if (!response.ok) {
    const detail = data?.error?.message || data?.message || raw.slice(0, 160) || '无返回内容'
    record({ response: responseLog, error: { name: 'HTTPError', message: detail } })
    throw new Error(`接口返回 ${response.status}：${detail}`)
  }

  const text = extractText(data)
  if (!text) {
    record({ response: responseLog, error: { name: 'EmptyResponse', message: '响应里没有可用的文本内容' } })
    throw new Error('模型返回了空结果，换个问法或稍后重试')
  }

  // 输出被 max_tokens 截断时接口仍然返回 200，只是内容戛然而止。
  // 不检查就会表现为「后面的小节凭空消失」，这里必须把线索带出去。
  const finishReason = extractFinishReason(data)
  const usage = extractUsage(data)

  record({ response: responseLog, usage, finishReason })

  return {
    text,
    model: data?.model || model,
    elapsed: Date.now() - started,
    finishReason,
    truncated: /length|max_tokens/.test(finishReason),
    usage,
    sentWidth: image.width,
    sentHeight: image.height,
    shrunk: image.shrunk,
  }
}

const HEADING = /^#{1,6}\s*(.+?)\s*#*$/
const BULLET = /^(?:[-*•]|\(\d+\)|\d+[.、)])\s+(.+)$/

// 提示词要求的小节。模型不按 `###` 写时，这几个名字是唯一可靠的锚点
const SECTION_NAMES = ['整体评价', '具体问题', '优化建议', '图像编辑提示词']

const stripInline = (text) =>
  text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim()

/**
 * 识别「没有 ### 的小节标题」：模型常把标题写成
 * `**优化建议**`、`【优化建议】`、`优化建议：`、`三、优化建议`。
 * 只认 SECTION_NAMES 里的名字，且必须是独立短行，避免把正文句子误判成标题。
 */
function looseHeading(line) {
  let text = line.trim()
  if (/^[-•+>]/.test(text)) return ''
  text = text.replace(/^[#*【\[]+\s*/, '') // ##### / ** / 【 / [
  text = text.replace(/\s*[*】\]]+\s*$/, '') // 收尾的 ** / 】 / ]
  text = text.replace(/^(?:[一二三四五六七八九十]+|\d+)\s*[、.．)]\s*/, '') // 三、 / 3.
  text = text.replace(/\s*[:：]\s*$/, '')
  text = text.trim()

  if (!text || text.length > 20) return ''
  if (/[。！？；，,.;?!]/.test(text)) return ''

  const name = SECTION_NAMES.find((item) => text.startsWith(item))
  if (!name) return ''

  // 名称后面只允许空的或整体括号补充，如「图像编辑提示词（英文）」
  const suffix = text.slice(name.length).trim()
  if (suffix && !/^[（(【\[].*[）)】\]]$/.test(suffix)) return ''

  return text
}

/**
 * 把模型返回的 markdown 拆成「小节 → 块」，供模板按块渲染。
 * 不用 v-html，模型输出里的任何标签都只会当文本显示。
 */
export function parseAnalysis(markdown) {
  const sections = []
  let current = null
  let inCode = false
  let codeLines = []

  const ensure = () => {
    if (!current) {
      current = { title: '', blocks: [] }
      sections.push(current)
    }
    return current
  }

  const flushCode = () => {
    const text = codeLines.join('\n').trim()
    if (text) ensure().blocks.push({ kind: 'code', text })
    codeLines = []
  }

  for (const rawLine of String(markdown).split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '')
    const trimmed = line.trim()

    if (inCode) {
      if (trimmed.startsWith('```')) {
        inCode = false
        flushCode()
      } else {
        codeLines.push(line)
      }
      continue
    }

    if (trimmed.startsWith('```')) {
      inCode = true
      codeLines = []
      continue
    }

    if (!trimmed) continue

    const heading = trimmed.match(HEADING)
    if (heading) {
      current = { title: stripInline(heading[1]), blocks: [] }
      sections.push(current)
      continue
    }

    // 模型偶尔漏掉 ###，靠小节名兜一层，否则那一节会被并进上一节里
    const loose = looseHeading(trimmed)
    if (loose) {
      current = { title: loose, blocks: [] }
      sections.push(current)
      continue
    }

    const target = ensure()
    const bullet = trimmed.match(BULLET)
    if (bullet) {
      const last = target.blocks[target.blocks.length - 1]
      if (last && last.kind === 'list') last.items.push(stripInline(bullet[1]))
      else target.blocks.push({ kind: 'list', items: [stripInline(bullet[1])] })
      continue
    }

    target.blocks.push({ kind: 'p', text: stripInline(trimmed) })
  }

  if (inCode) flushCode()

  // 「图像编辑提示词」单独拎出来，界面上给它一个复制按钮
  const promptSection = sections.find((section) => /图像编辑提示词|image editing prompt/i.test(section.title))
  let promptText = ''
  if (promptSection) {
    promptText = promptSection.blocks
      .filter((block) => block.kind === 'code')
      .map((block) => block.text)
      .join('\n')
      .trim()
    if (!promptText) {
      promptText = promptSection.blocks
        .filter((block) => block.kind !== 'list')
        .map((block) => (block.kind === 'p' ? block.text : block.items.join(' ')))
        .join('\n')
        .replace(/^["“']|["”']$/g, '')
        .trim()
    }
    promptSection.isPrompt = true
  }

  // 四段里缺了哪几段：截断和「模型没按格式写」都会走到这里，界面据此提示
  const titles = sections.map((section) => section.title).join(' ')
  const missing = SECTION_NAMES.filter((name) => !titles.includes(name))

  return { sections, promptText, missing }
}
