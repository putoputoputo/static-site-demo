<template>
  <div ref="wrapRef" class="theme-picker">
    <button
      type="button"
      class="theme-btn"
      :aria-expanded="open"
      aria-label="更换主题"
      title="更换主题（底色与强调色）"
      @click="toggle"
    >
      <span class="theme-dot" :style="{ background: currentHex }"></span>
    </button>

    <div v-if="open" class="theme-panel" role="dialog" aria-label="主题色">
      <div class="theme-panel-head">
        <strong>主题</strong>
        <span class="theme-now">{{ currentHex }}</span>
      </div>

      <!-- 底色：深色 / 浅色。换的是背景与文字两级，强调色自动跟着调整 -->
      <div class="mode-row">
        <button
          v-for="item in modes"
          :key="item.id"
          type="button"
          class="mode-btn"
          :class="{ on: item.id === mode }"
          @click="pickMode(item.id)"
        >
          <span class="mode-swatch" :class="item.id"></span>
          <span>{{ item.name }}</span>
        </button>
      </div>

      <!-- 预设：常用配色，点一下立刻生效 -->
      <div class="preset-grid">
        <button
          v-for="preset in presets"
          :key="preset.id"
          type="button"
          class="preset"
          :class="{ on: preset.hex === currentHex }"
          @click="pick(preset.hex)"
        >
          <span class="preset-dot" :style="{ background: preset.hex }"></span>
          <span class="preset-name">{{ preset.name }}</span>
        </button>
      </div>

      <!-- 自定义：取色器 + 十六进制输入，两条路都能用 -->
      <div class="custom-row">
        <label class="custom-label">
          <span>自定义</span>
          <input type="color" class="color-input" :value="currentHex" @input="onColorInput" />
        </label>
        <input
          v-model="hexInput"
          class="hex-input"
          spellcheck="false"
          maxlength="7"
          placeholder="#6f9e7a"
          @keyup.enter="applyHexInput"
          @blur="applyHexInput"
        />
        <button type="button" class="apply-btn" @click="applyHexInput">应用</button>
      </div>

      <p class="theme-hint" :class="hintLevel">{{ hint }}</p>
      <p v-if="hexError" class="theme-error">{{ hexError }}</p>

      <div class="panel-foot">
        <button type="button" class="foot-btn" @click="reset">恢复默认</button>
        <button type="button" class="foot-btn ghost" @click="open = false">收起</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  DEFAULT_ACCENT,
  THEME_MODES,
  THEME_PRESETS,
  accentTokens,
  applyAccent,
  applyMode,
  clearAccent,
  contrastHint,
  loadAccent,
  loadMode,
  normalizeHex,
  saveAccent,
  saveMode,
} from '../utils/theme'

const presets = THEME_PRESETS
const modes = THEME_MODES
const currentHex = ref(loadAccent())
const mode = ref(loadMode())
const hexInput = ref(currentHex.value)
const hexError = ref('')
const open = ref(false)
const wrapRef = ref(null)

const hint = computed(() => contrastHint(currentHex.value, mode.value))
// ok / warn / bad 由主题模块按对比度判定，这里只负责给 CSS 挂类名
const hintLevel = computed(() => accentTokens(currentHex.value, mode.value).level)

const apply = (hex) => {
  const norm = normalizeHex(hex)
  if (!norm) return false
  currentHex.value = norm
  hexInput.value = norm
  hexError.value = ''
  applyAccent(norm)
  saveAccent(norm)
  return true
}

const pick = (hex) => apply(hex)

// 换底色只改 <html data-theme>，CSS 里两套 token 自动切换，不用重算颜色
const pickMode = (id) => {
  mode.value = applyMode(id)
  saveMode(mode.value)
}

const onColorInput = (event) => apply(event.target.value)

const applyHexInput = () => {
  const raw = String(hexInput.value || '').trim()
  if (!raw) return
  if (!normalizeHex(raw)) {
    hexError.value = '要写成 #aabbcc 或 #abc 这样的十六进制色值'
    hexInput.value = currentHex.value
    return
  }
  apply(raw)
}

const reset = () => {
  clearAccent()
  apply(DEFAULT_ACCENT)
}

const toggle = () => {
  open.value = !open.value
  if (open.value) hexInput.value = currentHex.value
}

