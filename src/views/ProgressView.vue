<template>
  <div class="progress-page">
    <el-breadcrumb class="crumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>我的进度</el-breadcrumb-item>
    </el-breadcrumb>

    <header class="page-hero">
      <div class="hero-text">
        <h1 class="hero-title">我的进度</h1>
        <p class="hero-sub">
          主线章节、支线任务、武器与图鉴收藏都记在这台设备的浏览器里，不上传任何服务器。
          这一页把它们汇总在一起，顺便可以导出成 JSON 备份，换设备时再导入回来。
        </p>
      </div>
      <div class="hero-badges">
        <div v-for="item in highlights" :key="item.label" class="hero-badge">
          <span class="badge-value">{{ item.value }}</span>
          <span class="badge-label">{{ item.label }}</span>
        </div>
      </div>
    </header>

    <p class="storage-hint">
      <el-icon :size="13"><InfoFilled /></el-icon>
      清浏览器数据、换设备、用无痕模式都会让进度消失。重要的话先导出一份。
    </p>

    <!-- 主线 -->
    <section class="panel">
      <div class="panel-head">
        <h2 class="panel-title">主线进度</h2>
        <span class="panel-meta">{{ mainDone }} / {{ mainTotal }} 章</span>
      </div>
      <div class="bar">
        <i class="bar-fill" :style="{ width: `${mainPercent}%` }"></i>
      </div>
      <p class="panel-hint">
        <template v-if="mainNext">
          下一章还没打：<RouterLink :to="`/main-quest/${mainNext.id}`" class="inline-link">{{ mainNext.title }}</RouterLink>
        </template>
        <template v-else>主线全部通关，剩下的就是结局分支了。</template>
      </p>

      <div v-for="group in mainGroups" :key="group.label" class="group">
        <div class="group-head">
          <span class="group-label">{{ group.label }}</span>
          <span class="group-count">{{ group.done }} / {{ group.items.length }}</span>
        </div>
        <ul class="check-list">
          <li v-for="chapter in group.items" :key="chapter.id" class="check-row" :class="{ done: isMainDone(chapter.id) }">
            <button class="check-btn" :class="{ on: isMainDone(chapter.id) }" @click="toggleMain(chapter.id)">
              <el-icon v-if="isMainDone(chapter.id)" :size="12"><Check /></el-icon>
            </button>
            <RouterLink :to="`/main-quest/${chapter.id}`" class="check-name">{{ chapter.title }}</RouterLink>
            <span class="check-meta">第 {{ chapter.order }} 章</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- 支线 -->
    <section class="panel">
      <div class="panel-head">
        <h2 class="panel-title">支线进度</h2>
        <span class="panel-meta">{{ questDone }} / {{ questTotal }} 条</span>
      </div>
      <div class="bar">
        <i class="bar-fill gold" :style="{ width: `${questPercent}%` }"></i>
      </div>
      <p class="panel-hint">
        <template v-if="questNext">
          还没做的支线：<RouterLink :to="`/side-quests/${questNext.id}`" class="inline-link">{{ questNext.name }}</RouterLink>
        </template>
        <template v-else>51 条支线全部标记完成。</template>
      </p>

      <div v-if="questDone" class="region-breakdown">
        <span v-for="item in questRegionStats" :key="item.region" class="region-chip">
          {{ item.region }} <strong>{{ item.done }}/{{ item.total }}</strong>
        </span>
      </div>

      <div class="two-lists">
        <div>
          <h3 class="sub-title">已完成 {{ questDoneList.length }}</h3>
          <ul v-if="questDoneList.length" class="plain-list">
            <li v-for="quest in questDoneList" :key="quest.id">
              <RouterLink :to="`/side-quests/${quest.id}`">{{ quest.name }}</RouterLink>
              <span class="muted">· {{ quest.region }}</span>
            </li>
          </ul>
          <p v-else class="empty-hint">还没标记任何支线。</p>
        </div>
        <div>
          <h3 class="sub-title">未完成 {{ questTodoList.length }}</h3>
          <ul v-if="questTodoList.length" class="plain-list">
            <li v-for="quest in questTodoList.slice(0, 12)" :key="quest.id">
              <RouterLink :to="`/side-quests/${quest.id}`">{{ quest.name }}</RouterLink>
              <span class="muted">· {{ quest.region }}</span>
            </li>
          </ul>
          <p v-if="questTodoList.length > 12" class="empty-hint">
            还有 {{ questTodoList.length - 12 }} 条，去
            <RouterLink to="/side-quests" class="inline-link">支线列表</RouterLink>
            查看完整清单。
          </p>
          <p v-else-if="!questTodoList.length" class="empty-hint">全部完成。</p>
        </div>
      </div>
    </section>

    <!-- 收藏 -->
    <div class="two-col">
      <section class="panel">
        <div class="panel-head">
          <h2 class="panel-title">武器收藏</h2>
          <span class="panel-meta">{{ weaponFavCount }} / {{ weaponTotal }} 件</span>
        </div>
        <ul v-if="weaponFavorites.length" class="plain-list">
          <li v-for="weapon in weaponFavorites" :key="weapon.id">
            <RouterLink :to="`/weapons/${encodeURIComponent(weapon.id)}`">{{ weapon.name }}</RouterLink>
            <span class="muted">· {{ weapon.type }} · {{ weapon.stats.weight }} 负重</span>
          </li>
        </ul>
        <p v-else class="empty-hint">
          还没收藏武器。在
          <RouterLink to="/weapons" class="inline-link">武器图鉴</RouterLink>
          里点卡片右上角的星标即可收藏。
        </p>
        <p v-if="weaponFavorites.length" class="panel-hint">
          收藏合计负重 {{ weaponTotalWeight.toFixed(1) }}（仅供参考，实际以装备时为准）
        </p>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2 class="panel-title">图鉴收藏</h2>
          <span class="panel-meta">{{ codexFavCount }} 条</span>
        </div>
        <div class="codex-stats">
          <RouterLink
            v-for="item in codexBreakdown"
            :key="item.key"
            :to="`${item.path}?fav=1`"
            class="codex-stat"
          >
            <span class="codex-name">{{ item.title }}</span>
            <strong class="codex-count">{{ item.done }}</strong>
            <span class="codex-total">/ {{ item.total }}</span>
          </RouterLink>
        </div>
        <p v-if="!codexFavCount" class="empty-hint">还没收藏任何护符 / 魔法 / 祷告 / 骨灰。</p>
      </section>
    </div>

    <!-- 数据管理 -->
    <section class="panel">
      <div class="panel-head">
        <h2 class="panel-title">数据管理</h2>
        <span class="panel-meta">仅存在本机浏览器</span>
      </div>

      <div class="manage-grid">
        <div class="manage-card">
          <h3>导出备份</h3>
          <p>把四项进度打包成一个 JSON 文件，换设备或清缓存前先存一份。</p>
          <div class="manage-actions">
            <el-button size="small" @click="downloadBackup">下载 JSON</el-button>
            <el-button size="small" text @click="copyBackup">复制到剪贴板</el-button>
          </div>
        </div>

        <div class="manage-card">
          <h3>导入</h3>
          <p>粘贴之前导出的 JSON 内容。导入是「覆盖」，会替换掉当前进度。</p>
          <el-input v-model="importText" type="textarea" :rows="3" placeholder='{"site":"er-guide", ...}' />
          <div class="manage-actions">
            <el-button size="small" :disabled="!importText.trim()" @click="doImport">导入</el-button>
            <el-button size="small" text @click="importText = ''">清空输入</el-button>
          </div>
        </div>
      </div>

      <p v-if="feedback" class="feedback" :class="feedbackType">{{ feedback }}</p>

      <div class="danger-zone">
        <div class="danger-row">
          <span>清空全部进度（主线 + 支线 + 两项收藏）</span>
          <el-popconfirm
            title="确定清空全部进度？这一步不可撤销。"
            confirm-button-text="确定清空"
            cancel-button-text="取消"
            width="240"
            @confirm="clearEverything"
          >
            <template #reference>
              <el-button size="small" type="danger" plain>清空全部</el-button>
            </template>
          </el-popconfirm>
        </div>
        <div class="danger-row">
          <span>只清空主线进度</span>
          <el-popconfirm title="清空主线章节的完成标记？" width="220" @confirm="resetMain">
            <template #reference>
              <el-button size="small" text>清空</el-button>
            </template>
          </el-popconfirm>
        </div>
        <div class="danger-row">
          <span>只清空支线进度</span>
          <el-popconfirm title="清空支线的完成标记？" width="220" @confirm="resetQuest">
            <template #reference>
              <el-button size="small" text>清空</el-button>
            </template>
          </el-popconfirm>
        </div>
        <div class="danger-row">
          <span>清空两项收藏（武器 + 图鉴）</span>
          <el-popconfirm title="清空武器与图鉴收藏？" width="220" @confirm="resetFavorites">
            <template #reference>
              <el-button size="small" text>清空</el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Check, InfoFilled } from '@element-plus/icons-vue'
