<template>
  <div class="global-search">
    <button class="search-trigger" type="button" @click="open">
      <el-icon :size="14"><Search /></el-icon>
      <span class="trigger-text">全站搜索</span>
      <kbd class="trigger-kbd">{{ shortcutLabel }}</kbd>
    </button>

    <el-dialog
      v-model="visible"
      width="640px"
      class="search-dialog"
      :show-close="false"
      align-center
      append-to-body
      @opened="focusInput"
    >
      <div class="dialog-head">
        <el-icon :size="16" color="#d4af37"><Search /></el-icon>
        <input
          ref="inputRef"
          v-model="keyword"
          class="dialog-input"
          type="text"
          placeholder="搜武器、护符、魔法、祷告、骨灰、支线、BOSS、区域、追忆…"
          @keydown.enter.prevent="openFirst"
          @keydown.esc="visible = false"
        />
        <button v-if="keyword" class="clear-btn" type="button" @click="keyword = ''">清空</button>
      </div>

      <div class="dialog-body">
        <template v-if="keyword.trim()">
          <p v-if="!groups.length" class="empty-tip">
            没有匹配「{{ keyword.trim() }}」的内容，试试更短的关键词，比如「月隐」「猩红」「拉塔恩」。
          </p>
          <section v-for="group in groups" :key="group.group" class="result-group">
            <div class="group-head">
              <span class="group-label">{{ group.label }}</span>
              <span class="group-total">{{ group.total }} 条{{ group.total > group.items.length ? `，显示前 ${group.items.length}` : '' }}</span>
            </div>
            <RouterLink
              v-for="item in group.items"
              :key="item.to + item.name"
              :to="item.to"
              class="result-row"
              @click="visible = false"
            >
              <span class="result-name">{{ item.name }}</span>
              <span class="result-sub">{{ item.sub }}</span>
            </RouterLink>
          </section>
        </template>

        <template v-else>
          <p class="hint-label">试试这些</p>
          <div class="hint-chips">
            <button v-for="word in suggestions" :key="word" class="hint-chip" type="button" @click="keyword = word">
              {{ word }}
            </button>
          </div>
          <p class="hint-foot">已索引 {{ indexSize }} 条内容，回车直接打开第一条结果</p>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'

const visible = ref(false)
const keyword = ref('')
const groups = ref([])
const indexSize = ref(0)
const inputRef = ref(null)
const router = useRouter()

const suggestions = ['月隐', '猩红', '拉塔恩', '追忆', '出血', '神圣']

// 搜索索引要读全部数据（约 1150 条），改成首次打开时才 import，
// 否则首页会连带下载 quests / weapons 两个大 chunk
let searchModule = null
let ready = false

// SSR 阶段没有 navigator，先按 Windows 的写法渲染，挂载后再看平台
const shortcutLabel = computed(() =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent || '') ? '⌘K' : 'Ctrl K'
)

async function ensureReady() {
  if (ready) return
  searchModule = await import('../utils/search')
  indexSize.value = searchModule.searchIndexSize()
  ready = true
}

async function open() {
  visible.value = true
  await ensureReady()
  if (keyword.value) run()
}

function focusInput() {
  inputRef.value?.focus()
}

function run() {
  groups.value = searchModule ? searchModule.searchAll(keyword.value) : []
}

let timer = null
watch(keyword, () => {
  clearTimeout(timer)
  timer = setTimeout(run, 90)
})

function openFirst() {
  const first = groups.value[0]?.items?.[0]
  if (!first) return
  visible.value = false
  router.push(first.to)
}

function onKeydown(event) {
  const isCombo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
  if (!isCombo) return
  event.preventDefault()
  visible.value ? (visible.value = false) : open()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  clearTimeout(timer)
})
</script>

<style scoped>
.search-trigger {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  font-size: 12.5px;
  color: #9c9686;
  cursor: pointer;
  background: #1b1b1b;
  border: 1px solid #332d20;
  border-radius: 6px;
  transition: color 0.2s, border-color 0.2s;
}

.search-trigger:hover {
  color: #d4af37;
  border-color: rgba(212, 175, 55, 0.45);
}

.trigger-kbd {
  padding: 1px 5px;
  font-family: inherit;
  font-size: 10.5px;
  color: #6f6a5c;
  background: #232323;
  border: 1px solid #383225;
  border-radius: 3px;
}

.dialog-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid #302b22;
}

.dialog-input {
  flex: 1;
  font-size: 14.5px;
  color: #e8d9a8;
  background: transparent;
  border: none;
  outline: none;
}

.dialog-input::placeholder {
  color: #5d5849;
}

.clear-btn {
  padding: 2px 8px;
  font-size: 11.5px;
  color: #8a8574;
  cursor: pointer;
  background: #242424;
  border: 1px solid #383225;
  border-radius: 4px;
}

.dialog-body {
  max-height: 60vh;
  padding-top: 12px;
  overflow-y: auto;
}

.result-group + .result-group {
  margin-top: 14px;
}

.group-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}

.group-label {
  font-size: 12px;
  color: #d4af37;
  letter-spacing: 1px;
}

.group-total {
  font-size: 11px;
  color: #6f6a5c;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 5px;
  text-decoration: none;
  transition: background 0.15s;
}

.result-row:hover {
  background: rgba(212, 175, 55, 0.09);
}

.result-name {
  font-size: 13.5px;
  color: #cfc9b8;
}

.result-sub {
  font-size: 11.5px;
  color: #6f6a5c;
}

.empty-tip {
  margin: 16px 0;
  font-size: 12.5px;
  line-height: 1.8;
  color: #8a8574;
}

.hint-label {
  margin: 4px 0 8px;
  font-size: 12px;
  color: #6f6a5c;
}

.hint-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hint-chip {
  padding: 4px 10px;
  font-size: 12px;
  color: #9c9686;
  cursor: pointer;
  background: #1e1e1e;
  border: 1px solid #332d20;
  border-radius: 999px;
}

.hint-chip:hover {
  color: #d4af37;
  border-color: rgba(212, 175, 55, 0.45);
}

.hint-foot {
  margin: 16px 0 0;
  font-size: 11.5px;
  color: #5d5849;
}

@media (max-width: 680px) {
  .trigger-text,
  .trigger-kbd {
    display: none;
  }

  .search-trigger {
    padding: 6px 8px;
  }
}
</style>
