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
        <button v-if="meta" class="act-btn ghost" type="button" @click="reset">清除</button>
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

      <p class="tip">
        <template v-if="error">{{ error }}</template>
        <template v-else>手机浏览器点「拍照」会直接打开相机；桌面端会退化成选择图片文件。</template>
      </p>
    </div>

    <div v-if="result" class="result-panel">
      <div class="result-head">
        <span class="result-title">分析结果</span>
        <el-tag type="warning" effect="plain" size="small">预留 · 未接入分析服务</el-tag>
      </div>

      <dl class="meta-list">
        <div v-for="row in result.rows" :key="row.label" class="meta-row">
          <dt>{{ row.label }}</dt>
          <dd>{{ row.value }}</dd>
        </div>
      </dl>

      <div class="pending">
        <p class="pending-title">后续这里会输出：</p>
        <ul>
          <li v-for="item in planned" :key="item">{{ item }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { Camera, Picture, UploadFilled, MagicStick } from '@element-plus/icons-vue'

const cameraInput = ref(null)
const uploadInput = ref(null)

const preview = ref('')
const meta = ref(null)
const analyzing = ref(false)
const result = ref(null)
const error = ref('')

// 分析能力还没接入，先把将来要输出的内容列出来，避免前端留一块空白
const planned = [
  '画面主体识别：人物 / 场景 / 敌人，以及主体在画面中的位置',
  '构图建议：三分法、地平线水平、留白是否合适',
  '色调与氛围：整体亮度、色温、对比度，以及对应的时间与天气',
  '可分享文案：一段可直接复制的配文与话题标签',
]

const SOURCE_LABEL = { camera: '拍照', upload: '本地上传' }

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

function formatTime(timestamp) {
  if (!timestamp) return '未知'
  return new Date(timestamp).toLocaleString('zh-CN', { hour12: false })
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
  result.value = null

  if (!file.type.startsWith('image/')) {
    error.value = `「${file.name}」不是图片文件，换一张试试。`
    return
  }

  releasePreview()
  preview.value = URL.createObjectURL(file)
  meta.value = {
    file,
    source,
    width: 0,
    height: 0,
  }

  const image = new Image()
  image.onload = () => {
    if (!meta.value) return
    meta.value = { ...meta.value, width: image.naturalWidth, height: image.naturalHeight }
  }
  image.src = preview.value
}

async function analyze() {
  if (!meta.value || analyzing.value) return
  analyzing.value = true
  result.value = null

  // 预留：这里以后换成真实的分析请求，先给一段可感知的等待
  await new Promise((resolve) => setTimeout(resolve, 600))

  const { file, source, width, height } = meta.value
  result.value = {
    rows: [
      { label: '图片来源', value: SOURCE_LABEL[source] || '未知' },
      { label: '文件名', value: file.name || '（相机拍摄未命名）' },
      { label: '图片尺寸', value: width && height ? `${width} × ${height}` : '读取中' },
      { label: '文件大小', value: formatSize(file.size) },
      { label: '图片格式', value: (file.type || '').replace('image/', '').toUpperCase() || '未知' },
      { label: '修改时间', value: formatTime(file.lastModified) },
      { label: '分析状态', value: '待接入 —— 以上为本地读取的信息' },
    ],
  }
  analyzing.value = false
}

function reset() {
  releasePreview()
  meta.value = null
  result.value = null
  error.value = ''
}

onBeforeUnmount(releasePreview)
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
}

.result-panel {
  max-width: 720px;
  margin: 18px auto 0;
  padding: 20px;
  background: #1a1a1a;
  border: 1px solid #3a3324;
  border-radius: 14px;
}

.result-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #332d20;
}

.result-title {
  font-size: 15px;
  font-weight: 600;
  color: #e5e3d8;
}

.meta-list {
  margin: 14px 0 0;
  display: grid;
  gap: 8px;
}

.meta-row {
  display: flex;
  gap: 12px;
  font-size: 13px;
  line-height: 1.6;
}

.meta-row dt {
  flex: none;
  width: 76px;
  color: #6b6555;
}

.meta-row dd {
  margin: 0;
  color: #c9c4b2;
  word-break: break-all;
}

.pending {
  margin-top: 18px;
  padding: 14px 16px;
  background: #141414;
  border: 1px solid #2e2a20;
  border-radius: 10px;
}

.pending-title {
  margin: 0 0 8px;
  font-size: 12.5px;
  color: #8a8574;
}

.pending ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
}

.pending li {
  font-size: 12.5px;
  line-height: 1.7;
  color: #6b6555;
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
}
</style>
