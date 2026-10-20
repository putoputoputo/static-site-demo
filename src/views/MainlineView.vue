<template>
  <div class="mainline-page">
    <!-- 页头 -->
    <header class="page-hero">
      <div class="hero-text">
        <h1 class="hero-title">主线流程</h1>
        <p class="hero-sub">
          本体 <strong>{{ stats.base }}</strong> 章 + DLC <strong>{{ stats.dlc }}</strong> 章，共
          <strong>{{ stats.steps }}</strong> 个推进步骤、<strong>{{ stats.requiredBosses }}</strong>
          场必打 BOSS、<strong>{{ stats.endings }}</strong> 个结局分支。每一章都标出了进入条件、推荐等级与武器强化等级——
          打不过通常不是技术问题，是等级或强化没跟上。
        </p>
        <div class="hero-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <span class="progress-text">
            已通关 {{ completedCount }} / {{ stats.total }} 章
          </span>
        </div>
        <div class="hero-actions">
          <RouterLink to="/main-quest/regions" class="guide-link">
            <el-icon :size="13"><Grid /></el-icon>
            区域 &amp; BOSS 图鉴 · {{ regionStats.total }} 区域 / {{ regionStats.bosses }} BOSS
          </RouterLink>
          <span class="guide-hint">
            含追忆 BOSS {{ regionStats.remembrance }} 个（本体 {{ regionStats.remembranceBase }} + DLC
            {{ regionStats.remembranceDlc }}）
          </span>
        </div>
      </div>
      <div class="hero-badges">
        <div v-for="item in highlights" :key="item.label" class="hero-badge">
          <span class="badge-value">{{ item.value }}</span>
          <span class="badge-label">{{ item.label }}</span>
        </div>
      </div>
    </header>

    <!-- 筛选 -->
    <section class="filter-panel">
      <div class="filter-line">
        <el-input
          v-model="keyword"
          class="search-input"
          placeholder="搜索章节 / 地点 / BOSS / 关键道具"
          clearable
          :prefix-icon="Search"
        />
        <el-radio-group v-model="scope" class="scope-switch">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="base">本体</el-radio-button>
          <el-radio-button value="dlc">DLC</el-radio-button>
        </el-radio-group>
        <div class="filter-tail">
          <span class="result-count">{{ filtered.length }} 章</span>
          <el-button v-if="isFiltering" text size="small" :icon="RefreshLeft" @click="resetFilters">
            清除筛选
          </el-button>
        </div>
      </div>
    </section>

    <!-- 章节时间线 -->
    <section v-if="filtered.length" class="chapter-list">
      <article
        v-for="chapter in filtered"
        :key="chapter.id"
        class="chapter-card"
        :class="{ done: isCompleted(chapter.id) }"
      >
        <div class="chapter-index">
          <span class="index-num">{{ String(chapter.order).padStart(2, '0') }}</span>
          <span class="index-line"></span>
        </div>

        <div class="chapter-body" @click="goDetail(chapter.id)">
          <div class="chapter-head">
            <div class="title-wrap">
              <h2 class="chapter-name">
                {{ chapter.name }}
                <span v-if="chapter.dlc" class="dlc-tag">(DLC)</span>
                <span v-else-if="chapter.optional" class="optional-tag">可选</span>
              </h2>
              <p class="chapter-sub">{{ chapter.subtitle }}</p>
            </div>
            <button
              class="done-toggle"
              :class="{ active: isCompleted(chapter.id) }"
              :title="isCompleted(chapter.id) ? '标记为未通关' : '标记为已通关'"
              @click.stop="toggleCompleted(chapter.id)"
            >
              <el-icon :size="14"><Check /></el-icon>
            </button>
          </div>

          <div class="meta-row">
            <span class="meta-item">
              <el-icon :size="12"><Location /></el-icon>
              {{ chapter.region }}
            </span>
            <span class="meta-item level">等级 {{ chapter.level }}</span>
            <span class="meta-item weapon">武器 {{ chapter.weapon }}</span>
            <span v-if="chapter.rune && chapter.rune !== '无'" class="meta-item rune">
              {{ chapter.rune }}
            </span>
            <span class="meta-item">{{ chapter.steps.length }} 步</span>
            <span v-if="warnCount(chapter)" class="meta-item warn">
              {{ warnCount(chapter) }} 处易错过
            </span>
          </div>

          <p class="chapter-goal">{{ chapter.goal }}</p>

          <div v-if="requiredBosses(chapter).length" class="boss-preview">
            <span class="preview-label">必打</span>
            <span v-for="name in requiredBosses(chapter)" :key="name" class="boss-chip">{{ name }}</span>
          </div>

          <div class="gate-row">
            <span class="gate-label">进入条件</span>
            <span class="gate-text">{{ chapter.gate }}</span>
          </div>
        </div>
      </article>
    </section>

    <el-empty v-else description="没有匹配的章节，换个关键词试试">
      <el-button type="primary" plain @click="resetFilters">清除筛选</el-button>
    </el-empty>

    <!-- 结局 -->
    <section class="ending-section">
      <div class="section-head">
        <h2 class="section-title">结局分支</h2>
        <p class="section-desc">
          全部结局都在击败艾尔登之兽、触碰濒毁的玛莉卡时选择。前四个是「艾尔登之王」的分支，
          后两个是独立结局；癫火一旦接受会锁定结局，只能靠米凯拉的针解除。
        </p>
      </div>
      <div class="ending-grid">
        <article v-for="ending in mainEndings" :key="ending.id" class="ending-card">
          <div class="ending-head">
            <h3 class="ending-name">{{ ending.name }}</h3>
            <span class="ending-type" :class="{ special: ending.type === '独立结局' }">
              {{ ending.type }}
            </span>
          </div>
          <p class="ending-req">{{ ending.requirement }}</p>
          <p class="ending-detail">{{ ending.detail }}</p>
          <RouterLink v-if="ending.quest" :to="`/side-quests/${ending.quest}`" class="ending-link">
            对应支线：{{ questName(ending.quest) }} →
          </RouterLink>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Search, RefreshLeft, Location, Check, Grid } from '@element-plus/icons-vue'
