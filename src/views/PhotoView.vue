<template>
  <div class="photo">
    <div class="photo-head">
      <h1>摄影板块</h1>
      <p>拍一张，或上传一张已经存下来的画面，交给影像分析</p>
    </div>

    <div class="shoot-panel">
      <div class="stage">
        <img v-if="preview" :src="preview" class="stage-img" alt="待分析图片预览" />
        <div v-else class="stage-empty">
          <el-icon :size="42"><Picture /></el-icon>
          <p class="stage-title">还没有图片</p>
          <span class="stage-sub">用下面的「拍照」直接拍一张，或「上传图片」选一张本地图片</span>
        </div>
      </div>

      <div class="actions">
        <button class="act-btn" type="button" @click="openCamera">
          <el-icon :size="16"><Camera /></el-icon>
          拍照
        </button>
        <button class="act-btn" type="button" @click="openUpload">
          <el-icon :size="16"><UploadFilled /></el-icon>
          上传图片
        </button>
        <button class="act-btn primary" type="button" :disabled="!meta || analyzing" @click="analyze">
          <el-icon :size="16"><MagicStick /></el-icon>
          {{ analyzing ? '分析中…' : '开始分析' }}
        </button>
        <button v-if="meta" class="act-btn ghost" type="button" :disabled="analyzing" @click="reset">清除</button>
      </div>

      <!-- 两个隐藏输入：capture 让手机浏览器直接拉起相机，桌面端会退化成选文件 -->
      <input
        ref="cameraInput"
        class="hidden-input"
        type="file"
        accept="image/*"
        capture="environment"
        @change="onFileChange($event, 'camera')"
      />
      <input
        ref="uploadInput"
        class="hidden-input"
        type="file"
        accept="image/*"
        @change="onFileChange($event, 'upload')"
      />

      <p v-if="error" class="tip is-error">{{ error }}</p>
      <p v-else-if="analyzing" class="tip is-loading">
        <span class="pulse"></span>
        {{ stage }}
      </p>
      <p v-else class="tip">手机浏览器点「拍照」会直接打开相机；桌面端会退化成选择图片文件。</p>

      <p v-if="!configured" class="config-warn">
        模型接口尚未配置：在 <code>src/config/ai.js</code> 里填 <code>baseUrl</code> 与
        <code>apiKey</code>（或用 <code>VITE_AI_BASE_URL</code> / <code>VITE_AI_API_KEY</code>
        环境变量），填好后即可调用 {{ AI_CONFIG.model }}。
      </p>
    </div>

    <div v-if="failure" class="failure-panel">
      <div class="failure-head">
        <el-icon :size="16"><WarningFilled /></el-icon>
        分析失败
      </div>
      <p class="failure-msg">{{ failure }}</p>
      <button v-if="meta" class="act-btn" type="button" @click="analyze">重试</button>
    </div>

    <div v-if="analysis" class="result-panel">
      <div class="result-head">
        <span class="result-title">分析结果</span>
        <el-tag size="small" effect="plain" type="warning">{{ analysis.model }}</el-tag>
        <span class="result-meta">{{ metaLine }} · 耗时 {{ elapsedLabel }}</span>
      </div>

      <section v-for="(section, index) in analysis.sections" :key="index" class="sec">
        <div class="sec-head">
          <h3 v-if="section.title" class="sec-title">{{ section.title }}</h3>
          <button
            v-if="section.isPrompt && analysis.promptText"
            class="copy-btn"
            type="button"
            @click="copyPrompt"
          >
            {{ copied ? '已复制' : '复制提示词' }}
          </button>
        </div>

        <template v-for="(block, blockIndex) in section.blocks" :key="blockIndex">
          <p v-if="block.kind === 'p'" class="sec-p">{{ block.text }}</p>
          <ul v-else-if="block.kind === 'list'" class="sec-list">
            <li v-for="(item, itemIndex) in block.items" :key="itemIndex">{{ item }}</li>
          </ul>
          <pre v-else class="sec-code">{{ block.text }}</pre>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { Camera, Picture, UploadFilled, MagicStick, WarningFilled } from '@element-plus/icons-vue'
