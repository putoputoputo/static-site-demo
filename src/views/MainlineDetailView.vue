<template>
  <div v-if="chapter" class="chapter-detail">
    <el-breadcrumb class="crumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/main-quest' }">主线流程</el-breadcrumb-item>
      <el-breadcrumb-item>{{ chapter.name }}</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 页头 -->
    <header class="detail-hero">
      <div class="hero-main">
        <div class="hero-eyebrow">
          第 {{ String(chapter.order).padStart(2, '0') }} 章
          <span v-if="chapter.dlc" class="dlc-tag">DLC 黄金树幽影</span>
          <span v-if="chapter.optional || chapter.sideTrack" class="optional-tag">可选章节</span>
        </div>
        <h1 class="detail-title">{{ chapter.name }}</h1>
        <p class="detail-sub">{{ chapter.subtitle }}</p>
        <div class="hero-tags">
          <span class="tag">
            <el-icon :size="12"><Location /></el-icon>
            {{ chapter.region }}
          </span>
          <span class="tag level">推荐等级 {{ chapter.level }}</span>
          <span class="tag weapon">武器 {{ chapter.weapon }}</span>
          <span v-if="chapter.rune && chapter.rune !== '无'" class="tag rune">{{ chapter.rune }}</span>
          <span class="tag">{{ chapter.duration }}</span>
        </div>
        <p class="hero-summary">{{ chapter.summary }}</p>
      </div>
      <div class="hero-actions">
        <el-button
          :type="isCompleted(chapter.id) ? 'success' : 'default'"
          :plain="!isCompleted(chapter.id)"
          size="default"
          @click="toggleCompleted(chapter.id)"
        >
          <el-icon style="margin-right: 4px"><Check /></el-icon>
          {{ isCompleted(chapter.id) ? '已通关' : '标记通关' }}
        </el-button>
        <RouterLink to="/main-quest/regions" class="region-link">区域 &amp; BOSS 图鉴 →</RouterLink>
      </div>
    </header>

    <div class="detail-body">
      <!-- 左侧主内容 -->
      <div class="main-col">
        <section class="panel gate-panel">
          <h2 class="panel-title">
            <el-icon :size="15"><Key /></el-icon>
            进入条件
          </h2>
          <p class="gate-text">{{ chapter.gate }}</p>
          <p class="goal-text">
            <span class="goal-label">本章目标</span>
            {{ chapter.goal }}
          </p>
        </section>

        <section class="panel">
          <h2 class="panel-title">
            <el-icon :size="15"><Position /></el-icon>
            推进流程（{{ chapter.steps.length }} 步）
          </h2>
          <el-timeline class="steps">
            <el-timeline-item
              v-for="(step, index) in chapter.steps"
              :key="index"
              :timestamp="`第 ${index + 1} 步`"
              placement="top"
              :color="index === 0 ? '#d4af37' : '#5b4f2a'"
              size="normal"
            >
              <h3 class="step-title">{{ step.title }}</h3>
              <p v-if="step.place" class="step-place">
                <el-icon :size="11"><Location /></el-icon>
                {{ step.place }}
              </p>
              <p class="step-detail">{{ step.detail }}</p>
              <p v-if="step.tip" class="step-tip">
                <span class="tip-label">注意</span>
                {{ step.tip }}
              </p>
            </el-timeline-item>
          </el-timeline>
        </section>

        <!-- BOSS 清单 -->
        <section v-if="chapter.bosses?.length" class="panel">
          <h2 class="panel-title">
            <el-icon :size="15"><KnifeFork /></el-icon>
            BOSS 清单
          </h2>
          <div class="boss-list">
            <div
              v-for="boss in chapter.bosses"
              :key="boss.name"
              class="boss-row"
              :class="{ optional: !boss.required }"
            >
              <div class="boss-name-wrap">
                <span class="boss-name">{{ boss.name }}</span>
                <span class="boss-flag" :class="{ must: boss.required }">
                  {{ boss.required ? '必打' : '可选' }}
                </span>
                <span v-if="boss.remembrance" class="boss-flag rem">追忆</span>
              </div>
              <div class="boss-meta">
                <span class="boss-place">{{ boss.place }}</span>
                <span v-if="boss.note" class="boss-note">{{ boss.note }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 易错过 -->
        <section v-if="chapter.warnings?.length" class="panel warn-panel">
          <h2 class="panel-title">
            <el-icon :size="15"><Warning /></el-icon>
            这一章容易错过什么
          </h2>
          <ul class="warn-list">
            <li v-for="(item, index) in chapter.warnings" :key="index" class="warn-item">
              <span class="warn-dot"></span>
              <span class="warn-text">
                {{ item.text }}
                <RouterLink
                  v-if="item.quest"
                  :to="`/side-quests/${item.quest}`"
                  class="warn-link"
                >
                  {{ questName(item.quest) }} →
                </RouterLink>
              </span>
            </li>
          </ul>
        </section>
      </div>

      <!-- 右侧信息栏 -->
      <aside class="side-col">
        <section class="panel">
          <h2 class="panel-title">速览</h2>
          <dl class="info-list">
            <div class="info-row">
              <dt>所在区域</dt>
              <dd>{{ chapter.region }}</dd>
            </div>
            <div class="info-row">
              <dt>推荐等级</dt>
              <dd>{{ chapter.level }}</dd>
            </div>
            <div class="info-row">
              <dt>武器强化</dt>
              <dd>{{ chapter.weapon }}</dd>
            </div>
            <div class="info-row">
              <dt>大卢恩</dt>
              <dd>{{ chapter.rune || '无' }}</dd>
            </div>
            <div class="info-row">
              <dt>预计耗时</dt>
              <dd>{{ chapter.duration }}</dd>
            </div>
            <div class="info-row">
              <dt>版本</dt>
              <dd>{{ chapter.dlc ? 'DLC 黄金树幽影' : '本体' }}</dd>
            </div>
          </dl>
        </section>

        <section v-if="chapter.keyItems?.length" class="panel">
          <h2 class="panel-title">关键道具</h2>
          <ul class="item-list">
            <li v-for="item in chapter.keyItems" :key="item.name">
              <span class="item-name">{{ item.name }}</span>
              <span v-if="item.note" class="item-note">{{ item.note }}</span>
            </li>
          </ul>
        </section>

        <section v-if="chapter.relatedQuests?.length" class="panel">
          <h2 class="panel-title">关联支线</h2>
          <div class="related-list">
            <RouterLink
              v-for="id in chapter.relatedQuests"
              :key="id"
              :to="`/side-quests/${id}`"
              class="related-link"
            >
              {{ questName(id) }}
            </RouterLink>
          </div>
          <p class="side-note">主线推进到某一步会导致支线关闭，进这一章前先看一眼。</p>
        </section>

        <section v-if="neighbors.next" class="panel next-panel">
          <h2 class="panel-title">下一章</h2>
          <p class="next-cond">{{ chapter.nextCondition }}</p>
          <button class="next-btn" @click="goTo(neighbors.next.id)">
            {{ neighbors.next.name }}
            <el-icon :size="13"><ArrowRight /></el-icon>
          </button>
        </section>
      </aside>
    </div>

    <!-- 翻页 -->
    <nav class="pager">
      <button v-if="neighbors.prev" class="pager-btn" @click="goTo(neighbors.prev.id)">
        <span class="pager-label">上一章</span>
        <span class="pager-name">{{ neighbors.prev.name }}</span>
      </button>
      <span v-else class="pager-btn disabled">已经是第一章</span>
      <button v-if="neighbors.next" class="pager-btn right" @click="goTo(neighbors.next.id)">
        <span class="pager-label">下一章</span>
        <span class="pager-name">{{ neighbors.next.name }}</span>
      </button>
      <span v-else class="pager-btn right disabled">已经是最后一章</span>
    </nav>
  </div>

  <div v-else class="not-found">
    <el-empty description="没有找到这个章节">
      <el-button type="primary" plain @click="$router.push('/main-quest')">返回主线列表</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  Location,
  Check,
  Position,
  Key,
  KnifeFork,
  Warning,
  ArrowRight,
} from '@element-plus/icons-vue'
import { getChapter, chapterNeighbors } from '../utils/mainline'
import { getQuest } from '../utils/quest'
import { useMainProgress } from '../composables/useMainProgress'

