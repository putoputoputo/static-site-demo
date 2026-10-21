<template>
  <div class="archetype-page">
    <el-breadcrumb class="crumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>流派库</el-breadcrumb-item>
    </el-breadcrumb>

    <header class="page-hero">
      <div class="hero-text">
        <h1 class="hero-title">流派库</h1>
        <p class="hero-sub">
          十套能直接抄的成型路线。每套都写清楚了：先加什么点、先去哪张图拿什么、
          四件护符为什么放一起、哪一步是新手最容易走错的。挑一套点进去，看完就能上手。
        </p>
      </div>
      <div class="hero-stats">
        <div class="stat">
          <strong>{{ archetypeList.length }}</strong>
          <span>套流派</span>
        </div>
        <div class="stat">
          <strong>{{ archetypeFilterOptions.primaries.length }}</strong>
          <span>条属性线</span>
        </div>
        <div class="stat">
          <strong>{{ archetypeList.reduce((sum, item) => sum + item.phases.length, 0) }}</strong>
          <span>个成型阶段</span>
        </div>
      </div>
    </header>

    <!-- 筛选 -->
    <div class="filters">
      <div class="search-box">
        <el-icon :size="14" class="search-icon"><Search /></el-icon>
        <input
          v-model="keyword"
          class="search-input"
          type="text"
          placeholder="搜流派名、武器或玩法（试试「出血」「跳劈」「岩石球」）"
        />
        <button v-if="keyword" type="button" class="clear-btn" @click="keyword = ''">清除</button>
      </div>

      <div class="filter-row">
        <span class="filter-label">加点主属性</span>
        <div class="chips">
          <button
            type="button"
            class="chip"
            :class="{ on: primary === 'all' }"
            @click="primary = 'all'"
          >
            全部
          </button>
          <button
            v-for="name in archetypeFilterOptions.primaries"
            :key="name"
            type="button"
            class="chip"
            :class="{ on: primary === name }"
            @click="primary = name"
          >
            <i class="dot" :style="{ background: primaryColor(name) }"></i>
            {{ name }}
            <em>{{ countByPrimary(name) }}</em>
          </button>
        </div>
      </div>

      <div class="filter-row">
        <span class="filter-label">成型阶段</span>
        <div class="chips">
          <button type="button" class="chip" :class="{ on: stage === 'all' }" @click="stage = 'all'">
            全部
          </button>
          <button
            v-for="item in archetypeFilterOptions.stages"
            :key="item.key"
            type="button"
            class="chip"
            :class="{ on: stage === item.key }"
            :title="item.hint"
            @click="stage = item.key"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>

    <p class="result-line">
      共 {{ filtered.length }} 套
      <span v-if="keyword || primary !== 'all' || stage !== 'all'" class="result-hint">
        · 筛选条件写在地址里，把链接发出去对方看到的是同一批
      </span>
    </p>

    <div v-if="filtered.length" class="card-grid">
      <RouterLink
        v-for="item in filtered"
        :key="item.id"
        :to="`/archetypes/${item.id}`"
        class="card"
        :style="{ '--primary': primaryColor(item.primary) }"
      >
        <div class="card-top">
          <div class="card-head">
            <span class="primary-tag">{{ item.primary }}</span>
            <span class="stage-tag">{{ stageLabel(item.stage) }}</span>
          </div>
          <span class="card-diff" :title="`上手难度 ${item.difficulty} / 5`">
            <i v-for="n in 5" :key="n" class="pip" :class="{ on: n <= item.difficulty }"></i>
          </span>
        </div>

        <h2 class="card-title">{{ item.name }}</h2>
        <p class="card-alias">{{ item.alias.join(' · ') }}</p>
        <p class="card-summary">{{ item.summary }}</p>

        <div class="card-tags">
          <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>

        <div class="card-meta">
          <div class="meta-cell">
            <span class="meta-label">核心武器</span>
            <span class="meta-value">{{ item.items.main?.name }}</span>
          </div>
          <div class="meta-cell">
            <span class="meta-label">武器 + 护符</span>
            <span class="meta-value">{{ item.load.weight.toFixed(1) }}</span>
          </div>
          <div class="meta-cell">
            <span class="meta-label">留给护甲</span>
            <span class="meta-value">{{ item.load.armorRoom.toFixed(1) }}</span>
          </div>
        </div>

        <span class="card-go">
          看成型路线
          <el-icon :size="12"><ArrowRight /></el-icon>
        </span>
      </RouterLink>
    </div>

    <div v-else class="empty">
      <p class="empty-title">没有匹配的流派</p>
      <p class="empty-sub">换个关键词，或者把筛选条件放宽一点。</p>
      <button type="button" class="empty-btn" @click="resetFilters">清空筛选</button>
    </div>

    <p class="page-note">
      负重一栏只算武器与护符 —— 护甲每个人穿得不一样，所以这里给的是「还剩多少负重留给护甲」。
      想要精确到每一件，点进任意流派，用「带进构筑器」把整套塞进去自己调。
    </p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ArrowRight, Search } from '@element-plus/icons-vue'
import {
  archetypeFilterOptions,
  archetypeList,
  filterArchetypes,
  primaryColor,
  stageLabel,
} from '../utils/archetypes.js'
import { useQuerySync } from '../composables/useQuerySync.js'

const keyword = ref('')
const primary = ref('all')
const stage = ref('all')

useQuerySync({ q: keyword, attr: primary, stage }, { attr: 'all', stage: 'all' })

const filtered = computed(() =>
  filterArchetypes({ keyword: keyword.value, primary: primary.value, stage: stage.value })
)

