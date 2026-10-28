// AI 请求日志：记录每次 analyzeImage 实际发出的请求与模型原始返回。
//
// 零依赖（不 import vue、不碰 DOM API），因此浏览器和 Node 回归脚本都能直接导入。
//
// 存 localStorage（而不是 sessionStorage）：日志要长期留在这台机器上，
// 关掉标签页、重开浏览器回来还能对比几次请求。代价是得靠页面上的
// 「清理日志」手动回收，所以单条响应体上限压到 6 万字符——30 条也远低于 5MB 配额。

const STORAGE_KEY = 'er-guide:ai-logs'

// 保留最近多少次请求：够定位问题，又不至于把内存撑大
export const MAX_LOGS = 30

// 模型正常只返回几 KB；这个上限是给「网关甩整页 HTML」那种异常兜底的
const MAX_BODY_CHARS = 60_000

const canUseStorage = () => {
  if (typeof window === 'undefined') return false
  try {
    return Boolean(window.localStorage)
  } catch {
    return false
  }
}

function readStored() {
  if (!canUseStorage()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // 手改坏了就当没有，别让页面白屏
    return []
  }
}

let entries = readStored()
const listeners = new Set()
let seq = 0

function persist() {
  if (!canUseStorage()) return false

  // localStorage 只有 5MB，条目又带完整响应体：写不下时丢掉旧的一半再试，
  // 保证「最新那条」一定落盘。内存里的 entries 不动，用户当前看到的不会被抽走。
  let payload = entries
  while (payload.length) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      return true
    } catch {
      payload = payload.slice(0, Math.floor(payload.length / 2))
    }
  }
  return false
}

function notify() {
  for (const listener of listeners) listener(entries)
}

/** 订阅日志变化，返回取消订阅函数 */
export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getLogs = () => entries

export function appendLog(entry) {
  const record = {
    id: `log-${Date.now()}-${++seq}`,
    at: new Date().toISOString(),
    response: null,
    error: null,
    ...entry,
  }
  entries = [record, ...entries].slice(0, MAX_LOGS)
  persist()
  notify()
  return record
}

export function clearLogs() {
  entries = []
  // 直接删键而不是写 []：日志已经持久化，清空后不该再在这台机器上留任何痕迹
  if (canUseStorage()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* 忽略 */
    }
  }
  notify()
}

/** 脱敏：sk-034d4d561a25412da6a5b22c0c15393b → sk-034…93b */
export function maskSecret(secret) {
  const value = String(secret || '')
  if (!value) return ''
  if (value.length <= 10) return '*'.repeat(value.length)
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

export function formatBytes(bytes) {
  const value = Number(bytes) || 0
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(2)} MB`
}

/**
 * 图片 dataURL 只留前缀和体积：一张 1600px 的 base64 有两三 MB，
 * 原样塞进日志既存不下（sessionStorage 只有 5MB）也没法看。
 * 前缀足够确认「图片确实发出去了、mime 是什么」。
 */
export function previewImageUrl(dataUrl) {
  const value = String(dataUrl || '')
  if (!value) return ''
  const comma = value.indexOf(',')
  const head = comma === -1 ? value : value.slice(0, comma + 1)
  const bytes = comma === -1 ? 0 : Math.round(((value.length - comma - 1) * 3) / 4)
  return `${head}…（base64 共 ${formatBytes(bytes)}，日志中省略）`
}

export function clipText(text, limit = MAX_BODY_CHARS) {
  const value = String(text ?? '')
  if (value.length <= limit) return value
  return `${value.slice(0, limit)}\n… 已截断，原文共 ${value.length} 字符`
}

/** Headers 实例 / 普通对象都转成可序列化的对象 */
export function headersToObject(headers) {
  const result = {}
  if (!headers) return result
  if (typeof headers.forEach === 'function') {
    headers.forEach((value, key) => {
      result[key] = value
    })
    return result
  }
  for (const [key, value] of Object.entries(headers)) result[key] = String(value)
  return result
}

/** 把一条日志导出成可粘贴的纯文本，「复制日志」按钮用它 */
export function formatLog(entry) {
  if (!entry) return ''

  const lines = [`# ${entry.at} · ${entry.model || '未知模型'}`, '']

  lines.push('## 请求')
  lines.push(`${entry.request?.method || 'POST'} ${entry.request?.url || ''}`)
  for (const [key, value] of Object.entries(entry.request?.headers || {})) {
    lines.push(`${key}: ${value}`)
  }
  if (entry.image) {
    lines.push(
      `# 图片 ${entry.image.width} × ${entry.image.height} · ${entry.image.mime || '未知格式'} · ${formatBytes(entry.image.bytes)}${entry.image.shrunk ? '（发送前已压缩）' : ''}`
    )
  }
  lines.push('', entry.request?.body || '')

  lines.push('', '## 响应')
  if (entry.response) {
    lines.push(`HTTP ${entry.response.status} ${entry.response.statusText || ''}`.trim())
    for (const [key, value] of Object.entries(entry.response.headers || {})) {
      lines.push(`${key}: ${value}`)
    }
    lines.push('', entry.response.body || '（空响应体）')
  } else {
    lines.push(`请求未完成：${entry.error?.name || 'Error'} · ${entry.error?.message || '无更多信息'}`)
  }

  if (entry.error && entry.response) {
    lines.push('', `# 本地判定：${entry.error.name} · ${entry.error.message}`)
  }

  return lines.join('\n')
}
