import { computed, ref, watch } from 'vue'

// 支线进度：模块级单例，列表页与详情页共享同一份状态
const STORAGE_KEY = 'er-guide:quest-progress'

function loadCompleted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

const completed = ref(loadCompleted())

watch(
  completed,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // 隐私模式或存储已满时静默失败，不影响页面使用
    }
  },
  { deep: true }
)

export function useQuestProgress() {
  const completedCount = computed(() => completed.value.length)

  function isCompleted(id) {
    return completed.value.includes(id)
  }

  function toggleCompleted(id) {
    const index = completed.value.indexOf(id)
    if (index > -1) {
      completed.value.splice(index, 1)
    } else {
      completed.value.push(id)
    }
  }

  function resetProgress() {
    completed.value = []
  }

  return { completed, completedCount, isCompleted, toggleCompleted, resetProgress }
}