function countByPrimary(name) {
  return archetypeList.filter((item) => item.primary === name).length
}

function resetFilters() {
  keyword.value = ''
  primary.value = 'all'
  stage.value = 'all'
}
</script>

<style scoped>
.archetype-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.crumb {
  font-size: 13px;
}

.page-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  padding: 26px 28px;
  border: 1px solid #332d20;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e1c16 0%, #16150f 100%);
}

.hero-text {
  flex: 1;
  min-width: 0;
}

.hero-title {
  margin: 0 0 8px;
  font-size: 28px;
  letter-spacing: 1px;
  color: #f0ead6;
}

.hero-sub {
  margin: 0;
  max-width: 720px;
  font-size: 13px;
  line-height: 1.9;
  color: #9d9788;
}

.hero-stats {
  display: flex;
  gap: 22px;
  padding-bottom: 4px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.stat strong {
  font-size: 22px;
  color: #d4af37;
  font-variant-numeric: tabular-nums;
}

.stat span {
  font-size: 11px;
  color: #7c7668;
}

/* 筛选 */
.filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  border: 1px solid #302b20;
  border-radius: 10px;
  background: #1a1914;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 40px;
  border: 1px solid #3a3427;
  border-radius: 8px;
  background: #14130f;
}

.search-icon {
  color: #6d6759;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #e5e3d8;
  font-size: 13px;
  font-family: inherit;
}

.search-input::placeholder {
  color: #665f52;
}

.clear-btn {
  padding: 2px 6px;
  border: none;
  background: transparent;
  color: #8c8577;
  font-size: 11px;
  cursor: pointer;
}

.clear-btn:hover {
  color: #d4af37;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  width: 68px;
  flex-shrink: 0;
  font-size: 12px;
  color: #7c7668;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border: 1px solid #393325;
  border-radius: 999px;
  background: #1d1b15;
  color: #b5ae9c;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.chip:hover {
  border-color: #55492c;
  color: #ddd6c2;
}

.chip.on {
  border-color: #d4af37;
  background: #2a2413;
  color: #f0dda0;
}

.chip em {
  font-style: normal;
  font-size: 10px;
  color: #6f6959;
}

.chip.on em {
  color: #b99b47;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.result-line {
  margin: -4px 0 0;
  font-size: 12px;
  color: #7c7668;
}

.result-hint {
  color: #5f5a4d;
}

/* 卡片 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px 16px;
  border: 1px solid #332d20;
  border-radius: 12px;
  background: linear-gradient(160deg, #1c1a15 0%, #17160f 100%);
  text-decoration: none;
  overflow: hidden;
  transition: transform 0.16s, border-color 0.16s;
}

.card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 2px;
  background: var(--primary);
  opacity: 0.55;
}

.card:hover {
  transform: translateY(-2px);
  border-color: #4d4229;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card-head {
  display: flex;
  gap: 6px;
}

.primary-tag {
  padding: 2px 8px;
  border-radius: 4px;
  background: #262115;
  color: var(--primary);
  font-size: 11px;
}

.stage-tag {
  padding: 2px 8px;
  border: 1px solid #3a3427;
  border-radius: 4px;
  color: #8f8877;
  font-size: 11px;
}

.card-diff {
  display: inline-flex;
  gap: 3px;
}

.pip {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #353024;
}

.pip.on {
  background: #c9a53c;
}

.card-title {
  margin: 2px 0 0;
  font-size: 19px;
  color: #f0ead6;
}

.card-alias {
  margin: -4px 0 0;
  font-size: 11px;
  color: #6f6959;
}

.card-summary {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.85;
  color: #a09a8b;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}

.tag {
  padding: 2px 7px;
  border: 1px solid #333026;
  border-radius: 3px;
  color: #8a8474;
  font-size: 10.5px;
}

.card-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 6px;
  padding-top: 12px;
  border-top: 1px solid #2b271d;
}

.meta-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.meta-label {
  font-size: 10.5px;
  color: #6d6759;
}

.meta-value {
  font-size: 12.5px;
  color: #cfc7b2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-variant-numeric: tabular-nums;
}

.card-go {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 11.5px;
  color: #8a7c4a;
  transition: gap 0.16s, color 0.16s;
}

.card:hover .card-go {
  gap: 7px;
  color: #d4af37;
}

/* 空态 */
.empty {
  padding: 60px 20px;
  text-align: center;
  border: 1px dashed #332d20;
  border-radius: 12px;
}

.empty-title {
  margin: 0 0 6px;
  font-size: 15px;
  color: #cfc7b2;
}

.empty-sub {
  margin: 0 0 16px;
  font-size: 12.5px;
  color: #7c7668;
}

.empty-btn {
  padding: 7px 16px;
  border: 1px solid #4a3f22;
  border-radius: 6px;
  background: #241f13;
  color: #d4af37;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
}

.page-note {
  margin: 4px 0 0;
  padding: 14px 16px;
  border-left: 2px solid #3d3524;
  background: #191812;
  font-size: 12px;
  line-height: 1.9;
  color: #857e6e;
}

@media (max-width: 900px) {
  .page-hero {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .hero-stats {
    width: 100%;
    justify-content: flex-start;
    gap: 28px;
  }

  .stat {
    align-items: flex-start;
  }

  .card-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 680px) {
  .page-hero {
    padding: 20px 18px;
  }

  .hero-title {
    font-size: 23px;
  }

  .filter-row {
    align-items: flex-start;
  }

  .filter-label {
    width: 100%;
  }

  .card-meta {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }
}
</style>
