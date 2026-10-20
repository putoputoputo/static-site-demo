import { computed, ref, watch } from 'vue'

// 收藏夹：模块级单例，列表页与详情页共享同一份状态
const STORAGE_KEY = 'er-guide:weapon-favorites'

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

const favorites = ref(loadFavorites())

watch(
  favorites,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // 隐私模式或存储已满时静默失败，不影响页面使用
    }
  },
  { deep: true }
)

export function useWeaponFavorites() {
  const favoriteCount = computed(() => favorites.value.length)

  function isFavorite(id) {
    return favorites.value.includes(id)
  }

  function toggleFavorite(id) {
    const index = favorites.value.indexOf(id)
    if (index > -1) {
      favorites.value.splice(index, 1)
    } else {
      favorites.value.push(id)
    }
  }

  return { favorites, favoriteCount, isFavorite, toggleFavorite }
}
