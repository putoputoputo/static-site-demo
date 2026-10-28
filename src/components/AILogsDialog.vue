<template>
  <Teleport to="body">
    <div v-if="open" class="log-backdrop" @click.self="close">
      <div class="log-panel" role="dialog" aria-modal="true" aria-labelledby="ai-log-title">
        <div class="log-head">
          <h2 id="ai-log-title" class="log-title">请求日志</h2>
          <span class="log-count">{{ logs.length }} / {{ MAX_LOGS }}</span>
          <button class="log-close" type="button" aria-label="关闭" @click="close">×</button>
        </div>

        <p class="log-desc">
          每次「开始分析」实际发出的请求与模型原始返回。API Key 已脱敏，图片 base64 只留前缀与体积。
          日志存在本标签页，关掉页面即清空。
        </p>

        <div v-if="!logs.length" class="log-empty">
          <p class="log-empty-title">还没有请求记录</p>
          <span>点一次「开始分析」，这里就会出现完整的请求报文、响应报文与耗时。</span>
        </div>

        <div v-else class="log-main">
          <ul class="log-list">
            <li v-for="log in logs" :key="log.id">
              <button
                class="log-item"
                :class="{ active: log.id === activeId }"
                type="button"
                @click="activeId = log.id"
              >
                <span class="log-time">{{ timeLabel(log) }}</span>
                <span class="log-state" :class="stateOf(log).tone">{{ stateOf(log).label }}</span>
                <span class="log-model" :title="log.model">{{ log.model }}</span>
                <span class="log-cost">{{ costLabel(log) }}</span>
              </button>
            </li>
          </ul>

          <div v-if="active" class="log-detail">
            <div class="log-block">
              <div class="log-block-head">
                <span class="log-block-title">请求</span>
                <span class="log-block-meta">{{ active.request.method }} {{ active.request.url }}</span>
              </div>
              <pre class="log-pre">{{ requestText }}</pre>
            </div>

            <div class="log-block">
              <div class="log-block-head">
                <span class="log-block-title">响应</span>
                <span class="log-block-meta" :class="stateOf(active).tone">{{ responseMeta }}</span>
              </div>
              <pre class="log-pre">{{ responseText }}</pre>
            </div>
          </div>
        </div>

        <div class="log-actions">
          <button v-if="logs.length" class="log-btn ghost" type="button" @click="clearAll">清空日志</button>
          <span class="log-copied">{{ copied ? '已复制到剪贴板' : '' }}</span>
          <button v-if="active" class="log-btn" type="button" @click="copyActive">复制当前日志</button>
          <button class="log-btn primary" type="button" @click="close">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { MAX_LOGS, formatBytes, formatLog } from '../utils/aiLog.js'
import { useAILogs } from '../composables/useAILogs.js'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open'])

const { logs, clear } = useAILogs()

const activeId = ref(logs.value[0]?.id || '')
const copied = ref(false)

const active = computed(() => logs.value.find((log) => log.id === activeId.value) || null)

const timeLabel = (log) => {
  const date = new Date(log.at)
  if (Number.isNaN(date.getTime())) return '--:--:--'
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

const costLabel = (log) => {
  const ms = Number(log.durationMs) || 0
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

// 状态色块：2xx 正常，其余都算异常；没拿到响应的是「没发出去」或超时
function stateOf(log) {
  if (!log.response) {
    if (log.error?.name === 'TimeoutError') return { label: '超时', tone: 'is-bad' }
    return { label: '未发出', tone: 'is-bad' }
  }
  const ok = log.response.status >= 200 && log.response.status < 300
  return { label: String(log.response.status), tone: ok ? 'is-ok' : 'is-bad' }
}

const requestText = computed(() => {
  const log = active.value
  if (!log) return ''
  const lines = [
    `${log.request.method} ${log.request.url}`,
    ...Object.entries(log.request.headers || {}).map(([key, value]) => `${key}: ${value}`),
  ]
  if (log.image) {
    const { width, height, mime, bytes, shrunk } = log.image
    lines.push(
      `# 图片 ${width} × ${height} · ${mime || '未知格式'} · ${formatBytes(bytes)}${shrunk ? '（发送前已压缩）' : ''}`
    )
  }
  lines.push('', log.request.body || '（空请求体）')
  return lines.join('\n')
})

const responseMeta = computed(() => {
  const log = active.value
  if (!log) return ''
  if (!log.response) return `${log.error?.name || 'Error'} · ${costLabel(log)}`
  const status = `HTTP ${log.response.status} ${log.response.statusText || ''}`.trim()
  return `${status} · ${costLabel(log)}`
})

const responseText = computed(() => {
  const log = active.value
  if (!log) return ''
  if (!log.response) {
    return [`请求未完成：${log.error?.name || 'Error'}`, log.error?.message || '无更多信息'].join('\n')
  }
  const lines = [`HTTP ${log.response.status} ${log.response.statusText || ''}`.trim()]
  for (const [key, value] of Object.entries(log.response.headers || {})) {
    lines.push(`${key}: ${value}`)
  }
  lines.push('', log.response.body || '（空响应体）')
  if (log.error) lines.push('', `# 本地判定：${log.error.name} · ${log.error.message}`)
  return lines.join('\n')
})

function close() {
  emit('update:open', false)
}

function clearAll() {
  clear()
  activeId.value = ''
}

async function copyActive() {
  if (!active.value) return
  try {
    await navigator.clipboard.writeText(formatLog(active.value))
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1600)
  } catch {
    copied.value = false
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

// 新记录进来时让选中项跟着走，否则列表刷新后详情区会空着
watch(logs, (next) => {
  if (!next.some((log) => log.id === activeId.value)) activeId.value = next[0]?.id || ''
})

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      window.removeEventListener('keydown', onKeydown)
      return
    }
    activeId.value = logs.value[0]?.id || ''
    copied.value = false
    window.addEventListener('keydown', onKeydown)
    await nextTick()
  }
)

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.log-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.66);
  backdrop-filter: blur(3px);
}

