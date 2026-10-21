// 武器收藏：记录收藏了哪些武器
//
// 存储细节收在 composables/progress.js；模块级单例由 createIdStore 保证，
// 列表页与详情页天然共享同一份状态。

import { computed } from 'vue'
import { STORAGE_KEYS, createIdStore } from './progress.js'

const store = createIdStore(STORAGE_KEYS.weaponFavorite)

export function useWeaponFavorites() {
  const favoriteCount = computed(() => store.count.value)

  const isFavorite = (id) => store.has(id)

  function toggleFavorite(id) {
    store.toggle(id)
  }

  function clearFavorites() {
    store.clear()
  }

  return {
    favorites: store.ids,
    favoriteCount,
    isFavorite,
    toggleFavorite,
    clearFavorites,
  }
}