import { AI_CONFIG, isAIConfigured } from '../config/ai'
import { analyzeImage, parseAnalysis } from '../utils/ai'

const cameraInput = ref(null)
const uploadInput = ref(null)

const preview = ref('')
const meta = ref(null)
const analyzing = ref(false)
const stage = ref('')
const analysis = ref(null)
const error = ref('')
const failure = ref('')
const copied = ref(false)

const configured = isAIConfigured()
const SOURCE_LABEL = { camera: '拍照', upload: '本地上传' }

let copiedTimer = null

const metaLine = computed(() => {
  if (!meta.value) return ''
  const { file, source, width, height } = meta.value
  const parts = [SOURCE_LABEL[source] || '未知']
  if (width && height) parts.push(`${width} × ${height}`)
  parts.push(formatSize(file.size))
  return parts.join(' · ')
})

const elapsedLabel = computed(() => {
  if (!analysis.value) return ''
  const seconds = analysis.value.elapsed / 1000
  return seconds < 1 ? '<1s' : `${seconds.toFixed(1)}s`
})

function openCamera() {
  error.value = ''
  cameraInput.value?.click()
}

function openUpload() {
  error.value = ''
  uploadInput.value?.click()
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function releasePreview() {
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = ''
}

function onFileChange(event, source) {
  const file = event.target.files?.[0]
  // 同一个文件连续选两次不会触发 change，取完就清空
  event.target.value = ''
  if (!file) return

  error.value = ''
  failure.value = ''
  analysis.value = null

  if (!file.type.startsWith('image/')) {
    error.value = `「${file.name}」不是图片文件，换一张试试。`
    return
  }

  releasePreview()
  preview.value = URL.createObjectURL(file)
  meta.value = { file, source, width: 0, height: 0 }

  const image = new Image()
  image.onload = () => {
    if (!meta.value) return
    meta.value = { ...meta.value, width: image.naturalWidth, height: image.naturalHeight }
  }
  image.src = preview.value
}

async function analyze() {
  if (!meta.value || analyzing.value) return

  if (!configured) {
    failure.value = '模型接口还没配置，先在 src/config/ai.js 填 baseUrl 与 apiKey 再点分析。'
    return
  }

  failure.value = ''
  analysis.value = null
  analyzing.value = true
  stage.value = '正在读取图片…'

  try {
    const response = await analyzeImage(meta.value.file, (next) => {
      stage.value = next
    })
    const parsed = parseAnalysis(response.text)
    analysis.value = { ...response, ...parsed }
  } catch (err) {
    failure.value = err?.message || '分析失败，请稍后重试'
  } finally {
    analyzing.value = false
    stage.value = ''
  }
}

async function copyPrompt() {
  const text = analysis.value?.promptText
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
    }, 1600)
  } catch {
    failure.value = '当前浏览器不允许写剪贴板，手动选中提示词复制即可。'
  }
}

function reset() {
  releasePreview()
  meta.value = null
  analysis.value = null
  error.value = ''
  failure.value = ''
}

onBeforeUnmount(() => {
  releasePreview()
  clearTimeout(copiedTimer)
})
</script>

<style scoped>
.photo {
  padding: 8px 0 0;
}

.photo-head {
  text-align: center;
  margin-bottom: 26px;
}

.photo-head h1 {
  margin: 0 0 10px;
  font-size: 28px;
  letter-spacing: 3px;
  color: #d4af37;
}

.photo-head p {
  margin: 0;
  font-size: 13.5px;
  color: #8a8574;
}

.shoot-panel {
  max-width: 720px;
  margin: 0 auto;
  padding: 20px;
  background: #1a1a1a;
  border: 1px solid #3a3324;
  border-radius: 14px;
}

.stage {
  position: relative;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border: 1px dashed #3f3928;
  border-radius: 10px;
  background: #141414;
  overflow: hidden;
}

.stage-img {
  max-width: 100%;
  max-height: 460px;
  border-radius: 6px;
  object-fit: contain;
  display: block;
}

.stage-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #4d4a3f;
  text-align: center;
}

