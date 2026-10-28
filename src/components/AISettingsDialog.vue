<template>
  <Teleport to="body">
    <div v-if="open" class="ai-backdrop" @click.self="close">
      <div class="ai-panel" role="dialog" aria-modal="true" aria-labelledby="ai-panel-title">
        <div class="ai-head">
          <h2 id="ai-panel-title" class="ai-title">选择模型</h2>
          <button class="ai-close" type="button" aria-label="关闭" @click="close">×</button>
        </div>

        <p class="ai-desc">
          填写接口地址、API Key 与模型名，保存后才能开始分析。配置只存在这台设备的浏览器里。
        </p>

        <label class="ai-field">
          <span class="ai-label">接口地址（URL）</span>
          <input
            ref="firstInput"
            v-model="draft.baseUrl"
            class="ai-input"
            type="url"
            inputmode="url"
            spellcheck="false"
            :placeholder="BASE_URL_EXAMPLE"
            @keydown.enter.prevent="submit"
          />
        </label>

        <label class="ai-field">
          <span class="ai-label">API Key</span>
          <span class="ai-secret">
            <input
              v-model="draft.apiKey"
              class="ai-input"
              :type="revealed ? 'text' : 'password'"
              spellcheck="false"
              autocomplete="off"
              placeholder="sk-..."
              @keydown.enter.prevent="submit"
            />
            <button class="ai-eye" type="button" @click="revealed = !revealed">
              {{ revealed ? '隐藏' : '显示' }}
            </button>
          </span>
        </label>

        <label class="ai-field">
          <span class="ai-label">模型名</span>
          <input
            v-model="draft.model"
            class="ai-input"
            type="text"
            spellcheck="false"
            :placeholder="MODEL_EXAMPLE"
            @keydown.enter.prevent="submit"
          />
        </label>

        <p v-if="error" class="ai-error">{{ error }}</p>
        <p v-else class="ai-hint">
          需要支持图片输入的模型。配置会以明文存在本机 localStorage，公用电脑上用完记得清除。
        </p>

        <div class="ai-actions">
          <button v-if="hasSaved" class="ai-btn ghost" type="button" @click="clearAll">清除配置</button>
          <button class="ai-btn" type="button" @click="close">取消</button>
          <button class="ai-btn primary" type="button" @click="submit">保存</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { BASE_URL_EXAMPLE, MODEL_EXAMPLE } from '../config/ai'
import { EMPTY_SETTINGS, useAISettings, validateSettings } from '../composables/useAISettings'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'saved'])

const { settings, isReady, save, clear } = useAISettings()

const draft = ref({ ...EMPTY_SETTINGS })
const error = ref('')
const revealed = ref(false)
const firstInput = ref(null)

const hasSaved = computed(() => isReady.value)

function close() {
  emit('update:open', false)
}

function submit() {
  // 弹窗内先校验，别让「保存」把半截配置写进存储
  const message = validateSettings(draft.value)
  if (message) {
    error.value = message
    return
  }
  const saved = save(draft.value)
  if (saved) {
    error.value = saved
    return
  }
  error.value = ''
  emit('saved')
  close()
}

function clearAll() {
  clear()
  draft.value = { ...EMPTY_SETTINGS }
  error.value = ''
  emit('saved')
  close()
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      window.removeEventListener('keydown', onKeydown)
      return
    }
    draft.value = { ...settings.value }
    error.value = ''
    revealed.value = false
    window.addEventListener('keydown', onKeydown)
    await nextTick()
    firstInput.value?.focus()
  }
)

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.ai-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(3px);
}

.ai-panel {
  width: 100%;
  max-width: 460px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 20px 22px 18px;
  box-sizing: border-box;
  background: #1a1915;
  border: 1px solid #3a3324;
  border-radius: 14px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.6);
}

.ai-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #e5e3d8;
}

.ai-close {
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

.ai-close:hover {
  color: #d4af37;
  background: #24211a;
}

.ai-desc {
  margin: 10px 0 16px;
  font-size: 12.5px;
  line-height: 1.75;
  color: #8a8574;
}

.ai-field {
  display: block;
  margin-bottom: 14px;
}

.ai-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12.5px;
  color: #b8b2a0;
}

.ai-input {
  display: block;
  width: 100%;
  padding: 9px 11px;
  box-sizing: border-box;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12.5px;
  color: #e8e2cf;
  background: #141414;
  border: 1px solid #3a3324;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.18s;
}

.ai-input:focus {
  border-color: #8a7434;
}

.ai-input::placeholder {
  color: #565040;
}

.ai-secret {
  position: relative;
  display: block;
}

.ai-secret .ai-input {
  padding-right: 58px;
}

.ai-eye {
  position: absolute;
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
  padding: 3px 8px;
  font-family: inherit;
  font-size: 11.5px;
  color: #8a8574;
  background: #232323;
  border: 1px solid #383225;
  border-radius: 5px;
  cursor: pointer;
}

.ai-eye:hover {
  color: #d4af37;
}

.ai-error,
.ai-hint {
  margin: 4px 0 16px;
  font-size: 12px;
  line-height: 1.7;
}

.ai-error {
  color: #e08a8a;
}

.ai-hint {
  color: #6b6555;
}

.ai-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.ai-btn {
  padding: 8px 18px;
  font-family: inherit;
  font-size: 13px;
  color: #d8d3c2;
  background: #202020;
  border: 1px solid #3f3928;
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.18s, background 0.18s, border-color 0.18s;
}

.ai-btn:hover {
  color: #d4af37;
  border-color: #6b5c2e;
}

.ai-btn.primary {
  color: #121212;
  font-weight: 600;
  background: #d4af37;
  border-color: #d4af37;
}

.ai-btn.primary:hover {
  filter: brightness(1.08);
}

.ai-btn.ghost {
  margin-right: auto;
  color: #7a7565;
  background: transparent;
  border-color: transparent;
}

.ai-btn.ghost:hover {
  color: #e08a8a;
  border-color: rgba(224, 138, 138, 0.3);
}

@media (max-width: 600px) {
  .ai-panel {
    padding: 18px 16px 16px;
  }

  .ai-btn {
    padding: 8px 14px;
  }
}
</style>
