<template>
  <div class="not-found">
    <div class="nf-panel">
      <div class="nf-code">404</div>
      <h1 class="nf-title">这条赐福不在这里</h1>
      <p class="nf-desc">
        没有找到 <code class="nf-path">{{ route.fullPath }}</code> 对应的页面。
        可能是链接拼错了，也可能这条内容还没收录。
      </p>

      <div class="nf-actions">
        <RouterLink to="/" class="nf-btn primary">
          <el-icon :size="14"><HomeFilled /></el-icon>
          回到首页
        </RouterLink>
        <button class="nf-btn" @click="goBack">
          <el-icon :size="14"><ArrowLeft /></el-icon>
          返回上一页
        </button>
      </div>

      <div class="nf-suggest">
        <span class="nf-suggest-label">常用入口</span>
        <RouterLink v-for="item in shortcuts" :key="item.path" :to="item.path" class="nf-link">
          {{ item.label }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { HomeFilled, ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const shortcuts = [
  { path: '/main-quest', label: '主线' },
  { path: '/side-quests', label: '支线' },
  { path: '/weapons', label: '武器' },
  { path: '/runes', label: '护符' },
  { path: '/sorceries', label: '魔法' },
  { path: '/spirits', label: '骨灰' },
]

function goBack() {
  // 直接打开深链接时没有站内历史，退回首页
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 58vh;
  padding: 24px 0;
}

.nf-panel {
  width: 100%;
  max-width: 620px;
  padding: 40px 36px;
  text-align: center;
  border: 1px solid #3a3324;
  border-radius: 12px;
  background: linear-gradient(140deg, rgba(212, 175, 55, 0.08), transparent 60%), #1a1a1a;
}

.nf-code {
  font-size: 64px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 6px;
  color: #d4af37;
  opacity: 0.85;
}

.nf-title {
  margin: 16px 0 10px;
  font-size: 20px;
  color: #e5e3d8;
  letter-spacing: 1px;
}

.nf-desc {
  margin: 0 auto;
  max-width: 460px;
  font-size: 13px;
  line-height: 1.8;
  color: #8a8574;
}

.nf-path {
  padding: 1px 6px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  color: #cfae5b;
  background: #141414;
  border: 1px solid #332d20;
  border-radius: 4px;
  word-break: break-all;
}

.nf-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.nf-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  color: #b8b2a0;
  background: #202020;
  border: 1px solid #383225;
  border-radius: 999px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.18s;
}

.nf-btn:hover {
  color: #d4af37;
  border-color: #6b5c2e;
}

.nf-btn.primary {
  color: #121212;
  font-weight: 600;
  background: #d4af37;
  border-color: #d4af37;
}

.nf-btn.primary:hover {
  color: #121212;
  filter: brightness(1.08);
}

.nf-suggest {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px dashed #332d20;
}

.nf-suggest-label {
  font-size: 12px;
  color: #6b6555;
}

.nf-link {
  font-size: 12.5px;
  color: #9d977f;
  text-decoration: none;
  border-bottom: 1px dashed transparent;
  transition: color 0.18s, border-color 0.18s;
}

.nf-link:hover {
  color: #d4af37;
  border-bottom-color: #6b5c2e;
}
</style>
