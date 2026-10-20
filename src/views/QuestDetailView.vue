<template>
  <div v-if="quest" class="quest-detail">
    <el-breadcrumb class="crumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/side-quests' }">支线任务</el-breadcrumb-item>
      <el-breadcrumb-item>{{ quest.name }}</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 页头 -->
    <header class="detail-hero">
      <div class="hero-main">
        <h1 class="detail-title">
          {{ quest.name }}
          <span v-if="quest.dlc" class="dlc-tag">(DLC)</span>
        </h1>
        <div class="hero-tags">
          <span class="tag region">
            <el-icon :size="12"><Location /></el-icon>
            {{ quest.region }}
          </span>
          <span class="tag length">{{ LENGTH_LABELS[quest.length] }}线</span>
          <span v-if="quest.missable" class="tag missable">存在错过节点</span>
          <span v-if="quest.ready" class="tag steps">{{ quest.steps.length }} 个步骤</span>
          <span v-else class="tag pending">攻略整理中</span>
        </div>
        <p class="hero-summary">{{ quest.summary }}</p>
      </div>
      <div class="hero-actions">
        <el-button
          :type="isCompleted(quest.id) ? 'success' : 'default'"
          :plain="!isCompleted(quest.id)"
          size="default"
          @click="toggleCompleted(quest.id)"
        >
          <el-icon style="margin-right: 4px"><Check /></el-icon>
          {{ isCompleted(quest.id) ? '已完成' : '标记完成' }}
        </el-button>
      </div>
    </header>

    <div class="detail-body">
      <!-- 左侧主内容 -->
      <div class="main-col">
        <!-- 步骤 -->
        <section v-if="quest.ready" class="panel">
          <h2 class="panel-title">
            <el-icon :size="15"><Position /></el-icon>
            推进流程
          </h2>
          <el-timeline class="steps">
            <el-timeline-item
              v-for="(step, index) in quest.steps"
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

        <section v-else class="panel pending-panel">
          <el-empty description="这条支线的完整步骤正在整理，先放出索引信息">
            <template #image>
              <el-icon :size="46" color="#5b4f2a"><Clock /></el-icon>
            </template>
          </el-empty>
          <p class="pending-note">
            已录入：{{ quest.name }} 起始于「{{ quest.region }}」，长度评价为
            {{ LENGTH_LABELS[quest.length] }}线{{ quest.missable ? '，且存在错过节点' : '' }}。
          </p>
        </section>

        <!-- 分支 -->
        <section v-if="quest.branches?.length" class="panel">
          <h2 class="panel-title">
            <el-icon :size="15"><Share /></el-icon>
            分支与结局
          </h2>
          <div class="branch-list">
            <div v-for="branch in quest.branches" :key="branch.label" class="branch-item">
              <span class="branch-label">{{ branch.label }}</span>
              <span class="branch-effect">{{ branch.effect }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- 右侧信息栏 -->
      <aside class="side-col">
        <section class="panel info-panel">
          <h2 class="panel-title">速览</h2>
          <dl class="info-list">
            <div class="info-row">
              <dt>起始位置</dt>
              <dd>{{ quest.startPoint || '待补充' }}</dd>
            </div>
            <div class="info-row">
              <dt>所在区域</dt>
              <dd>{{ quest.region }}</dd>
            </div>
            <div class="info-row">
              <dt>版本</dt>
              <dd>{{ quest.dlc ? 'DLC 黄金树幽影' : '本体' }}</dd>
            </div>
            <div class="info-row">
              <dt>长度</dt>
              <dd>{{ LENGTH_LABELS[quest.length] }}线</dd>
            </div>
            <div class="info-row">
              <dt>错过风险</dt>
              <dd :class="{ danger: quest.missable }">
                {{ quest.missable ? '有，推进主线前需完成' : '无' }}
              </dd>
            </div>
          </dl>
        </section>

        <section v-if="quest.prerequisites?.length" class="panel">
          <h2 class="panel-title">前置条件</h2>
          <ul class="plain-list">
            <li v-for="item in quest.prerequisites" :key="item">{{ item }}</li>
          </ul>
        </section>

        <section v-if="quest.rewards?.length" class="panel">
          <h2 class="panel-title">奖励</h2>
          <ul class="reward-list">
            <li v-for="item in quest.rewards" :key="item.name">
              <span class="reward-name">{{ item.name }}</span>
              <span v-if="item.note" class="reward-note">{{ item.note }}</span>
            </li>
          </ul>
        </section>

        <section v-if="quest.related?.length" class="panel">
          <h2 class="panel-title">关联支线</h2>
          <div class="related-list">
            <RouterLink
              v-for="id in quest.related"
              :key="id"
              :to="`/side-quests/${id}`"
              class="related-link"
            >
              {{ relatedName(id) }}
            </RouterLink>
          </div>
        </section>

        <section v-if="siblings.length" class="panel">
          <h2 class="panel-title">同区域支线</h2>
          <div class="related-list">
            <RouterLink
              v-for="item in siblings"
              :key="item.id"
              :to="`/side-quests/${item.id}`"
              class="related-link"
            >
              {{ item.name }}
              <span v-if="!item.ready" class="small-dim">整理中</span>
            </RouterLink>
          </div>
        </section>
      </aside>
    </div>

    <!-- 翻页 -->
    <nav class="pager">
      <button v-if="neighbors.prev" class="pager-btn" @click="goTo(neighbors.prev.id)">
        <span class="pager-label">上一条</span>
        <span class="pager-name">{{ neighbors.prev.name }}</span>
      </button>
      <span v-else class="pager-btn disabled">已经是第一条</span>
      <button v-if="neighbors.next" class="pager-btn right" @click="goTo(neighbors.next.id)">
        <span class="pager-label">下一条</span>
        <span class="pager-name">{{ neighbors.next.name }}</span>
      </button>
      <span v-else class="pager-btn right disabled">已经是最后一条</span>
    </nav>
  </div>

  <div v-else class="not-found">
    <el-empty description="没有找到这条支线">
      <el-button type="primary" plain @click="$router.push('/side-quests')">返回支线列表</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Location, Check, Position, Share, Clock } from '@element-plus/icons-vue'
