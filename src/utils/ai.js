// 带扩展名：这个文件会被 scripts/check.mjs 用原生 ESM 直接 import，裸路径在 Node 下解析不到
import { AI_CONFIG, ANALYSIS_PROMPT } from '../config/ai.js'

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

/**
 * 调用视觉模型分析一张图片。
 * @param {File} file
 * @param {(stage: string) => void} [onStage]
 * @returns {Promise<{ text: string, model: string, elapsed: number, sentWidth: number, sentHeight: number, shrunk: boolean }>}
 */
export async function analyzeImage(file, onStage) {
  if (!AI_CONFIG.baseUrl || !AI_CONFIG.apiKey) {
    throw new AIConfigError('还没配置模型接口地址与 API Key')
  }

  onStage?.('正在读取图片…')
  const started = Date.now()
  const image = await toDataUrl(file)

  onStage?.('正在请求模型…')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs)

  let response
  try {
    response = await fetch(AI_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: ANALYSIS_PROMPT },
              { type: 'image_url', image_url: { url: image.dataUrl } },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.4,
      }),
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`模型响应超时（超过 ${Math.round(AI_CONFIG.timeoutMs / 1000)} 秒），稍后重试`)
    }
    // fetch 抛 TypeError 时浏览器不会告诉原因：跨域被拦、DNS 错、断网都长这样
    throw new Error(`请求发不出去：${error.message}。请检查接口地址与网络；浏览器报 Failed to fetch 多半是该接口没允许跨域（CORS），需要走自己的代理。`)
  } finally {
    clearTimeout(timer)
  }

  const raw = await response.text()
  let data = null
  try {
    data = JSON.parse(raw)
  } catch {
    // 网关偶尔直接返回 HTML 错误页，下面统一按状态码报错
  }

  if (!response.ok) {
    const detail = data?.error?.message || data?.message || raw.slice(0, 160) || '无返回内容'
    throw new Error(`接口返回 ${response.status}：${detail}`)
  }

  const text = extractText(data)
  if (!text) throw new Error('模型返回了空结果，换个问法或稍后重试')

  return {
    text,
    model: data?.model || AI_CONFIG.model,
    elapsed: Date.now() - started,
    sentWidth: image.width,
    sentHeight: image.height,
    shrunk: image.shrunk,
  }
}

const HEADING = /^#{1,6}\s*(.+?)\s*#*$/
const BULLET = /^(?:[-*•]|\(\d+\)|\d+[.、)])\s+(.+)$/

const stripInline = (text) =>
  text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim()

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

  return { sections, promptText }
}