import {
  mainChapters,
  mainEndings,
  mainStats,
  matchChapter,
  requiredBossNames,
} from '../utils/mainline'
import { regionStats } from '../data/summary'
import { getQuest } from '../utils/quest'
import { useMainProgress } from '../composables/useMainProgress'

const router = useRouter()
const { isCompleted, toggleCompleted, completedCount } = useMainProgress()

const stats = mainStats

const keyword = ref('')
const scope = ref('all')

const highlights = computed(() => [
  { value: stats.total, label: '章节' },
  { value: stats.requiredBosses, label: '必打 BOSS' },
  { value: stats.steps, label: '推进步骤' },
  { value: stats.endings, label: '结局分支' },
])

const progressPercent = computed(() =>
  stats.total ? Math.round((completedCount.value / stats.total) * 100) : 0
)

const isFiltering = computed(() => keyword.value.trim() !== '' || scope.value !== 'all')

const filtered = computed(() =>
  [...mainChapters]
    .sort((a, b) => a.order - b.order)
    .filter((chapter) => {
      if (scope.value === 'base' && chapter.dlc) return false
      if (scope.value === 'dlc' && !chapter.dlc) return false
      return matchChapter(chapter, keyword.value)
    })
)

function requiredBosses(chapter) {
  return requiredBossNames(chapter)
}

function warnCount(chapter) {
  return chapter.warnings?.length || 0
}

function questName(id) {
  return getQuest(id)?.name || id
}

function resetFilters() {
  keyword.value = ''
  scope.value = 'all'
}

function goDetail(id) {
  router.push(`/main-quest/${id}`)
}
</script>

<style scoped>
.mainline-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* 页头 */
.page-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 28px;
  border: 1px solid #3a3324;
  border-radius: 12px;
  background: linear-gradient(120deg, rgba(212, 175, 55, 0.14), transparent 65%), #1a1a1a;
}

.hero-title {
  margin: 0 0 8px;
  font-size: 26px;
  letter-spacing: 2px;
  color: #d4af37;
}

.hero-sub {
  margin: 0;
  max-width: 640px;
  color: #9d977f;
  font-size: 13px;
  line-height: 1.75;
}

.hero-sub strong {
  color: #e5e3d8;
  font-weight: 600;
}

.hero-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.progress-bar {
  width: 220px;
  height: 6px;
  border-radius: 3px;
  background: #2c2820;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8a7434, #d4af37);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #8a8574;
}

.hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.guide-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  color: #d4af37;
  border: 1px solid rgba(212, 175, 55, 0.35);
  border-radius: 6px;
  background: rgba(212, 175, 55, 0.07);
  text-decoration: none;
  transition: all 0.16s ease;
}

.guide-link:hover {
  border-color: rgba(212, 175, 55, 0.7);
  background: rgba(212, 175, 55, 0.14);
}

.guide-hint {
  font-size: 11px;
  color: #6f6a5a;
}

.hero-badges {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.hero-badge {
  min-width: 78px;
  padding: 10px 12px;
  text-align: center;
  border: 1px solid #3a3324;
  border-radius: 8px;
  background: #151515;
}

.badge-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #d4af37;
}

.badge-label {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #8a8574;
}

/* 筛选 */
.filter-panel {
  padding: 16px 20px;
  border: 1px solid #302b1f;
  border-radius: 10px;
  background: #1a1a1a;
}

.filter-line {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  width: 320px;
}

.scope-switch {
  flex-shrink: 0;
}