const route = useRoute()
const router = useRouter()
const { isCompleted, toggleCompleted } = useMainProgress()

const chapter = computed(() => getChapter(route.params.id))
const neighbors = computed(() =>
  chapter.value ? chapterNeighbors(chapter.value) : { prev: null, next: null }
)

function questName(id) {
  return getQuest(id)?.name || id
}

function goTo(id) {
  router.push(`/main-quest/${id}`)
}
</script>

<style scoped>
.chapter-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.crumb {
  font-size: 12px;
}

/* 页头 */
.detail-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 26px;
  border: 1px solid #3a3324;
  border-radius: 12px;
  background: linear-gradient(120deg, rgba(212, 175, 55, 0.13), transparent 65%), #1a1a1a;
}

.hero-main {
  min-width: 0;
}

.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 11px;
  color: #6f6a5a;
  letter-spacing: 2px;
}

.dlc-tag {
  color: #c98b3f;
  letter-spacing: 0;
}

.optional-tag {
  color: #8a8574;
  letter-spacing: 0;
  border: 1px solid #383225;
  border-radius: 3px;
  padding: 0 5px;
}

.region-link {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  font-size: 12px;
  color: #c9a227;
  border: 1px solid rgba(201, 162, 39, 0.3);
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.16s ease;
}