// 点面板外面或按 Esc 收起
const onDocClick = (event) => {
  if (!open.value) return
  const wrap = wrapRef.value
  if (wrap && !wrap.contains(event.target)) open.value = false
}
const onKeydown = (event) => {
  if (event.key === 'Escape') open.value = false
}
// 另一个标签页改了色，这边跟着变
const onStorage = (event) => {
  if (!event.key) return
  if (event.key === 'myplan.theme.mode') {
    mode.value = loadMode()
    applyMode(mode.value)
    return
  }
  if (event.key !== 'myplan.theme.accent') return
  currentHex.value = loadAccent()
  hexInput.value = currentHex.value
  applyAccent(currentHex.value)
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('storage', onStorage)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('storage', onStorage)
})
</script>

<style scoped>
.theme-picker {
  position: relative;
  display: flex;
  align-items: center;
  flex: none;
}

.theme-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent);
  background: var(--veil);
  cursor: pointer;
}

.theme-btn:hover {
  background: color-mix(in srgb, var(--accent) 14%, transparent);
}

.theme-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 0 8px var(--accent);
}

.theme-panel {
  position: absolute;
  top: 36px;
  right: 0;
  z-index: 130;
  width: 268px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent);
  background: var(--surface);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.6);
}

.theme-panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.theme-panel-head strong {
  font-size: 13px;
  color: var(--fg);
}

.theme-now {
  font-size: 11px;
  color: var(--fg-3);
  font-family: 'Consolas', 'Courier New', monospace;
}

.mode-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 7px 6px;
  font-size: 12px;
  color: var(--fg-2);
  background: var(--veil);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
}

.mode-btn:hover {
  background: var(--veil-strong);
}

.mode-btn.on {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 38%, transparent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
}

/* 色块本身固定成对应底色的样子，不跟当前主题走，否则选了浅色后两块长得一样 */
.mode-swatch {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 1px solid var(--line);
}

.mode-swatch.dark {
  background: #121212;
}

.mode-swatch.light {
  background: color-mix(in srgb, #f2efe7 var(--tone-mix), var(--fg));
}

.mode-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 7px 6px;
  font-size: 12px;
  color: var(--fg-2);
  background: var(--veil);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
}

.mode-btn:hover {
  background: var(--veil-strong);
}

.mode-btn.on {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 38%, transparent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
}

/* 色块本身固定成对应底色的样子，不跟当前主题走，否则选了浅色后两块长得一样 */
.mode-swatch {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 1px solid var(--line);
}

.mode-swatch.dark {
  background: #121212;
}

.mode-swatch.light {
  background: color-mix(in srgb, #f2efe7 var(--tone-mix), var(--fg));
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.preset {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 7px 4px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: var(--veil);
  cursor: pointer;
}

.preset:hover {
  background: var(--veil-strong);
}

.preset.on {
  border-color: color-mix(in srgb, var(--accent) 38%, transparent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
}

.preset-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
}

.preset-name {
  font-size: 11px;
  color: var(--fg-2);
}

.custom-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.custom-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--fg-2);
}

.color-input {
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.hex-input {
  flex: 1;
  min-width: 0;
  padding: 5px 7px;
  font-size: 12px;
  font-family: 'Consolas', 'Courier New', monospace;
  color: var(--fg);
  background: var(--bg);
  border: 1px solid color-mix(in srgb, var(--accent) 14%, transparent);
  border-radius: 6px;
}

.hex-input:focus {
  outline: none;
  border-color: var(--accent);
}

.apply-btn {
  padding: 5px 9px;
  font-size: 12px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent);
  border-radius: 6px;
  cursor: pointer;
}

.theme-hint {
  margin: 0 0 4px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--fg-3);
}

.theme-hint.warn {
  color: color-mix(in srgb, #d8b06a var(--tone-mix), var(--fg));
}

.theme-hint.bad {
  color: color-mix(in srgb, #d8786a var(--tone-mix), var(--fg));
}

.theme-error {
  margin: 0 0 4px;
  font-size: 11px;
  color: color-mix(in srgb, #d8786a var(--tone-mix), var(--fg));
}

.panel-foot {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid color-mix(in srgb, var(--accent) 14%, transparent);
}

.foot-btn {
  padding: 0;
  font-size: 11px;
  color: var(--fg-2);
  background: none;
  border: none;
  cursor: pointer;
}

.foot-btn:hover {
  color: var(--accent);
}

.foot-btn.ghost {
  color: var(--fg-4);
}
</style>
