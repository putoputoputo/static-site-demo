// 影之刃零收藏：武器 / 影之武装 / BOSS 共用一个收藏夹
//
// 为什么不复用 useCodexFavorites：那份 key 属于艾尔登法环，且已经进了「我的进度」
// 的导出 / 导入清单。两个游戏的条目混在一个数组里，导出文件会对不上版本，
// 清空法环收藏时也会连坐影之刃零。这里单独给一个 key，互不影响。
//
// 存储值是带命名空间的字符串，因为三份数据的 id 可能重名：
//   codex:weapons:scarlet-wraithblade
//   codex:phantomEdges:axe
//   boss:zuo-shang
// 拆分方式与 useCodexFavorites 一致（模块 key + 条目 id），只是多一层 boss: 前缀。

import { computed } from 'vue'
import { createIdStore } from './progress.js'

const STORAGE_KEY = 'er-guide:pbz-favorites'

const store = createIdStore(STORAGE_KEY)

const codexKey = (moduleKey, itemId) => `codex:${moduleKey}:${itemId}`
const bossKey = (bossId) => `boss:${bossId}`

export function usePbzFavorites() {
  const favoriteCount = computed(() => store.count.value)

  const isCodexFavorite = (moduleKey, itemId) => store.has(codexKey(moduleKey, itemId))

  const toggleCodexFavorite = (moduleKey, itemId) => store.toggle(codexKey(moduleKey, itemId))

  /** 某个图鉴模块的收藏条目 id 列表（顺序即收藏顺序） */
  function favoritesOf(moduleKey) {
    const prefix = `codex:${moduleKey}:`
    return store.ids.value.filter((item) => item.startsWith(prefix)).map((item) => item.slice(prefix.length))
  }

  const isBossFavorite = (bossId) => store.has(bossKey(bossId))

  const toggleBossFavorite = (bossId) => store.toggle(bossKey(bossId))

  /** BOSS 收藏数：BOSS 列表与详情页共用 */
  const bossFavoriteCount = computed(() => store.ids.value.filter((item) => item.startsWith('boss:')).length)

  function clearFavorites() {
    store.clear()
  }

  return {
    favoriteCount,
    isCodexFavorite,
    toggleCodexFavorite,
    favoritesOf,
    isBossFavorite,
    toggleBossFavorite,
    bossFavoriteCount,
    clearFavorites,
  }
}