.region-link:hover {
  border-color: rgba(201, 162, 39, 0.65);
  background: rgba(201, 162, 39, 0.08);
}

.detail-title {
  margin: 0 0 4px;
  font-size: 25px;
  letter-spacing: 2px;
  color: #d4af37;
}

.detail-sub {
  margin: 0 0 10px;
  font-size: 13px;
  color: #8a8574;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 12px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  font-size: 11px;
  border-radius: 4px;
  color: #9d977f;
  background: #242424;
  border: 1px solid #383225;
}

.tag.level {
  color: #c9a227;
  background: rgba(201, 162, 39, 0.08);
  border-color: rgba(201, 162, 39, 0.22);
}

.tag.weapon {
  color: #8fa88a;
  background: rgba(143, 168, 138, 0.08);
  border-color: rgba(143, 168, 138, 0.22);
}

.tag.rune {
  color: #b58cc0;
  background: rgba(181, 140, 192, 0.09);
  border-color: rgba(181, 140, 192, 0.24);
}

.hero-summary {
  margin: 0;
  max-width: 700px;
  font-size: 13px;
  line-height: 1.8;
  color: #9d977f;
}

.hero-actions {
  flex-shrink: 0;
}

/* 布局 */
.detail-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
  align-items: start;
}

.main-col,
.side-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.panel {
  padding: 18px 20px;
  border: 1px solid #302b1f;
  border-radius: 10px;
  background: #1a1a1a;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 600;
  color: #d4af37;
  letter-spacing: 1px;
}

/* 进入条件 */
.gate-panel {
  background: linear-gradient(120deg, rgba(212, 175, 55, 0.06), transparent 70%), #1a1a1a;
}

.gate-text {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.75;
  color: #c4bfae;
}

.goal-text {
  margin: 0;
  padding-top: 10px;
  border-top: 1px dashed #2e2a22;
  font-size: 13px;
  line-height: 1.75;
  color: #a8a292;
}

.goal-label {
  display: inline-block;
  margin-right: 8px;
  padding: 1px 6px;
  font-size: 10px;
  color: #1a1a1a;
  background: #c9a227;
  border-radius: 2px;
}

/* 步骤 */
.steps {
  padding-left: 2px;
  margin-bottom: -8px;
}

.step-title {
  margin: 0 0 5px;
  font-size: 15px;
  color: #e5e3d8;
}

.step-place {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 0 7px;
  font-size: 12px;
  color: #8a8574;
}

.step-detail {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: #a8a292;
}

.step-tip {
  margin: 8px 0 0;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.7;
  color: #cbb887;
  background: rgba(201, 162, 39, 0.07);
  border-left: 2px solid #8a7434;
  border-radius: 0 4px 4px 0;
}