.stage-title {
  margin: 4px 0 0;
  font-size: 14px;
  color: #6b6555;
}

.stage-sub {
  font-size: 12.5px;
  line-height: 1.7;
  color: #565243;
  max-width: 340px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.act-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  font-family: inherit;
  font-size: 13.5px;
  color: #d8d3c2;
  background: #202020;
  border: 1px solid #3f3928;
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.18s, background 0.18s, border-color 0.18s;
}

.act-btn:hover:not(:disabled) {
  color: #d4af37;
  border-color: #6b5c2e;
  background: #24211a;
}

.act-btn.primary {
  color: #121212;
  font-weight: 600;
  background: #d4af37;
  border-color: #d4af37;
}

.act-btn.primary:hover:not(:disabled) {
  color: #121212;
  filter: brightness(1.08);
  background: #d4af37;
}

.act-btn:disabled {
  color: #5c5749;
  background: #1c1c1c;
  border-color: #2e2a20;
  cursor: not-allowed;
}

.act-btn.ghost {
  margin-left: auto;
  background: transparent;
  border-color: transparent;
  color: #7a7565;
}

.hidden-input {
  display: none;
}

.tip {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: #6b6555;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip.is-error {
  color: #e08a8a;
}

.tip.is-loading {
  color: #cfae5b;
}

.pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d4af37;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.25;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.config-warn {
  margin: 12px 0 0;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.8;
  color: #b99a4e;
  background: rgba(212, 175, 55, 0.06);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 8px;
}

.config-warn code {
  padding: 1px 4px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11.5px;
  color: #d8bb6e;
  background: #141414;
  border-radius: 3px;
}

.failure-panel,
.result-panel {
  max-width: 720px;
  margin: 18px auto 0;
  padding: 20px;
  background: #1a1a1a;
  border-radius: 14px;
}

.failure-panel {
  border: 1px solid rgba(224, 122, 122, 0.35);
  background: rgba(90, 30, 30, 0.18);
}

.failure-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 600;
  color: #e08a8a;
}

.failure-msg {
  margin: 10px 0 14px;
  font-size: 12.5px;
  line-height: 1.8;
  color: #b8a4a4;
  word-break: break-word;
}

.result-panel {
  border: 1px solid #3a3324;
}

.result-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #332d20;
}

.result-title {
  font-size: 15px;
  font-weight: 600;
  color: #e5e3d8;
}

.result-meta {
  margin-left: auto;
  font-size: 11.5px;
  color: #6b6555;
}

.sec {
  padding-top: 18px;
}

.sec + .sec {
  margin-top: 18px;
  border-top: 1px solid #262217;
}

.sec-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sec-title {
  position: relative;
  margin: 0;
  padding-left: 10px;
  font-size: 14.5px;
  font-weight: 600;
  color: #d4af37;
  letter-spacing: 0.5px;
}

.sec-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  bottom: 3px;
  width: 3px;
  border-radius: 2px;
  background: #d4af37;
}

.copy-btn {
  margin-left: auto;
  padding: 4px 12px;
  font-family: inherit;
  font-size: 12px;
  color: #b99a4e;
  background: transparent;
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.18s;
}

.copy-btn:hover {
  color: #121212;
  background: #d4af37;
  border-color: #d4af37;
}

.sec-p {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.9;
  color: #c9c4b2;
  white-space: pre-wrap;
}

.sec-list {
  margin: 10px 0 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
}

.sec-list li {
  font-size: 13px;
  line-height: 1.85;
  color: #c9c4b2;
}

.sec-code {
  margin: 12px 0 0;
  padding: 14px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.8;
  color: #d8bb6e;
  white-space: pre-wrap;
  word-break: break-word;
  background: #141414;
  border: 1px solid #332d20;
  border-radius: 8px;
}

@media (max-width: 600px) {
  .photo-head h1 {
    font-size: 22px;
  }

  .stage {
    min-height: 220px;
  }

  .act-btn {
    flex: 1 1 auto;
    justify-content: center;
  }

  .act-btn.ghost {
    flex: none;
    margin-left: 0;
  }

  .result-meta {
    margin-left: 0;
    width: 100%;
  }
}
</style>
