<template>
  <nav class="pager" aria-label="列表分页">
    <div v-if="pageSize" class="pager-main">
      <button class="pager-step" :disabled="currentPage <= 1" @click="emit('change-page', currentPage - 1)">
        上一页
      </button>
      <button
        v-for="(item, index) in pageItems"
        :key="`${item}-${index}`"
        class="pager-num"
        :class="{ active: item === currentPage, gap: item === '...' }"
        :disabled="item === '...'"
        :aria-current="item === currentPage ? 'page' : undefined"
        @click="emit('change-page', item)"
      >
        {{ item }}
      </button>
      <button class="pager-step" :disabled="currentPage >= totalPages" @click="emit('change-page', currentPage + 1)">
        下一页
      </button>
    </div>
    <span v-else class="pager-all">已在同一页展示全部 {{ total }} {{ unit }}</span>

    <div class="pager-size">
      <span class="pager-label">每页</span>
      <button
        v-for="option in pageSizeOptions"
        :key="option.value"
        class="size-chip"
        :class="{ active: pageSize === option.value }"
        @click="emit('change-size', option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  pageSize: { type: Number, required: true },
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  pageItems: { type: Array, required: true },
  pageSizeOptions: { type: Array, required: true },
  total: { type: Number, default: 0 },
  unit: { type: String, default: '条' },
})

const emit = defineEmits(['change-page', 'change-size'])
</script>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 16px;
  border: 1px solid #302b1f;
  border-radius: 10px;
  background: #1a1a1a;
}

.pager-main {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.pager-step,
.pager-num {
  min-width: 34px;
  height: 32px;
  padding: 0 10px;
  font-size: 13px;
  color: #b8b2a0;
  background: #202020;
  border: 1px solid #383225;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s;
}

.pager-step:hover:not(:disabled),
.pager-num:hover:not(:disabled) {
  color: #d4af37;
  border-color: #6b5c2e;
}

.pager-step:disabled,
.pager-num:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pager-num.active {
  color: #121212;
  font-weight: 600;
  background: #d4af37;
  border-color: #d4af37;
}

.pager-num.gap {
  background: transparent;
  border-color: transparent;
}

.pager-size {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pager-label {
  font-size: 12px;
  color: #8a8574;
}

.size-chip {
  min-width: 46px;
  padding: 4px 10px;
  font-size: 12px;
  color: #b8b2a0;
  background: #202020;
  border: 1px solid #383225;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.18s;
}

.size-chip:hover {
  color: #d4af37;
  border-color: #6b5c2e;
}

.size-chip.active {
  color: #121212;
  font-weight: 600;
  background: #d4af37;
  border-color: #d4af37;
}

.pager-all {
  font-size: 12.5px;
  color: #8a8574;
}

@media (max-width: 680px) {
  .pager {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