.tip-label {
  display: inline-block;
  margin-right: 6px;
  padding: 0 5px;
  font-size: 10px;
  color: #1a1a1a;
  background: #c9a227;
  border-radius: 2px;
}

/* BOSS */
.boss-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.boss-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 12px;
  border: 1px solid #2c2820;
  border-left: 2px solid #c16b4f;
  border-radius: 6px;
  background: #1e1e1e;
}

.boss-row.optional {
  border-left-color: #3f3a2e;
}

.boss-name-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.boss-name {
  font-size: 13px;
  color: #e5e3d8;
}

.boss-flag {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  color: #8a8574;
  border: 1px solid #383225;
}

.boss-flag.must {
  color: #d08a6a;
  border-color: rgba(193, 107, 79, 0.35);
  background: rgba(193, 107, 79, 0.08);
}

.boss-flag.rem {
  color: #b58cc0;
  border-color: rgba(181, 140, 192, 0.35);
  background: rgba(181, 140, 192, 0.08);
}

.boss-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
  color: #7c7767;
}

.boss-place {
  color: #8a8574;
}

.boss-note {
  color: #6f6a5a;
}

/* 易错过 */
.warn-panel {
  border-color: rgba(193, 107, 79, 0.3);
  background: linear-gradient(120deg, rgba(193, 107, 79, 0.07), transparent 70%), #1a1a1a;
}

.warn-panel .panel-title {
  color: #d08a6a;
}

.warn-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.warn-item {
  display: flex;
  gap: 8px;
  font-size: 12px;
  line-height: 1.7;
  color: #c4bfae;
}

.warn-dot {
  flex-shrink: 0;
  width: 5px;
  height: 5px;
  margin-top: 8px;
  border-radius: 50%;
  background: #c16b4f;
}

.warn-link {
  margin-left: 4px;
  color: #d08a6a;
  text-decoration: none;
  border-bottom: 1px dashed rgba(193, 107, 79, 0.4);
}

.warn-link:hover {
  color: #d4af37;
}

/* 侧栏 */
.info-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  gap: 10px;
  font-size: 12px;
  line-height: 1.6;
}

.info-row dt {
  flex-shrink: 0;
  width: 60px;
  color: #6f6a5a;
}

.info-row dd {
  margin: 0;
  color: #c4bfae;
}

.item-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-list li {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 12px;
  color: #c9a227;
}

.item-note {
  font-size: 11px;
  line-height: 1.6;
  color: #6f6a5a;
}

.related-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.related-link {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  font-size: 12px;
  color: #a49c86;
  background: #212121;
  border: 1px solid #34302a;
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.16s ease;
}

.related-link:hover {
  color: #d4af37;
  border-color: #5b4f2a;
}

.side-note {
  margin: 10px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: #6f6a5a;
}

.next-panel {
  border-color: #4a3f24;
}

.next-cond {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.7;
  color: #9d977f;
}

.next-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 12px;
  font-size: 12px;
  color: #d4af37;
  background: rgba(212, 175, 55, 0.08);
  border: 1px solid #5b4f2a;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.16s ease;
}

.next-btn:hover {
  background: rgba(212, 175, 55, 0.16);
}

/* 翻页 */
.pager {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
}

.pager-btn {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 180px;
  padding: 10px 14px;
  text-align: left;
  background: #1a1a1a;
  border: 1px solid #302b1f;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.16s ease;
}

.pager-btn:hover {
  border-color: #5b4f2a;
}

.pager-btn.right {
  text-align: right;
  align-items: flex-end;
}

.pager-btn.disabled {
  color: #55503f;
  cursor: default;
  border-style: dashed;
}

.pager-label {
  font-size: 11px;
  color: #6f6a5a;
}

.pager-name {
  font-size: 13px;
  color: #d4af37;
}

.pager-btn.disabled .pager-name {
  color: #55503f;
}

.not-found {
  padding: 40px 0;
}

@media (max-width: 900px) {
  .detail-body {
    grid-template-columns: minmax(0, 1fr);
  }

  .detail-hero {
    flex-direction: column;
  }
}
</style>
