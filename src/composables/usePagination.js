import { computed, ref, watch } from 'vue'

/**
 * 客户端分页。
 *
 * 用法：把「已经筛选、排序完毕」的完整列表传进来，拿回分页后的切片。
 * 筛选逻辑不要写在这里，否则页码与筛选结果会互相耦合、容易出现空页。
 *
 * @param {import('vue').Ref<Array> | import('vue').ComputedRef<Array>} list 完整结果集
 * @param {object} [options]
 * @param {number} [options.initialPageSize=20] 每页条数，0 表示不分页（全量展示）
 * @param {() => string | number} [options.resetToken] 返回一个指纹，指纹变化即回到第 1 页
 * @returns {{
 *   pageSize: import('vue').Ref<number>,
 *   currentPage: import('vue').Ref<number>,
 *   totalPages: import('vue').ComputedRef<number>,
 *   pageStart: import('vue').ComputedRef<number>,
 *   pageEnd: import('vue').ComputedRef<number>,
 *   pageItems: import('vue').ComputedRef<Array<number | string>>,
 *   pagedList: import('vue').ComputedRef<Array>,
 *   goPage: (page: number | string) => boolean,
 *   setPageSize: (size: number) => boolean
 * }}
 */
export function usePagination(list, { initialPageSize = 20, resetToken } = {}) {
  const pageSize = ref(initialPageSize)
  const currentPage = ref(1)

  const totalPages = computed(() => {
    if (!pageSize.value) return 1
    return Math.max(1, Math.ceil(list.value.length / pageSize.value))
  })

  const pageStart = computed(() => (pageSize.value ? (currentPage.value - 1) * pageSize.value : 0))

  const pageEnd = computed(() =>
    pageSize.value ? Math.min(pageStart.value + pageSize.value, list.value.length) : list.value.length
  )

  const pagedList = computed(() =>
    pageSize.value ? list.value.slice(pageStart.value, pageEnd.value) : list.value
  )

  /**
   * 页码序列：总页数超过 7 时折叠中段，只保留首尾各一页与当前页前后各一页。
   * 折叠位用 '...' 占位，渲染时禁用点击。
   */
  const pageItems = computed(() => {
    const total = totalPages.value
    const current = currentPage.value
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

    const items = [1]
    const left = Math.max(2, current - 1)
    const right = Math.min(total - 1, current + 1)
    if (left > 2) items.push('...')
    for (let page = left; page <= right; page += 1) items.push(page)
    if (right < total - 1) items.push('...')
    items.push(total)
    return items
  })

  // 筛选 / 排序一变就回第 1 页。
  // 不重置的话，新结果可能只有 3 件，而视图还停在第 18 页 —— 用户看到的是空白。
  if (resetToken) {
    watch(resetToken, () => {
      currentPage.value = 1
    })
  }

  // 兜底：条数变少（取消收藏、数据更新、切每页条数）时把越界页码收敛到最后一页
  watch(totalPages, (pages) => {
    if (currentPage.value > pages) currentPage.value = pages
  })

  /** @returns {boolean} 是否真的发生了翻页（供调用方决定要不要滚动） */
  function goPage(page) {
    if (page === '...') return false
    const target = Math.min(Math.max(1, Number(page) || 1), totalPages.value)
    if (target === currentPage.value) return false
    currentPage.value = target
    return true
  }

  /** @returns {boolean} 是否真的切换了每页条数 */
  function setPageSize(size) {
    if (pageSize.value === size) return false
    pageSize.value = size
    currentPage.value = 1
    return true
  }

  return {
    pageSize,
    currentPage,
    totalPages,
    pageStart,
    pageEnd,
    pageItems,
    pagedList,
    goPage,
    setPageSize,
  }
}