.log-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 900px;
  max-height: calc(100vh - 40px);
  padding: 18px 20px 16px;
  box-sizing: border-box;
  background: #1a1915;
  border: 1px solid #3a3324;
  border-radius: 14px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.6);
}

.log-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}

.log-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #e5e3d8;
}

.log-count {
  padding: 2px 8px;
  font-size: 11px;
  color: #b99a4e;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 999px;
}

.log-close {
  margin-left: auto;
  width: 26px;
  height: 26px;
  font-size: 18px;
  line-height: 1;
  color: #7a7565;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.18s, background 0.18s;
}

.log-close:hover {
  color: #d4af37;
  background: #24211a;
}

.log-desc {
  flex: none;
  margin: 8px 0 12px;
  font-size: 12px;
  line-height: 1.7;
  color: #8a8574;
}

.log-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 240px;
  padding: 24px;
  text-align: center;
  border: 1px dashed #3f3928;
  border-radius: 10px;
  background: #141414;
}

.log-empty-title {
  margin: 0;
  font-size: 14px;
  color: #8a8574;
}

.log-empty span {
  max-width: 380px;
  font-size: 12.5px;
  line-height: 1.8;
  color: #565243;
}

.log-main {
  flex: 1;
  display: flex;
  gap: 14px;
  min-height: 0;
}

.log-list {
  flex: none;
  width: 214px;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-item {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-areas:
    'time state'
    'model cost';
  gap: 2px 8px;
  width: 100%;
  padding: 8px 10px;
  font-family: inherit;
  text-align: left;
  background: #141414;
  border: 1px solid #2e2a20;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s;
}

.log-item:hover,
.log-item.active {
  background: #1f1c15;
  border-color: #6b5c2e;
}

.log-time {
  grid-area: time;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11.5px;
  color: #8a8574;
}

.log-state {
  grid-area: state;
  justify-self: end;
  padding: 0 6px;
  font-size: 10.5px;
  line-height: 15px;
  border-radius: 999px;
}

.log-state.is-ok {
  color: #7fbf8a;
  background: rgba(127, 191, 138, 0.12);
}

.log-state.is-bad {
  color: #e08a8a;
  background: rgba(224, 138, 138, 0.12);
}

.log-model {
  grid-area: model;
  overflow: hidden;
  font-size: 11.5px;
  color: #cfcab8;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.log-cost {
  grid-area: cost;
  justify-self: end;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11px;
  color: #6b6555;
}

.log-detail {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-block {
  flex: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.log-block-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
}

.log-block-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #d4af37;
}

.log-block-meta {
  overflow: hidden;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11px;
  color: #6b6555;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.log-block-meta.is-ok {
  color: #7fbf8a;
}

.log-block-meta.is-bad {
  color: #e08a8a;
}

.log-pre {
  margin: 0;
  padding: 12px;
  max-height: 32vh;
  overflow: auto;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.7;
  color: #cfcab8;
  white-space: pre-wrap;
  word-break: break-word;
  background: #121212;
  border: 1px solid #2e2a20;
  border-radius: 8px;
}

.log-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.log-copied {
  margin-left: auto;
  font-size: 11.5px;
  color: #7fbf8a;
}

.log-btn {
  padding: 8px 16px;
  font-family: inherit;
  font-size: 12.5px;
  color: #d8d3c2;
  background: #202020;
  border: 1px solid #3f3928;
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.18s, background 0.18s, border-color 0.18s;
}

.log-btn:hover {
  color: #d4af37;
  border-color: #6b5c2e;
}

.log-btn.primary {
  color: #121212;
  font-weight: 600;
  background: #d4af37;
  border-color: #d4af37;
}

.log-btn.primary:hover {
  filter: brightness(1.08);
}

.log-btn.ghost {
  margin-right: auto;
  color: #7a7565;
  background: transparent;
  border-color: transparent;
}

.log-btn.ghost:hover {
  color: #e08a8a;
  border-color: rgba(224, 138, 138, 0.3);
}

@media (max-width: 760px) {
  .log-panel {
    padding: 16px 14px 14px;
  }

  .log-main {
    flex-direction: column;
  }

  .log-list {
    width: 100%;
    max-height: 132px;
  }

  .log-pre {
    max-height: 26vh;
  }

  .log-actions {
    flex-wrap: wrap;
  }

  .log-copied {
    order: -1;
    width: 100%;
    margin-left: 0;
  }
}
</style>
