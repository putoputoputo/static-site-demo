// 影像分析的接口配置：从源码搬到页面上，用户自己填、自己存。
//
// 存 localStorage 而不是 .env，是因为这站是纯静态托管 —— .env 里的 key 会
// 被打进前端产物，换机器 / 换 key 都得重新构建。放浏览器里则由使用者掌控，
// 想换模型随时在弹窗里改。
//
// 只保存到本机，不往任何地方上传；但同一个浏览器里的脚本都能读到，界面上要讲清楚。

import { computed, ref } from 'vue'

export const AI_STORAGE_KEY = 'er-guide:ai-settings'

export const EMPTY_SETTINGS = { baseUrl: '', apiKey: '', model: '' }

// SSR 与隐私模式下 localStorage 不可用：读默认值、写丢弃，页面照常渲染
function canUseStorage() {
  if (typeof window === 'undefined') return false
  try {
    return Boolean(window.localStorage)
  } catch {
    return false
  }
}

const asText = (value) => (typeof value === 'string' ? value.trim() : '')

function read() {
  if (!canUseStorage()) return { ...EMPTY_SETTINGS }
  try {
    const raw = window.localStorage.getItem(AI_STORAGE_KEY)
    if (!raw) return { ...EMPTY_SETTINGS }
    const parsed = JSON.parse(raw)
    return {
      baseUrl: asText(parsed.baseUrl),
      apiKey: asText(parsed.apiKey),
      model: asText(parsed.model),
    }
  } catch {
    // 手改坏了就当没配过，别让页面白屏
    return { ...EMPTY_SETTINGS }
  }
}

/**
 * 校验草稿，返回错误文案（空串代表通过）。
 * 只做能拦住常见手误的检查，不猜接口是否真的可用。
 */
export function validateSettings(draft) {
  const baseUrl = asText(draft?.baseUrl)
  const apiKey = asText(draft?.apiKey)
  const model = asText(draft?.model)

  if (!baseUrl) return '请填写接口地址'
  if (!/^https?:\/\/\S+$/i.test(baseUrl)) return '接口地址要以 http:// 或 https:// 开头'
  if (!apiKey) return '请填写 API Key'
  if (!model) return '请填写模型名'
  return ''
}

// 单例：页面里多处读同一份配置，弹窗保存后所有地方立刻拿到新值
const settings = ref(read())

export function useAISettings() {
  const isReady = computed(() =>
    Boolean(settings.value.baseUrl && settings.value.apiKey && settings.value.model)
  )

  function save(draft) {
    const error = validateSettings(draft)
    if (error) return error

    settings.value = {
      baseUrl: asText(draft.baseUrl),
      apiKey: asText(draft.apiKey),
      model: asText(draft.model),
    }
    if (canUseStorage()) {
      try {
        window.localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(settings.value))
      } catch {
        // 配额满 / 隐私模式：本次会话内仍可用，只是刷新后要重填
      }
    }
    return ''
  }

  function clear() {
    settings.value = { ...EMPTY_SETTINGS }
    if (canUseStorage()) {
      try {
        window.localStorage.removeItem(AI_STORAGE_KEY)
      } catch {
        /* 忽略 */
      }
    }
  }

  return { settings, isReady, save, clear }
}