import { useMainProgress } from '../composables/useMainProgress'
import { useQuestProgress } from '../composables/useQuestProgress'
import { useWeaponFavorites } from '../composables/useWeaponFavorites'
import { useCodexFavorites } from '../composables/useCodexFavorites'
import { exportProgress, importProgress, clearAllProgress } from '../composables/progress'
import { mainChapters } from '../utils/mainline.js'
import quests from '../data/quests.js'
import weapons from '../data/weapons.js'
import { codexModules } from '../data/codex.js'

const { isCompleted: isMainDone, toggleCompleted: toggleMain, resetProgress: resetMain } = useMainProgress()
const { isCompleted: isQuestDone, resetProgress: resetQuest } = useQuestProgress()
const { favorites: weaponFavoriteIds, clearFavorites: resetWeapon } = useWeaponFavorites()
const { favoritesOf, clearFavorites: resetCodex } = useCodexFavorites()

const importText = ref('')
const feedback = ref('')
const feedbackType = ref('')

// ==================== 主线 ====================
const mainTotal = mainChapters.length
const mainDone = computed(() => mainChapters.filter((chapter) => isMainDone(chapter.id)).length)
const mainPercent = computed(() => (mainTotal ? Math.round((mainDone.value / mainTotal) * 100) : 0))
const mainNext = computed(() => mainChapters.find((chapter) => !isMainDone(chapter.id)) || null)