.filter-tail {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-count {
  font-size: 12px;
  color: #8a8574;
}

/* 章节卡 */
.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chapter-card {
  display: flex;
  gap: 14px;
}

.chapter-index {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 40px;
  padding-top: 16px;
}

.index-num {
  font-size: 13px;
  font-weight: 600;
  color: #6b5a2a;
  letter-spacing: 1px;
}

.index-line {
  flex: 1;
  width: 1px;
  margin-top: 8px;
  background: linear-gradient(180deg, #3a3324, transparent);
}

.chapter-card:last-child .index-line {
  display: none;
}

.chapter-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 16px 18px;
  border: 1px solid #302b1f;
  border-radius: 10px;
  background: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.chapter-body:hover {
  border-color: #6b5a2a;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.chapter-card.done .chapter-body {
  border-color: #3f5237;
  background: linear-gradient(160deg, rgba(122, 158, 106, 0.08), transparent 55%), #1a1a1a;
}

.chapter-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.chapter-name {
  margin: 0;
  font-size: 17px;
  color: #e5e3d8;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.dlc-tag {
  font-size: 11px;
  color: #c98b3f;
  font-weight: 400;
}

.optional-tag {
  font-size: 11px;
  color: #8a8574;
  font-weight: 400;
  border: 1px solid #383225;
  border-radius: 3px;
  padding: 0 4px;
}

.chapter-sub {
  margin: 3px 0 0;
  font-size: 12px;
  color: #8a8574;
}

.done-toggle {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #5d5849;
  background: transparent;
  border: 1px solid #34302a;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.16s ease;
}

.done-toggle:hover {
  color: #9bbd8a;
  border-color: #4e6242;
}

.done-toggle.active {
  color: #1a1a1a;
  background: #8fb87e;
  border-color: #8fb87e;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  font-size: 11px;
  border-radius: 4px;
  color: #8a8574;
  background: #242424;
  border: 1px solid #383225;
}

.meta-item.level {
  color: #c9a227;
  background: rgba(201, 162, 39, 0.08);
  border-color: rgba(201, 162, 39, 0.22);
}

.meta-item.weapon {
  color: #8fa88a;
  background: rgba(143, 168, 138, 0.08);
  border-color: rgba(143, 168, 138, 0.22);
}

.meta-item.rune {
  color: #b58cc0;
  background: rgba(181, 140, 192, 0.09);
  border-color: rgba(181, 140, 192, 0.24);
}

.meta-item.warn {
  color: #c16b4f;
  background: rgba(193, 107, 79, 0.1);
  border-color: rgba(193, 107, 79, 0.3);
}

.chapter-goal {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: #a8a292;
}

.boss-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.preview-label {
  font-size: 11px;
  color: #6f6a5a;
}

.boss-chip {
  font-size: 11px;
  color: #d08a6a;
  background: rgba(193, 107, 79, 0.09);
  border: 1px solid rgba(193, 107, 79, 0.24);
  border-radius: 4px;
  padding: 1px 6px;
}

.gate-row {
  display: flex;
  gap: 8px;
  padding-top: 9px;
  border-top: 1px dashed #2e2a22;
  font-size: 12px;
  line-height: 1.6;
}

.gate-label {
  flex-shrink: 0;
  color: #6f6a5a;
}

.gate-text {
  color: #9d977f;
}

/* 结局 */
.ending-section {
  margin-top: 10px;
  padding: 22px 24px;
  border: 1px solid #302b1f;
  border-radius: 10px;
  background: #171717;
}

.section-head {
  margin-bottom: 16px;
}

.section-title {
  margin: 0 0 6px;
  font-size: 18px;
  color: #d4af37;
  letter-spacing: 1px;
}

.section-desc {
  margin: 0;
  max-width: 780px;
  font-size: 12px;
  line-height: 1.75;
  color: #8a8574;
}

.ending-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.ending-card {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 14px 16px;
  border: 1px solid #2c2820;
  border-radius: 8px;
  background: #1c1c1c;
}

.ending-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ending-name {
  margin: 0;
  font-size: 15px;
  color: #e5e3d8;
}

.ending-type {
  flex-shrink: 0;
  font-size: 10px;
  color: #8a8574;
  border: 1px solid #383225;
  border-radius: 3px;
  padding: 1px 5px;
}

.ending-type.special {
  color: #9bb7c9;
  border-color: rgba(155, 183, 201, 0.3);
}

.ending-req {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #c9a227;
}

.ending-detail {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #9d977f;
}

.ending-link {
  margin-top: auto;
  padding-top: 4px;
  font-size: 11px;
  color: #8fa88a;
  text-decoration: none;
}

.ending-link:hover {
  color: #d4af37;
}

@media (max-width: 900px) {
  .page-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-badges {
    flex-wrap: wrap;
  }
}
</style>
