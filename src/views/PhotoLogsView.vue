<template>
  <div class="logs-page">
    <div class="logs-head">
      <RouterLink to="/photo" class="back-link">
        <el-icon :size="14"><ArrowLeft /></el-icon>
        返回摄影板块
      </RouterLink>
      <h1>请求日志</h1>
      <p>
        每次「开始分析」实际发出的请求与模型原始返回。API Key 已脱敏，图片 base64 只留前缀与体积；
        日志保存在这台设备的浏览器里，刷新、关掉浏览器都还在，直到你手动清理。
      </p>
    </div>

    <div v-if="!logs.length" class="empty">
      <p class="empty-title">还没有请求记录</p>
      <span>回到摄影板块点一次「开始分析」，这里就会出现完整的请求报文、响应报文与耗时。</span>
      <RouterLink to="/photo" class="empty-btn">去分析一张</RouterLink>
    </div>

    <template v-else>
      <div class="toolbar">
        <span class="toolbar-count">共 {{ logs.length }} 条 · 最多保留最近 {{ MAX_LOGS }} 条</span>
        <span class="toolbar-copied">{{ copied ? '已复制到剪贴板' : '' }}</span>
        <button class="tool-btn" type="button" :disabled="!active" @click="copyActive">复制当前日志</button>
        <button
          class="tool-btn danger"
          :class="{ 'is-confirming': confirming }"
          type="button"
          @click="requestClear"
        >
          {{ confirming ? `确认清理 ${logs.length} 条？` : '清理日志' }}
        </button>
      </div>

      <div class="logs-main">
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

      <div class="foot-note">
        <span>
          日志存在这台设备的 <code>localStorage</code>，不会上传；换浏览器或换设备看不到。
          公用电脑用完请及时清理，清理后不可恢复。
        </span>
        <button
          class="tool-btn danger"
          :class="{ 'is-confirming': confirming }"
          type="button"
          @click="requestClear"
        >
          {{ confirming ? '确认清理？' : '清理日志' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { MAX_LOGS, formatBytes, formatLog } from '../utils/aiLog.js'
import { useAILogs } from '../composables/useAILogs.js'

const { logs, clear } = useAILogs()

const activeId = ref(logs.value[0]?.id || '')
const copied = ref(false)
const confirming = ref(false)

let confirmTimer = null

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

function clearAll() {
  clear()
  activeId.value = ''
  copied.value = false
}

// 日志已经持久化，清掉就是永久丢失，所以做成两步确认。
// 4 秒内没点第二次自动退回，避免按钮一直悬在「确认」状态被误点。
function requestClear() {
  if (!confirming.value) {
    confirming.value = true
    clearTimeout(confirmTimer)
    confirmTimer = setTimeout(() => {
      confirming.value = false
    }, 4000)
    return
  }
  clearTimeout(confirmTimer)
  confirming.value = false
  clearAll()
}

onBeforeUnmount(() => {
  clearTimeout(confirmTimer)
})

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

// 清空或新记录进来后，选中项要跟着收敛，否则详情区会空着
watch(logs, (next) => {
  if (!next.some((log) => log.id === activeId.value)) activeId.value = next[0]?.id || ''
})
</script>

<style scoped>
.logs-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 8px 0 0;
}

.logs-head {
  margin-bottom: 20px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 14px;
  font-size: 12.5px;
  color: #8a8574;
  text-decoration: none;
  transition: color 0.18s;
}

.back-link:hover {
  color: #d4af37;
}

.logs-head h1 {
  margin: 0 0 10px;
  font-size: 26px;
  letter-spacing: 3px;
  color: #d4af37;
}

.logs-head p {
  margin: 0;
  max-width: 720px;
  font-size: 13px;
  line-height: 1.85;
  color: #8a8574;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 300px;
  padding: 32px;
  text-align: center;
  background: #1a1a1a;
  border: 1px dashed #3f3928;
  border-radius: 14px;
}

.empty-title {
  margin: 0;
  font-size: 15px;
  color: #b8b2a0;
}

.empty span {
  max-width: 420px;
  font-size: 12.5px;
  line-height: 1.85;
  color: #565243;
}

.empty-btn {
  margin-top: 6px;
  padding: 8px 18px;
  font-size: 13px;
  color: #121212;
  font-weight: 600;
  text-decoration: none;
  background: #d4af37;
  border-radius: 8px;
  transition: filter 0.18s;
}

.empty-btn:hover {
  filter: brightness(1.08);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.toolbar-count {
  font-size: 12px;
  color: #6b6555;
}

.toolbar-copied {
  margin-left: auto;
  font-size: 11.5px;
  color: #7fbf8a;
}

.tool-btn {
  padding: 7px 15px;
  font-family: inherit;
  font-size: 12.5px;
  color: #d8d3c2;
  background: #202020;
  border: 1px solid #3f3928;
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.18s, background 0.18s, border-color 0.18s;
}

.tool-btn:hover:not(:disabled) {
  color: #d4af37;
  border-color: #6b5c2e;
}

.tool-btn:disabled {
  color: #5c5749;
  border-color: #2e2a20;
  cursor: not-allowed;
}

.tool-btn.ghost {
  color: #7a7565;
  background: transparent;
  border-color: transparent;
}

.tool-btn.ghost:hover {
  color: #e08a8a;
  border-color: rgba(224, 138, 138, 0.3);
}

.tool-btn.danger {
  color: #b08a8a;
  background: transparent;
  border-color: rgba(224, 138, 138, 0.28);
}

.tool-btn.danger:hover:not(:disabled) {
  color: #e08a8a;
  border-color: rgba(224, 138, 138, 0.55);
}

.tool-btn.is-confirming,
.tool-btn.is-confirming:hover:not(:disabled) {
  color: #16120f;
  font-weight: 600;
  background: #e08a8a;
  border-color: #e08a8a;
}

.foot-note {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 18px;
  padding-top: 14px;
  font-size: 12px;
  line-height: 1.85;
  color: #6b6555;
  border-top: 1px dashed #332d20;
}

.foot-note span {
  flex: 1;
}

.foot-note code {
  padding: 1px 4px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11.5px;
  color: #b99a4e;
  background: #141414;
  border-radius: 3px;
}

.logs-main {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.log-list {
  flex: none;
  width: 236px;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.log-item {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-areas:
    'time state'
    'model cost';
  gap: 2px 8px;
  width: 100%;
  padding: 9px 11px;
  font-family: inherit;
  text-align: left;
  background: #171717;
  border: 1px solid #2e2a20;
  border-radius: 9px;
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
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: #1a1a1a;
  border: 1px solid #3a3324;
  border-radius: 14px;
}

.log-block-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 7px;
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
  max-height: 34vh;
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

@media (max-width: 860px) {
  .logs-page {
    padding: 4px 0 0;
  }

  .logs-head h1 {
    font-size: 21px;
  }

  .logs-main {
    flex-direction: column;
  }

  .log-list {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .log-list li {
    flex: none;
    width: 180px;
  }

  .log-detail {
    width: 100%;
    box-sizing: border-box;
  }

  .log-pre {
    max-height: 28vh;
  }

  .toolbar {
    flex-wrap: wrap;
  }

  .toolbar-copied {
    order: -1;
    width: 100%;
    margin-left: 0;
  }

  .foot-note {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