const mainGroups = computed(() =>
  [
    { label: '本体', items: mainChapters.filter((chapter) => !chapter.dlc) },
    { label: '黄金树幽影', items: mainChapters.filter((chapter) => chapter.dlc) },
  ]
    .filter((group) => group.items.length)
    .map((group) => ({
      ...group,
      done: group.items.filter((chapter) => isMainDone(chapter.id)).length,
    }))
)

// ==================== 支线 ====================
const questTotal = quests.length
const questDone = computed(() => quests.filter((quest) => isQuestDone(quest.id)).length)
const questPercent = computed(() => (questTotal ? Math.round((questDone.value / questTotal) * 100) : 0))
const questNext = computed(() => quests.find((quest) => !isQuestDone(quest.id)) || null)

const questDoneList = computed(() => quests.filter((quest) => isQuestDone(quest.id)))
const questTodoList = computed(() => quests.filter((quest) => !isQuestDone(quest.id)))

const questRegionStats = computed(() => {
  const map = new Map()
  quests.forEach((quest) => {
    const region = quest.region || '未归类'
    if (!map.has(region)) map.set(region, { region, total: 0, done: 0 })
    const entry = map.get(region)
    entry.total += 1
    if (isQuestDone(quest.id)) entry.done += 1
  })
  // 只显示有完成的区域，全 0 的区域列出来没有意义
  return [...map.values()].filter((item) => item.done > 0).sort((a, b) => b.done - a.done)
})

