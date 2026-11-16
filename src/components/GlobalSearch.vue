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
        <el-icon :size="16" color="var(--accent)"><Search /></el-icon>
        <input
          ref="inputRef"
          v-model="keyword"
          class="dialog-input"
          type="text"
          :placeholder="placeholderText"
          @keydown.enter.prevent="openFirst"
          @keydown.esc="visible = false"
        />
        <button v-if="keyword" class="clear-btn" type="button" @click="keyword = ''">清空</button>
      </div>

      <div class="dialog-body">
        <template v-if="keyword.trim()">
          <p v-if="!scopedGroups.length" class="empty-tip">
            没有匹配「{{ keyword.trim() }}」的内容，{{ emptyHint }}
          </p>
          <section v-for="group in scopedGroups" :key="group.group" class="result-group">
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
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'

const visible = ref(false)
const keyword = ref('')
const groups = ref([])
const indexSize = ref(0)
const inputRef = ref(null)
const router = useRouter()
const route = useRoute()

// 三个板块共用一份索引，但结果要按板块筛：在旅游页搜「故宫」不该跳出法环的武器，
// 推荐词也得分开给，否则点一个词得到空结果，体感像搜索坏了
const inPbz = computed(() => route.path.startsWith('/pbz'))
const inTravel = computed(() => route.path.startsWith('/travel'))

const placeholderText = computed(() => {
  if (inTravel.value) return '搜北京的景点、门票、预约、经典路线…'
  if (inPbz.value) return '搜影之刃零的流程、武器、影之武装、流派、BOSS…'
  return '搜武器、护符、魔法、祷告、骨灰、支线、BOSS、区域、追忆…'
})

const suggestions = computed(() => {
  if (inTravel.value) return ['故宫', '长城', '需要预约', '春节', '三天']
  if (inPbz.value) return ['流程', '锁镰', '招架', '换刀', '悲泣溪谷']
  return ['月隐', '猩红', '拉塔恩', '追忆', '出血', '神圣']
})

const emptyHint = computed(() => {
  if (inTravel.value) return '试试「故宫」「长城」「免费」，或直接搜「三天」「春节」找路线。'
  if (inPbz.value) return '试试更短的关键词，比如「残钢」「招架」「召唤」，或直接搜章节名与区域名。'
  return '试试更短的关键词，比如「月隐」「猩红」「拉塔恩」。'
})

// 只显示当前板块的分组：索引是同一份，不筛的话旅游页会搜出法环的武器
const scopedGroups = computed(() => {
  if (inTravel.value) return groups.value.filter((group) => group.group.startsWith('travel'))
  if (inPbz.value) return groups.value.filter((group) => group.group.startsWith('pbz'))
  return groups.value.filter((group) => !group.group.startsWith('pbz') && !group.group.startsWith('travel'))
})

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
  const first = scopedGroups.value[0]?.items?.[0]
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
  color: var(--fg-3);
  cursor: pointer;
  background: var(--surface);
  border: 1px solid color-mix(in srgb, var(--accent) 13%, transparent);
  border-radius: 6px;
  transition: color 0.2s, border-color 0.2s;
}

.search-trigger:hover {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
}

.trigger-kbd {
  padding: 1px 5px;
  font-family: inherit;
  font-size: 10.5px;
  color: var(--fg-4);
  background: var(--surface-3);
  border: 1px solid color-mix(in srgb, var(--accent) 13%, transparent);
  border-radius: 3px;
}

.dialog-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 8%, transparent);
}

.dialog-input {
  flex: 1;
  font-size: 14.5px;
  color: color-mix(in srgb, #e8d9a8 var(--tone-mix), var(--fg));
  background: transparent;
  border: none;
  outline: none;
}

.dialog-input::placeholder {
  color: var(--fg-4);
}

.clear-btn {
  padding: 2px 8px;
  font-size: 11.5px;
  color: var(--fg-3);
  cursor: pointer;
  background: var(--surface-3);
  border: 1px solid color-mix(in srgb, var(--accent) 13%, transparent);
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
  color: var(--accent);
  letter-spacing: 1px;
}

.group-total {
  font-size: 11px;
  color: var(--fg-4);
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
  background: color-mix(in srgb, var(--accent) 9%, transparent);
}

.result-name {
  font-size: 13.5px;
  color: var(--fg-2);
}

.result-sub {
  font-size: 11.5px;
  color: var(--fg-4);
}

.empty-tip {
  margin: 16px 0;
  font-size: 12.5px;
  line-height: 1.8;
  color: var(--fg-3);
}

.hint-label {
  margin: 4px 0 8px;
  font-size: 12px;
  color: var(--fg-4);
}

.hint-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hint-chip {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--fg-3);
  cursor: pointer;
  background: var(--surface-2);
  border: 1px solid color-mix(in srgb, var(--accent) 13%, transparent);
  border-radius: 999px;
}

.hint-chip:hover {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
}

.hint-foot {
  margin: 16px 0 0;
  font-size: 11.5px;
  color: var(--fg-4);
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
