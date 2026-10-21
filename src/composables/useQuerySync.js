// 把筛选 / 分页状态同步进 URL query
//
// 目的：刷新不丢、链接可分享、浏览器前进后退能回到上一个筛选组合。
// 只写入非默认值，避免 URL 里塞满 `?q=&dlc=all&type=` 这类噪音。
//
// 用法：
//   useQuerySync({ q: keyword, dlc: dlcFilter }, { dlc: 'all' })
// 值类型按 ref 的初始值判断：字符串 / 数字 / 布尔 / 数组（数组用逗号连接）。

import { nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

function serialize(value) {
  if (Array.isArray(value)) return value.join(',')
  if (typeof value === 'boolean') return value ? '1' : ''
  return String(value ?? '')
}

function sameQuery(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    if (String(a[key] ?? '') !== String(b[key] ?? '')) return false
  }
  return true
}

export function useQuerySync(fields, defaults = {}) {
  const route = useRoute()
  const router = useRouter()

  function readQuery(query) {
    Object.entries(fields).forEach(([key, refValue]) => {
      const raw = query[key]
      if (raw === undefined) {
        // URL 里没有这个键 = 回到默认值（后退、或从带筛选的页面跳到另一个模块时都要还原）
        if (key in defaults) {
          refValue.value = defaults[key]
        } else if (Array.isArray(refValue.value)) {
          refValue.value = []
        } else if (typeof refValue.value === 'boolean') {
          refValue.value = false
        } else if (typeof refValue.value === 'number') {
          refValue.value = 1
        } else {
          refValue.value = ''
        }
        return
      }
      const text = String(raw)
      if (Array.isArray(refValue.value)) {
        refValue.value = text ? text.split(',').filter(Boolean) : []
      } else if (typeof refValue.value === 'number') {
        const num = Number(text)
        if (!Number.isNaN(num)) refValue.value = num
      } else if (typeof refValue.value === 'boolean') {
        refValue.value = text === '1' || text === 'true'
      } else {
        refValue.value = text
      }
    })
  }

  // 首次挂载：URL → 状态（放在 watch 之前，避免把读到的值又写回去）
  readQuery(route.query)

  // 分页页面的坑：筛选值一变，usePagination 会把页码重置为第 1 页，
  // 而这次「筛选值变化」正是上面从 URL 还原出来的。重置跑在 nextTick 的 watch 里，
  // 所以数字字段（页码 / 每页条数）要在那之后再补一次，否则分享出去的 ?page=5 会失效。
  const numericKeys = Object.entries(fields)
    .filter(([, refValue]) => typeof refValue.value === 'number')
    .map(([key]) => key)
  if (numericKeys.some((key) => route.query[key] !== undefined)) {
    nextTick(() => {
      numericKeys.forEach((key) => {
        const raw = route.query[key]
        if (raw === undefined) return
        const num = Number(raw)
        if (!Number.isNaN(num)) fields[key].value = num
      })
    })
  }

  // 浏览器前进 / 后退：地址变了要把状态跟着改回来
  watch(
    () => route.query,
    (query) => readQuery(query)
  )

  // 状态 → URL
  watch(
    () => Object.entries(fields).map(([key, refValue]) => [key, serialize(refValue.value)]),
    (pairs) => {
      // 保留不属于本页的 query（例如从别的页面带过来的参数）
      const query = {}
      Object.entries(route.query).forEach(([key, value]) => {
        if (!(key in fields)) query[key] = value
      })
      pairs.forEach(([key, value]) => {
        const fallback = key in defaults ? serialize(defaults[key]) : ''
        if (value === fallback || value === '') return
        query[key] = value
      })
      if (sameQuery(query, route.query)) return
      // 保留 hash：区域图鉴等页面靠 #anchor 定位
      router.replace({ query, hash: route.hash })
    }
  )
}
