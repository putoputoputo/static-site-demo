// 支线进度：记录哪些支线已完成
//
// 存储细节收在 composables/progress.js；模块级单例由 createIdStore 保证，
// 列表页与详情页天然共享同一份状态。

import { computed } from 'vue'
import { STORAGE_KEYS, createIdStore } from './progress.js'

const store = createIdStore(STORAGE_KEYS.quest)

export function useQuestProgress() {
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
