// 主线进度：记录哪些章节已通关
//
// 存储细节收在 composables/progress.js，这里只做语义包装。
// 主线与支线分开存，两者 id 体系不同，混在一起没法做总览统计。

import { computed } from 'vue'
import { STORAGE_KEYS, createIdStore } from './progress.js'

const store = createIdStore(STORAGE_KEYS.main)

export function useMainProgress() {
  const completedCount = computed(() => store.count.value)

  const isCompleted = (id) => store.has(id)

  function toggleCompleted(id) {
    store.toggle(id)
  }

  function resetProgress() {
    store.clear()
  }

  return { completed: store.ids, completedCount, isCompleted, toggleCompleted, resetProgress }
}
