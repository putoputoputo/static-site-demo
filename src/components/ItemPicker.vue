<template>
  <div ref="root" class="item-picker">
    <button class="picker-trigger" type="button" :class="{ empty: !selectedItem }" @click="toggle">
      <span class="trigger-label">{{ selectedItem ? selectedItem.label : placeholder }}</span>
      <span v-if="selectedItem && selectedItem.meta" class="trigger-meta">{{ selectedItem.meta }}</span>
      <el-icon :size="11" class="trigger-icon"><ArrowDown /></el-icon>
    </button>

    <div v-if="open" class="picker-panel">
      <div class="panel-search">
        <el-icon :size="12" color="#6f6a5c"><Search /></el-icon>
        <input
          ref="inputRef"
          v-model="query"
          class="panel-input"
          type="text"
          :placeholder="searchPlaceholder"
          @keydown.enter.prevent="pickFirst"
          @keydown.esc.prevent="close"
        />
        <button v-if="query" class="panel-clear" type="button" @click="query = ''">×</button>
      </div>

      <div class="panel-list">
        <button
          v-for="item in results"
          :key="item.value"
          type="button"
          class="panel-row"
          :class="{ current: item.value === modelValue }"
          @click="pick(item)"
        >
          <span class="row-label">{{ item.label }}</span>
          <span v-if="item.meta" class="row-meta">{{ item.meta }}</span>
          <span v-if="item.value === modelValue" class="row-flag">当前</span>
        </button>
        <p v-if="!results.length" class="panel-empty">{{ emptyText }}</p>
      </div>

      <div class="panel-foot">
        <span class="foot-count">
          <template v-if="total > results.length">共 {{ total }} 项，输入关键词缩小范围</template>
          <template v-else>共 {{ total }} 项</template>
        </span>
        <button v-if="modelValue" class="foot-btn" type="button" @click="clear">清空</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowDown, Search } from '@element-plus/icons-vue'

// 一个轻量的「搜索 + 结果列表」选择器。
//
// 为什么不用 el-select：这里最长的列表是 480 件武器，el-select 会把 480 个
// el-option 全渲染进 DOM，展开一次就卡一下；而实际使用中玩家都是输入两个字
// 再挑，不需要把选项全部铺在 DOM 里。只渲染最多 maxResults 条更省。
//
// 单选用 v-model；多选场景（法术）传 modelValue="" 并监听 pick 事件自己维护数组。

const props = defineProps({
  items: { type: Array, default: () => [] },
  modelValue: { type: [String, Number], default: '' },
  placeholder: { type: String, default: '选择…' },
  searchPlaceholder: { type: String, default: '输入名称搜索' },
  emptyText: { type: String, default: '没有匹配的项' },
  maxResults: { type: Number, default: 24 },
})

const emit = defineEmits(['update:modelValue', 'pick'])

const root = ref(null)
const inputRef = ref(null)
const open = ref(false)
const query = ref('')

const selectedItem = computed(() => props.items.find((item) => item.value === props.modelValue) || null)

const results = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  const pool = keyword
    ? props.items.filter((item) => String(item.search || `${item.label} ${item.meta || ''}`).toLowerCase().includes(keyword))
    : props.items
  return pool.slice(0, props.maxResults)
})

const total = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return props.items.length
  return props.items.filter((item) => String(item.search || `${item.label} ${item.meta || ''}`).toLowerCase().includes(keyword)).length
})

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
  query.value = ''
}

function pick(item) {
  emit('update:modelValue', item.value)
  emit('pick', item)
  close()
}

function pickFirst() {
  if (results.value.length) pick(results.value[0])
}

function clear() {
  emit('update:modelValue', '')
  emit('pick', null)
  close()
}

// 展开后聚焦搜索框，玩家不用再点一次
watch(open, (value) => {
  if (!value) return
  nextTick(() => inputRef.value?.focus())
})

function onPointerDown(event) {
  if (!open.value) return
  if (root.value && !root.value.contains(event.target)) close()
}

onMounted(() => document.addEventListener('pointerdown', onPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))
</script>

<style scoped>
.item-picker {
  position: relative;
}

.picker-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 11px;
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  background: #1a1a1a;
  border: 1px solid #332d20;
  border-radius: 7px;
  transition: border-color 0.18s, background 0.18s;
}

.picker-trigger:hover {
  border-color: #5a4f2c;
  background: #1d1d1d;
}

.picker-trigger.empty .trigger-label {
  color: #5d5849;
}

.trigger-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #d8d2c0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trigger-meta {
  flex-shrink: 0;
  font-size: 11px;
  color: #6f6a5c;
  font-variant-numeric: tabular-nums;
}

.trigger-icon {
  flex-shrink: 0;
  color: #6b6555;
}

.picker-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 40;
  width: 100%;
  min-width: 260px;
  padding: 8px;
  background: #191919;
  border: 1px solid #3a3324;
  border-radius: 9px;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.55);
}

.panel-search {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 9px;
  background: #141414;
  border: 1px solid #322c1f;
  border-radius: 6px;
}

.panel-input {
  flex: 1;
  min-width: 0;
  font-family: inherit;
  font-size: 12.5px;
  color: #e2dcc8;
  background: transparent;
  border: none;
  outline: none;
}

.panel-input::placeholder {
  color: #565143;
}

.panel-clear {
  padding: 0 4px;
  font-size: 14px;
  line-height: 1;
  color: #6f6a5c;
  cursor: pointer;
  background: transparent;
  border: none;
}

.panel-clear:hover {
  color: #d4af37;
}

.panel-list {
  max-height: 268px;
  margin-top: 6px;
  overflow-y: auto;
}

.panel-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  padding: 7px 9px;
  font-family: inherit;
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 5px;
  transition: background 0.14s;
}

.panel-row:hover {
  background: rgba(212, 175, 55, 0.1);
}

.panel-row.current {
  background: rgba(212, 175, 55, 0.07);
}

.row-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #cfc9b8;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-row.current .row-label {
  color: #d4af37;
}

.row-meta {
  flex-shrink: 0;
  font-size: 11px;
  color: #6f6a5c;
  font-variant-numeric: tabular-nums;
}

.row-flag {
  flex-shrink: 0;
  font-size: 10px;
  color: #8a7440;
  border: 1px solid #4a3f20;
  border-radius: 3px;
  padding: 0 4px;
}

.panel-empty {
  margin: 0;
  padding: 16px 9px;
  font-size: 12px;
  line-height: 1.7;
  color: #5d5849;
}

.panel-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  padding: 6px 4px 0;
  border-top: 1px solid #262119;
}

.foot-count {
  font-size: 10.5px;
  color: #565143;
}

.foot-btn {
  padding: 2px 8px;
  font-family: inherit;
  font-size: 11px;
  color: #8a8574;
  cursor: pointer;
  background: #232323;
  border: 1px solid #3a3324;
  border-radius: 4px;
}

.foot-btn:hover {
  color: #d4af37;
  border-color: rgba(212, 175, 55, 0.4);
}
</style>