import { LENGTH_LABELS, getQuest, neighborsOf, siblingsOf } from '../utils/quest'
import { useQuestProgress } from '../composables/useQuestProgress'

const route = useRoute()
const router = useRouter()
const { isCompleted, toggleCompleted } = useQuestProgress()

const quest = computed(() => getQuest(route.params.id))

const neighbors = computed(() => (quest.value ? neighborsOf(quest.value) : { prev: null, next: null }))
const siblings = computed(() => (quest.value ? siblingsOf(quest.value) : []))

function relatedName(id) {
  return getQuest(id)?.name || id
}

function goTo(id) {
  router.push(`/side-quests/${id}`)
}
</script>

<style scoped>
.quest-detail {
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

.detail-title {
  margin: 0 0 10px;
  font-size: 25px;
  letter-spacing: 2px;
  color: #d4af37;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.dlc-tag {
  font-size: 12px;
  color: #c98b3f;
  letter-spacing: 0;
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

.tag.missable {
  color: #c16b4f;
  background: rgba(193, 107, 79, 0.1);
  border-color: rgba(193, 107, 79, 0.3);
}

.tag.steps {
  color: #8fa88a;
  background: rgba(143, 168, 138, 0.1);
  border-color: rgba(143, 168, 138, 0.25);
}

.tag.pending {
  color: #6f6a5a;
  border-style: dashed;
  border-color: #3a352c;
  background: transparent;
}

.hero-summary {
  margin: 0;
  max-width: 640px;
  font-size: 13px;
  line-height: 1.75;
  color: #9d977f;
}

.hero-actions {
  flex-shrink: 0;
}

/* 主体布局 */
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

/* 分支 */
.branch-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.branch-item {
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-size: 13px;
  line-height: 1.7;
}

.branch-label {
  flex-shrink: 0;
  padding: 1px 8px;
  font-size: 11px;
  color: #c9a227;
  background: rgba(201, 162, 39, 0.1);
  border: 1px solid rgba(201, 162, 39, 0.25);
  border-radius: 4px;
}

.branch-effect {
  color: #a8a292;
}

/* 整理中 */
.pending-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pending-note {
  margin: 0 0 6px;
  font-size: 12px;
  color: #8a8574;
  text-align: center;
  line-height: 1.7;
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

.info-row dd.danger {
  color: #c16b4f;
}

.plain-list,
.reward-list {
  margin: 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 12px;
  line-height: 1.65;
  color: #a8a292;
}

.reward-list {
  padding-left: 0;
  list-style: none;
}

.reward-list li {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reward-name {
  color: #c9a227;
}

.reward-note {
  color: #6f6a5a;
  font-size: 11px;
}

.related-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.related-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
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

.small-dim {
  font-size: 10px;
  color: #6f6a5a;
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
