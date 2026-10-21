<template>
  <div v-if="item" class="detail-page" :style="{ '--primary': primaryColor(item.primary) }">
    <el-breadcrumb class="crumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/archetypes' }">流派库</el-breadcrumb-item>
      <el-breadcrumb-item>{{ item.name }}</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 头部 -->
    <header class="detail-hero">
      <div class="hero-main">
        <div class="badge-row">
          <span class="tag primary">{{ item.primary }}</span>
          <span class="tag stage">{{ stageLabel(item.stage) }}</span>
          <span class="tag diff">
            难度
            <i v-for="n in 5" :key="n" class="pip" :class="{ on: n <= item.difficulty }"></i>
            {{ difficultyLabel(item.difficulty) }}
          </span>
        </div>
        <h1 class="hero-title">{{ item.name }}</h1>
        <p class="hero-alias">{{ item.alias.join(' · ') }}</p>
        <p class="hero-summary">{{ item.summary }}</p>

        <div class="hero-actions">
          <RouterLink :to="buildLink" class="cta">
            <el-icon :size="14"><SetUp /></el-icon>
            带进构筑器
          </RouterLink>
          <button type="button" class="ghost-btn" @click="copyLink">
            <el-icon :size="13"><CopyDocument /></el-icon>
            {{ copied ? '已复制' : '复制本页链接' }}
          </button>
        </div>
      </div>

      <div class="hero-side">
        <div class="side-item">
          <span class="side-label">属性合计</span>
          <strong class="side-value">{{ item.total }}</strong>
          <span class="side-note">约 {{ item.total - 79 }} 级毕业</span>
        </div>
        <div class="side-item">
          <span class="side-label">武器 + 护符</span>
          <strong class="side-value">{{ item.load.weight.toFixed(1) }}</strong>
          <span class="side-note">耐力 {{ item.load.enduranceNow }} · 上限 {{ item.load.max.toFixed(1) }}</span>
        </div>
        <div class="side-item">
          <span class="side-label">留给护甲</span>
          <strong class="side-value accent">{{ item.load.armorRoom.toFixed(1) }}</strong>
          <span class="side-note">护甲不在此处计算</span>
        </div>
        <div class="side-item">
          <span class="side-label">记忆格</span>
          <strong class="side-value">{{ item.load.spellSlots }}</strong>
          <span class="side-note">{{ item.load.spellFp }} FP 全放一轮</span>
        </div>
      </div>
    </header>

    <!-- 为什么是这套 -->
    <section class="prose">
      <p v-for="(text, index) in item.hook" :key="index">{{ text }}</p>
    </section>

    <!-- 毕业配装 -->
    <section class="section">
      <div class="section-head">
        <h2 class="section-title">毕业配装</h2>
        <span class="section-meta">点装备名进图鉴看数值与获取位置</span>
      </div>

      <div v-for="group in groups" :key="group.key" class="gear-group">
        <div class="group-head">
          <h3 class="group-title">{{ group.label }}</h3>
          <span class="group-note">{{ group.note }}</span>
        </div>
        <div class="gear-grid" :class="group.key">
          <RouterLink
            v-for="gear in group.list"
            :key="`${gear.kind}-${gear.id}-${gear.name}`"
            :to="gear.to"
            class="gear-card"
          >
            <div class="gear-top">
              <span class="gear-name">{{ gear.name }}</span>
              <span class="gear-sub">{{ gear.sub }}</span>
            </div>
            <p v-if="gear.note" class="gear-note">{{ gear.note }}</p>
            <p v-else class="gear-note muted">{{ gear.effect }}</p>
            <p class="gear-loc">
              <el-icon :size="11"><Location /></el-icon>
              {{ gear.location }}
            </p>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- 属性 -->
    <section class="section">
      <div class="section-head">
        <h2 class="section-title">属性与加点顺序</h2>
        <span class="section-meta">先点哪个比点多少更重要</span>
      </div>

      <div class="attr-layout">
        <div class="attr-panel">
          <div v-for="row in statRowList" :key="row.key" class="attr-row">
            <span class="attr-label" :class="{ major: row.major }">{{ row.label }}</span>
            <div class="attr-bar">
              <i class="attr-fill" :class="{ major: row.major }" :style="{ width: `${row.percent}%` }"></i>
            </div>
            <span class="attr-value">{{ row.value }}</span>
          </div>
        </div>

        <ol class="plan-list">
          <li v-for="plan in item.statPlan" :key="plan.level" class="plan-item">
            <span class="plan-level">{{ plan.level }}</span>
            <p class="plan-text">{{ plan.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- 成型路线 -->
    <section class="section">
      <div class="section-head">
        <h2 class="section-title">成型路线</h2>
        <span class="section-meta">{{ item.phases.length }} 个阶段，从开局到毕业</span>
      </div>

      <div class="timeline">
        <div v-for="(phase, index) in item.phases" :key="phase.title" class="phase">
          <div class="phase-rail">
            <span class="phase-dot">{{ index + 1 }}</span>
            <i v-if="index < item.phases.length - 1" class="phase-line"></i>
          </div>
          <div class="phase-body">
            <div class="phase-head">
              <h3 class="phase-title">{{ phase.title }}</h3>
              <span class="phase-level">{{ phase.level }}</span>
            </div>
            <p class="phase-goal">{{ phase.goal }}</p>
            <ul class="step-list">
              <li v-for="step in phase.steps" :key="step">{{ step }}</li>
            </ul>
            <div v-if="gearOf(phase).length" class="phase-gear">
              <span class="phase-gear-label">这一阶段</span>
              <RouterLink v-for="gear in gearOf(phase)" :key="gear.name" :to="gear.to" class="gear-chip">
                {{ gear.name }}
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 打法 -->
    <section class="section">
      <div class="section-head">
        <h2 class="section-title">打法循环</h2>
        <span class="section-meta">照着这个顺序打，比背招式表有用</span>
      </div>
      <ol class="loop-list">
        <li v-for="(step, index) in item.loop" :key="step" class="loop-item">
          <span class="loop-num">{{ String(index + 1).padStart(2, '0') }}</span>
          <p>{{ step }}</p>
        </li>
      </ol>
    </section>

    <!-- 优缺点 -->
    <section class="section">
      <div class="pc-grid">
        <div class="pc-card good">
          <h3 class="pc-title">强在哪</h3>
          <ul class="pc-list">
            <li v-for="text in item.pros" :key="text">{{ text }}</li>
          </ul>
        </div>
        <div class="pc-card bad">
          <h3 class="pc-title">短板在哪</h3>
          <ul class="pc-list">
            <li v-for="text in item.cons" :key="text">{{ text }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 误区 -->
    <section class="section">
      <div class="section-head">
        <h2 class="section-title">常见误区</h2>
        <span class="section-meta">这几条踩过的人最多</span>
      </div>
      <ul class="mistake-list">
        <li v-for="text in item.mistakes" :key="text" class="mistake-item">
          <el-icon :size="13" class="mistake-icon"><Warning /></el-icon>
          <span>{{ text }}</span>
        </li>
      </ul>
    </section>

    <!-- 可替换 -->
    <section v-if="item.swaps?.length" class="section">
      <div class="section-head">
        <h2 class="section-title">可以换什么</h2>
        <span class="section-meta">同定位的替代件，按你手上的资源挑</span>
      </div>
      <div class="swap-list">
        <div v-for="swap in item.swaps" :key="`${swap.from}-${swap.to}`" class="swap-row">
          <span class="swap-slot">{{ swap.slot }}</span>
          <span class="swap-from">{{ swap.from }}</span>
          <el-icon :size="12" class="swap-arrow"><Right /></el-icon>
          <span class="swap-to">{{ swap.to }}</span>
          <span class="swap-note">{{ swap.note }}</span>
        </div>
      </div>
    </section>

    <!-- 上下篇 -->
    <nav class="neighbor-nav">
      <RouterLink v-if="neighbors.prev" :to="`/archetypes/${neighbors.prev.id}`" class="neighbor prev">
        <span class="neighbor-label">上一套</span>
        <span class="neighbor-name">{{ neighbors.prev.name }}</span>
      </RouterLink>
      <span v-else class="neighbor placeholder"></span>

      <RouterLink v-if="neighbors.next" :to="`/archetypes/${neighbors.next.id}`" class="neighbor next">
        <span class="neighbor-label">下一套</span>
        <span class="neighbor-name">{{ neighbors.next.name }}</span>
      </RouterLink>
      <span v-else class="neighbor placeholder"></span>
    </nav>
  </div>

  <div v-else class="missing">
    <h1 class="missing-title">没有这套流派</h1>
    <p class="missing-sub">链接里的流派不存在，或者名字拼错了。</p>
    <RouterLink to="/archetypes" class="missing-btn">回流派库看看</RouterLink>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { CopyDocument, Location, Right, SetUp, Warning } from '@element-plus/icons-vue'
import {
  archetypeDetail,
  archetypeNeighbors,
  buildLinkOf,
  difficultyLabel,
  primaryColor,
  resolveGear,
  stageLabel,
  statRows,
} from '../utils/archetypes.js'

const route = useRoute()
const copied = ref(false)

const item = computed(() => archetypeDetail(String(route.params.id || '')))
const buildLink = computed(() => (item.value ? buildLinkOf(item.value) : '/build'))
const neighbors = computed(() => (item.value ? archetypeNeighbors(item.value.id) : { prev: null, next: null }))
const statRowList = computed(() => (item.value ? statRows(item.value) : []))

// 分组展示：武器 / 护符 / 法术 / 骨灰。空组直接不渲染，法术流就不会留一块空白
const groups = computed(() => {
  if (!item.value) return []
  const { items, load } = item.value
  return [
    {
      key: 'weapon',
      label: '武器',
      note: items.off ? '主手 + 副手' : '单手持握',
      list: items.weapons,
    },
    {
      key: 'talisman',
      label: '护符',
      note: `${items.talismans.length} 个栏位`,
      list: items.talismans,
    },
    {
      key: 'spell',
      label: '记忆格法术',
      note: `${load.spellSlots} 格 · 全放一轮 ${load.spellFp} FP`,
      list: items.spells,
    },
    {
      key: 'spirit',
      label: '骨灰',
      note: '进场先招',
      list: items.spirit ? [items.spirit] : [],
    },
  ].filter((group) => group.list.length)
})

function gearOf(phase) {
  return item.value ? resolveGear(item.value, phase.gear) : []
}

async function copyLink() {
  if (typeof window === 'undefined') return
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch {
    // 非 https 或剪贴板未授权时退回让用户自己复制
    window.prompt('复制下面的链接：', url)
  }
}
</script>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.crumb {
  font-size: 13px;
}

/* 头部 */
.detail-hero {
  display: flex;
  gap: 30px;
  padding: 26px 28px;
  border: 1px solid #332d20;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e1c16 0%, #16150f 100%);
  border-left: 3px solid var(--primary);
}

.hero-main {
  flex: 1;
  min-width: 0;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.tag.primary {
  background: #262115;
  color: var(--primary);
}

.tag.stage {
  border: 1px solid #3a3427;
  color: #8f8877;
}

.tag.diff {
  color: #9a9280;
}

.pip {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #3b3527;
}

.pip.on {
  background: #c9a53c;
}

.hero-title {
  margin: 0 0 4px;
  font-size: 30px;
  letter-spacing: 1px;
  color: #f0ead6;
}

.hero-alias {
  margin: 0 0 10px;
  font-size: 12px;
  color: #6f6959;
}

.hero-summary {
  margin: 0;
  max-width: 660px;
  font-size: 13.5px;
  line-height: 1.9;
  color: #b3ab99;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 7px;
  background: linear-gradient(135deg, #d4af37 0%, #b08d26 100%);
  color: #1b1608;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: filter 0.15s;
}

.cta:hover {
  filter: brightness(1.1);
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border: 1px solid #423a28;
  border-radius: 7px;
  background: transparent;
  color: #a9a08c;
  font-size: 12.5px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.ghost-btn:hover {
  border-color: #5c4f31;
  color: #d9d2be;
}

.hero-side {
  display: grid;
  grid-template-columns: repeat(2, minmax(110px, 1fr));
  gap: 10px;
  align-content: start;
  min-width: 260px;
}

.side-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid #2f2a1f;
  border-radius: 8px;
  background: #1a1813;
}

.side-label {
  font-size: 10.5px;
  color: #6d6759;
}

.side-value {
  font-size: 19px;
  color: #ddd5c0;
  font-variant-numeric: tabular-nums;
}

.side-value.accent {
  color: var(--primary);
}

.side-note {
  font-size: 10px;
  color: #5f5a4d;
}

/* 段落 */
.prose {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px;
  border-left: 2px solid #3d3524;
  background: #191812;
}

.prose p {
  margin: 0;
  font-size: 13px;
  line-height: 2;
  color: #a9a294;
}

/* 通用 section */
.section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #2c2820;
}

.section-title {
  margin: 0;
  font-size: 16px;
  color: #e8e2cf;
  letter-spacing: 0.5px;
}

.section-meta {
  font-size: 11.5px;
  color: #6d6759;
}

/* 装备 */
.gear-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.group-title {
  margin: 0;
  font-size: 13px;
  color: #c8bfa9;
}

.group-note {
  font-size: 11px;
  color: #6d6759;
}

.gear-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.gear-grid.talisman {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.gear-grid.spirit,
.gear-grid.spell {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.gear-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid #302b20;
  border-radius: 9px;
  background: #1a1914;
  text-decoration: none;
  transition: border-color 0.15s, transform 0.15s;
}

.gear-card:hover {
  border-color: #55492c;
  transform: translateY(-1px);
}

.gear-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.gear-name {
  font-size: 13.5px;
  color: #e2dac5;
}

.gear-card:hover .gear-name {
  color: #f0dda0;
}

.gear-sub {
  flex-shrink: 0;
  font-size: 10.5px;
  color: #6f6959;
}

.gear-note {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.75;
  color: #98917f;
}

.gear-note.muted {
  color: #7c7668;
}

.gear-loc {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin: 0;
  font-size: 10.5px;
  line-height: 1.6;
  color: #5f5a4d;
}

.gear-loc :deep(svg) {
  margin-top: 2px;
  flex-shrink: 0;
}

/* 属性 */
.attr-layout {
  display: grid;
  grid-template-columns: minmax(220px, 0.85fr) minmax(0, 1.15fr);
  gap: 24px;
}

.attr-panel {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.attr-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 26px;
  align-items: center;
  gap: 10px;
}

.attr-label {
  font-size: 11.5px;
  color: #8a8374;
}

.attr-label.major {
  color: var(--primary);
}

.attr-bar {
  height: 6px;
  border-radius: 3px;
  background: #232019;
  overflow: hidden;
}

.attr-fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: #4a4436;
}

.attr-fill.major {
  background: var(--primary);
}

.attr-value {
  font-size: 12px;
  text-align: right;
  color: #c5bda8;
  font-variant-numeric: tabular-nums;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.plan-item {
  display: flex;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #2a261d;
}

.plan-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.plan-level {
  flex-shrink: 0;
  width: 62px;
  font-size: 11.5px;
  color: #c9a53c;
  font-variant-numeric: tabular-nums;
}

.plan-text {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.85;
  color: #a09a8b;
}

/* 时间轴 */
.timeline {
  display: flex;
  flex-direction: column;
}

.phase {
  display: flex;
  gap: 14px;
}

.phase-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 26px;
}

.phase-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid #4a3f22;
  border-radius: 50%;
  background: #241f13;
  color: #d4af37;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.phase-line {
  flex: 1;
  width: 1px;
  margin: 4px 0;
  background: linear-gradient(to bottom, #3a3324, #262219);
}

.phase-body {
  flex: 1;
  min-width: 0;
  padding-bottom: 22px;
}

.phase-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.phase-title {
  margin: 0;
  font-size: 14px;
  color: #e2dac5;
}

.phase-level {
  font-size: 11px;
  color: #8a7c4a;
}

.phase-goal {
  margin: 5px 0 8px;
  font-size: 12.5px;
  color: #a09a8b;
}

.step-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.step-list li {
  font-size: 12.5px;
  line-height: 1.85;
  color: #938c7d;
}

.step-list li::marker {
  color: #5c5340;
}

.phase-gear {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
}

.phase-gear-label {
  font-size: 10.5px;
  color: #6d6759;
}

.gear-chip {
  padding: 3px 9px;
  border: 1px solid #35301f;
  border-radius: 999px;
  background: #1d1b15;
  color: #a9a08c;
  font-size: 11px;
  text-decoration: none;
}

.gear-chip:hover {
  border-color: #55492c;
  color: #d4af37;
}

/* 打法 */
.loop-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.loop-item {
  display: flex;
  gap: 14px;
  padding: 11px 14px;
  border: 1px solid #2c2820;
  border-radius: 8px;
  background: #1a1914;
}

.loop-num {
  flex-shrink: 0;
  font-size: 11px;
  color: #6b6034;
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
}

.loop-item p {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.85;
  color: #a9a294;
}

/* 优缺点 */
.pc-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.pc-card {
  padding: 16px 18px;
  border: 1px solid #2f2a1f;
  border-radius: 10px;
  background: #1a1914;
}

.pc-card.good {
  border-left: 2px solid #6b8f5e;
}

.pc-card.bad {
  border-left: 2px solid #a86a5c;
}

.pc-title {
  margin: 0 0 10px;
  font-size: 13px;
  color: #d0c8b3;
}

.pc-list {
  margin: 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.pc-list li {
  font-size: 12.5px;
  line-height: 1.8;
  color: #9d9686;
}

.pc-card.good .pc-list li::marker {
  color: #6b8f5e;
}

.pc-card.bad .pc-list li::marker {
  color: #a86a5c;
}

/* 误区 */
.mistake-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.mistake-item {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 11px 14px;
  border: 1px solid #33291f;
  border-radius: 8px;
  background: #1c1813;
  font-size: 12.5px;
  line-height: 1.85;
  color: #a99f8d;
}

.mistake-icon {
  flex-shrink: 0;
  margin-top: 3px;
  color: #b98a4a;
}

/* 替换 */
.swap-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.swap-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid #2c2820;
  border-radius: 8px;
  background: #1a1914;
  font-size: 12px;
}

.swap-slot {
  padding: 1px 7px;
  border-radius: 3px;
  background: #262115;
  color: #a89a63;
  font-size: 10.5px;
}

.swap-from {
  color: #8f887a;
  text-decoration: line-through;
}

.swap-arrow {
  color: #6d6759;
}

.swap-to {
  color: #ddd5c0;
}

.swap-note {
  flex: 1;
  min-width: 180px;
  color: #7c7668;
  font-size: 11.5px;
  line-height: 1.7;
}

/* 上下篇 */
.neighbor-nav {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 6px;
}

.neighbor {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 18px;
  border: 1px solid #2f2a1f;
  border-radius: 10px;
  background: #1a1914;
  text-decoration: none;
  transition: border-color 0.15s;
}

.neighbor.next {
  text-align: right;
}

.neighbor:not(.placeholder):hover {
  border-color: #55492c;
}

.neighbor.placeholder {
  border-style: dashed;
  opacity: 0.4;
}

.neighbor-label {
  font-size: 10.5px;
  color: #6d6759;
}

.neighbor-name {
  font-size: 13.5px;
  color: #ddd5c0;
}

/* 空态 */
.missing {
  padding: 80px 20px;
  text-align: center;
}

.missing-title {
  margin: 0 0 8px;
  font-size: 22px;
  color: #e8e2cf;
}

.missing-sub {
  margin: 0 0 20px;
  font-size: 13px;
  color: #857e6e;
}

.missing-btn {
  display: inline-block;
  padding: 9px 20px;
  border: 1px solid #4a3f22;
  border-radius: 7px;
  background: #241f13;
  color: #d4af37;
  font-size: 12.5px;
  text-decoration: none;
}

@media (max-width: 1000px) {
  .detail-hero {
    flex-direction: column;
    gap: 20px;
  }

  .hero-side {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    min-width: 0;
  }

  .gear-grid.talisman {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .gear-grid.spirit,
  .gear-grid.spell {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .attr-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }
}

@media (max-width: 680px) {
  .detail-hero {
    padding: 20px 18px;
  }

  .hero-title {
    font-size: 24px;
  }

  .hero-side {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .gear-grid,
  .gear-grid.talisman,
  .gear-grid.spirit,
  .gear-grid.spell {
    grid-template-columns: minmax(0, 1fr);
  }

  .pc-grid,
  .neighbor-nav {
    grid-template-columns: minmax(0, 1fr);
  }

  .neighbor.next {
    text-align: left;
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
