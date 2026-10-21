// 图鉴收藏：护符 / 魔法 / 祷告 / 骨灰共用一个收藏夹
//
// 存的是 `${moduleKey}:${itemId}`，因为四个模块的 id 可能重名
// （例如魔法和祷告都可能有同名条目），只存 id 会串。
// 武器有自己独立的收藏 key，没有合并 —— 两者的使用场景不同
// （武器按 build 挑，法术按 build 记），混在一起以后不好拆。

import { computed } from 'vue'
import { STORAGE_KEYS, createIdStore } from './progress.js'

const store = createIdStore(STORAGE_KEYS.codexFavorite)

const keyOf = (moduleKey, itemId) => `${moduleKey}:${itemId}`

export function useCodexFavorites() {
  const favoriteCount = computed(() => store.count.value)

  const isFavorite = (moduleKey, itemId) => store.has(keyOf(moduleKey, itemId))

  function toggleFavorite(moduleKey, itemId) {
    store.toggle(keyOf(moduleKey, itemId))
  }

  /** 某个模块的收藏条目 id 列表 */
  function favoritesOf(moduleKey) {
    const prefix = `${moduleKey}:`
    return store.ids.value.filter((item) => item.startsWith(prefix)).map((item) => item.slice(prefix.length))
  }

  /** 按模块统计收藏数 */
  function countsByModule(moduleKeys) {
    const result = {}
    moduleKeys.forEach((moduleKey) => {
      result[moduleKey] = favoritesOf(moduleKey).length
    })
    return result
  }

  function clearFavorites() {
    store.clear()
  }

  return { favorites: store.ids, favoriteCount, isFavorite, toggleFavorite, favoritesOf, countsByModule, clearFavorites }
}