// ==================== 收藏 ====================
const weaponTotal = weapons.length
const weaponFavorites = computed(() => weapons.filter((weapon) => weaponFavoriteIds.value.includes(weapon.id)))
const weaponFavCount = computed(() => weaponFavorites.value.length)
const weaponTotalWeight = computed(() =>
  weaponFavorites.value.reduce((sum, weapon) => sum + (weapon.stats?.weight || 0), 0)
)

const codexBreakdown = computed(() =>
  Object.values(codexModules).map((module) => ({
    key: module.key,
    title: module.title || module.itemLabel,
    path: module.path,
    total: module.items.length,
    done: favoritesOf(module.key).length,
  }))
)

const codexFavCount = computed(() => codexBreakdown.value.reduce((sum, item) => sum + item.done, 0))

const highlights = computed(() => [
  { value: `${mainDone.value}/${mainTotal}`, label: '主线章节' },
  { value: `${questDone.value}/${questTotal}`, label: '支线任务' },
  { value: weaponFavCount.value, label: '武器收藏' },
  { value: codexFavCount.value, label: '图鉴收藏' },
])

// ==================== 数据管理 ====================

function setFeedback(message, type = 'ok') {
  feedback.value = message
  feedbackType.value = type
}

function downloadBackup() {
  const text = exportProgress()
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `er-guide-progress-${stamp}.json`
  link.click()
  URL.revokeObjectURL(url)
  setFeedback('已导出备份文件，注意浏览器默认下载目录。')
}

async function copyBackup() {
  const text = exportProgress()
  try {
    await navigator.clipboard.writeText(text)
    setFeedback('已复制到剪贴板。')
  } catch {
    // 非 https 或未授权时会失败，退回成让用户手动全选复制
    setFeedback('复制失败（浏览器未授权剪贴板），请改用「下载 JSON」。', 'warn')
  }
}

function doImport() {
  const result = importProgress(importText.value)
  setFeedback(result.message, result.ok ? 'ok' : 'warn')
  if (result.ok) importText.value = ''
}

function clearEverything() {
  clearAllProgress()
  setFeedback('已清空全部进度。')
}

function resetFavorites() {
  resetWeapon()
  resetCodex()
  setFeedback('已清空武器与图鉴收藏。')
}
</script>

<style scoped>
.progress-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.crumb {
  font-size: 13px;
}

.page-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 24px;
  border: 1px solid #332d20;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e1c16 0%, #16150f 100%);
}

.hero-text {
  flex: 1;
  min-width: 0;
}

.hero-title {
  margin: 0 0 10px;
  font-size: 26px;
  color: #d4af37;
}

.hero-sub {
  margin: 0;
  max-width: 720px;
  font-size: 13.5px;
  line-height: 1.85;
  color: #a9a496;
}

.hero-badges {
  display: grid;
  grid-template-columns: repeat(2, minmax(88px, 1fr));
  gap: 10px;
  align-content: start;
}

.hero-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid #3a3324;
  border-radius: 10px;
  background: #1a1915;
}

.badge-value {
  font-size: 18px;
  font-weight: 700;
  color: #d4af37;
}

.badge-label {
  font-size: 11px;
  color: #8a8574;
}

.storage-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 10px 14px;
  font-size: 12.5px;
  color: #8a8574;
  border: 1px solid #3a3324;
  border-left: 3px solid #6b5c2e;
  border-radius: 8px;
  background: #1a1915;
}

.panel {
  padding: 20px 22px;
  border: 1px solid #332d20;
  border-radius: 10px;
  background: #1c1c1c;
}

.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-title {
  margin: 0;
  font-size: 15px;
  color: #d4af37;
  padding-left: 10px;
  border-left: 3px solid #d4af37;
  line-height: 1.2;
}

.panel-meta {
  font-size: 12px;
  color: #8a8574;
  font-variant-numeric: tabular-nums;
}

.panel-hint {
  margin: 10px 0 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: #8a8574;
}

.bar {
  height: 6px;
  border-radius: 999px;
  background: #262626;
  overflow: hidden;
}

.bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #6b5c2e, #d4af37);
  transition: width 0.3s ease;
}

.bar-fill.gold {
  background: linear-gradient(90deg, #3f4a34, #8fae6a);
}

.group {
  margin-top: 18px;
}

.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.group-label {
  font-size: 12px;
  color: #6b6555;
  letter-spacing: 1px;
}

.group-count {
  font-size: 11.5px;
  color: #6b6555;
  font-variant-numeric: tabular-nums;
}

.check-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 7px;
  transition: background 0.16s;
}

.check-row:hover {
  background: #202020;
}

.check-row.done .check-name {
  color: #6b6555;
  text-decoration: line-through;
}

.check-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  flex-shrink: 0;
  color: #121212;
  background: transparent;
  border: 1px solid #4a422f;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.16s;
}

.check-btn:hover {
  border-color: #d4af37;
}

.check-btn.on {
  background: #d4af37;
  border-color: #d4af37;
}

.check-name {
  font-size: 13px;
  color: #c9c4b4;
  text-decoration: none;
}

.check-name:hover {
  color: #d4af37;
}

.check-meta {
  margin-left: auto;
  font-size: 11px;
  color: #5d5849;
}

.region-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.region-chip {
  padding: 3px 9px;
  font-size: 11.5px;
  color: #8a8574;
  background: #1f1f1f;
  border: 1px solid #302b1f;
  border-radius: 999px;
}

.region-chip strong {
  color: #c9c4b4;
  font-weight: 600;
}

.two-lists {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  margin-top: 16px;
}

.sub-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: #6b6555;
}

.plain-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plain-list li {
  font-size: 12.5px;
  line-height: 1.6;
  color: #b8b2a0;
}

.plain-list a {
  color: #c9c4b4;
  text-decoration: none;
  border-bottom: 1px dashed transparent;
}

.plain-list a:hover {
  color: #d4af37;
  border-bottom-color: #6b5c2e;
}

.muted {
  color: #5d5849;
  font-size: 11.5px;
}

.empty-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #5d5849;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.codex-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.codex-stat {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 11px 13px;
  border: 1px solid #302b1f;
  border-radius: 8px;
  background: #1a1a1a;
  text-decoration: none;
  transition: border-color 0.18s;
}

.codex-stat:hover {
  border-color: #6b5c2e;
}

.codex-name {
  font-size: 12.5px;
  color: #b8b2a0;
}

.codex-count {
  margin-left: auto;
  font-size: 16px;
  color: #d4af37;
}

.codex-total {
  font-size: 11px;
  color: #5d5849;
}

.manage-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.manage-card {
  padding: 14px 16px;
  border: 1px solid #302b1f;
  border-radius: 9px;
  background: #191919;
}

.manage-card h3 {
  margin: 0 0 8px;
  font-size: 13px;
  color: #c9c4b4;
}

.manage-card p {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.7;
  color: #6b6555;
}

.manage-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.feedback {
  margin: 12px 0 0;
  padding: 9px 12px;
  font-size: 12.5px;
  border-radius: 7px;
  border: 1px solid #3a4a34;
  background: #1a1f18;
  color: #9db884;
}

.feedback.warn {
  border-color: #4a3f20;
  background: #211d15;
  color: #d9c47a;
}

.danger-zone {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #2a2519;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.danger-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12.5px;
  color: #8a8574;
}

.inline-link {
  color: #d9c47a;
  text-decoration: none;
  border-bottom: 1px dashed #6b5c2e;
}

.inline-link:hover {
  color: #d4af37;
  border-bottom-style: solid;
}

@media (max-width: 980px) {
  .page-hero {
    flex-direction: column;
  }

  .hero-badges {
    grid-template-columns: repeat(4, 1fr);
  }

  .two-lists,
  .two-col,
  .manage-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .hero-badges {
    grid-template-columns: repeat(2, 1fr);
  }

  .codex-stats {
    grid-template-columns: 1fr;
  }
}
</style>
