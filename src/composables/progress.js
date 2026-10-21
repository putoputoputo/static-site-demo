// 进度存储层：站内所有「用户自己的数据」统一走这里
//
// 之前主线进度、支线进度、武器收藏各写各的 localStorage：三份几乎逐字重复的
// load / watch / 写入代码，key 分散在三个文件里，既没法统一导出，也没法做总览页。
// 这层把它们收敛成同一套读写，key 集中登记，顺带得到导出 / 导入 / 清空能力。
//
// 数据形态刻意保持简单：每份进度就是一个字符串 id 数组。
// 复杂的结构（哪个步骤完成了、什么时候完成的）先不做 —— 现在没有任何界面需要，
// 加上去只会让存储格式升级变得麻烦。

import { computed, ref, watch } from 'vue'

export const STORAGE_KEYS = {
  main: 'er-guide:main-progress',
  quest: 'er-guide:quest-progress',
  weaponFavorite: 'er-guide:weapon-favorites',
  codexFavorite: 'er-guide:codex-favorites',
}

export const STORAGE_LABELS = {
  main: '主线进度',
  quest: '支线进度',
  weaponFavorite: '武器收藏',
  codexFavorite: '图鉴收藏',
}

// SSR 与隐私模式下 localStorage 不可用：读空、写丢弃，页面照常工作
function canUseStorage() {
  if (typeof window === 'undefined') return false
  try {
    return Boolean(window.localStorage)
  } catch {
    return false
  }
}

function readIds(key) {
  if (!canUseStorage()) return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // 手改 localStorage 或旧版本残留都可能混入非字符串，这里过滤掉
    return parsed.filter((item) => typeof item === 'string')
  } catch {
    return []
  }
}

function writeIds(key, ids) {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(ids))
  } catch {
    // 配额满 / 隐私模式：静默失败，不影响当前页面使用
  }
}

// 已创建的 store，导入数据时要把内存里的状态一起刷掉，否则刷新前看不到变化
const registry = new Map()

/**
 * 创建一个持久化的字符串 id 集合。
 * 同一个 storageKey 只会创建一次 ref，多个组件拿到的是同一份状态。
 */
export function createIdStore(storageKey) {
  if (registry.has(storageKey)) return registry.get(storageKey)

  const ids = ref(readIds(storageKey))

  watch(
    ids,
    (value) => {
      writeIds(storageKey, value)
    },
    { deep: true }
  )

  const count = computed(() => ids.value.length)

  const has = (id) => ids.value.includes(id)

  function add(id) {
    if (typeof id !== 'string' || !id || has(id)) return false
    ids.value.push(id)
    return true
  }

  function remove(id) {
    const index = ids.value.indexOf(id)
    if (index === -1) return false
    ids.value.splice(index, 1)
    return true
  }

  /** @returns {boolean} 操作后是否处于「已记录」状态 */
  function toggle(id) {
    if (has(id)) {
      remove(id)
      return false
    }
    add(id)
    return true
  }

  function clear() {
    ids.value = []
  }

  // 导入时用：整体替换，不触发逐个添加的多余写入
  function replace(list) {
    ids.value = Array.isArray(list) ? list.filter((item) => typeof item === 'string') : []
  }

  const store = { key: storageKey, ids, count, has, add, remove, toggle, clear, replace, reload: () => replace(readIds(storageKey)) }
  registry.set(storageKey, store)
  return store
}

// ==================== 整体导出 / 导入 ====================

export const PROGRESS_EXPORT_VERSION = 1

/** 导出成可以备份 / 换设备迁移的 JSON 文本 */
export function exportProgress() {
  const data = {}
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    // 没创建过的 store 也要导出，否则「只打开过武器页」的用户会丢另外三项
    data[name] = registry.get(key)?.ids.value ?? readIds(key)
  })

  return JSON.stringify(
    {
      site: 'er-guide',
      version: PROGRESS_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      data,
    },
    null,
    2
  )
}

/**
 * 导入进度。只接受本站导出的结构，逐项校验后再写，
 * 避免一个格式不对的文件把现有进度清空。
 * @returns {{ ok: boolean, message: string, imported: string[] }}
 */
export function importProgress(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, message: '不是合法的 JSON 文件', imported: [] }
  }

  if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
    return { ok: false, message: '文件里没有 data 字段，可能不是本站导出的进度文件', imported: [] }
  }

  const imported = []
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const value = parsed.data[name]
    if (!Array.isArray(value)) return
    const ids = value.filter((item) => typeof item === 'string')
    const store = registry.get(key)
    if (store) store.replace(ids)
    else writeIds(key, ids)
    imported.push(`${STORAGE_LABELS[name]} ${ids.length} 项`)
  })

  if (!imported.length) return { ok: false, message: '文件里没有任何可识别的进度项', imported: [] }
  return { ok: true, message: `已导入：${imported.join('、')}`, imported }
}

/** 清空全部进度（逐项清空，不动 localStorage 里的其它站点数据） */
export function clearAllProgress() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    const store = registry.get(key)
    if (store) store.clear()
    else writeIds(key, [])
  })
}

/** 当前有进度的项，用于总览页的「已记录 N 项」 */
export function progressSnapshot() {
  return Object.entries(STORAGE_KEYS).map(([name, key]) => ({
    name,
    key,
    label: STORAGE_LABELS[name],
    count: (registry.get(key)?.ids.value ?? readIds(key)).length,
  }))
}
