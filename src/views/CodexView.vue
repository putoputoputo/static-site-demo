<template>
  <div class="codex-page">
    <!-- 页头 -->
    <header class="page-hero">
      <div class="hero-text">
        <div class="hero-eyebrow">{{ module.eyebrow }}</div>
        <h1 class="hero-title">{{ module.title }}</h1>
        <p class="hero-sub">{{ module.intro }}</p>
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
          :placeholder="`搜索${module.itemLabel}名称 / 效果 / 获取地点`"
          clearable
          :prefix-icon="Search"
        />
        <el-select v-model="sortKey" class="sort-select">
          <el-option v-for="item in module.sortOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <div class="quick-toggles">
          <button class="chip" :class="{ active: onlyTop }" @click="onlyTop = !onlyTop">
            只看核心 / 强力
            <span class="chip-count">{{ topCount }}</span>
          </button>
          <button class="chip" :class="{ active: onlyDlc }" @click="onlyDlc = !onlyDlc">
            只看 DLC
            <span class="chip-count">{{ dlcCount }}</span>
          </button>
        </div>
      </div>

      <div class="filter-line category-line">
        <span class="line-label">{{ module.categoryLabel }}</span>
        <div class="chips">
          <button class="all-chip" :class="{ active: categories.length === 0 }" @click="categories = []">
            全部
            <span class="chip-count">{{ module.items.length }}</span>
          </button>
          <button
            v-for="item in categoryOptions"
            :key="item.id"
            class="chip"
            :class="{ active: categories.includes(item.id) }"
            @click="toggleCategory(item.id)"
          >
            {{ item.label }}
            <span class="chip-count">{{ item.count }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- 结果条 -->
    <div class="result-bar">
      <span>
        匹配 <strong>{{ filtered.length }}</strong> / {{ module.items.length }} {{ module.itemLabel }}
        <template v-if="categories.length">
          · 已选 {{ categories.map((id) => labelOf(id)).join('、') }}
        </template>
      </span>
      <el-button v-if="isFiltering" text type="warning" size="small" :icon="RefreshLeft" @click="resetFilters">
        清除筛选
      </el-button>
    </div>

    <!-- 卡片 -->
    <div v-if="filtered.length" class="codex-grid">
      <RouterLink
        v-for="item in visibleItems"
        :key="item.id"
        class="codex-card"
        :to="itemHref(module, item)"
      >
        <div class="card-head">
          <h2 class="card-name">
            {{ item.name }}
            <span v-if="item.dlc" class="dlc-tag">(DLC)</span>
          </h2>
          <span
            class="tier-badge"
            :style="{ color: tierColor(item.tier), borderColor: tierColor(item.tier) }"
            :title="`推荐度：${tierLabel(item.tier)}`"
          >
            {{ item.tier }}
          </span>
        </div>

        <div class="card-tags">
          <span class="mini-tag category">{{ item.category }}</span>
          <span v-if="item.role" class="mini-tag role">{{ item.role }}</span>
        </div>

        <div class="card-metrics">
          <span v-for="metric in item.metrics" :key="metric.label" class="metric">
            <em>{{ metric.label }}</em>
            <strong>{{ metric.value }}</strong>
          </span>
        </div>

        <p class="card-effect">{{ item.effect }}</p>

        <p class="card-location">
          <el-icon :size="12"><Location /></el-icon>
          <span>{{ item.location }}</span>
        </p>

        <div class="card-foot">
          <span class="tier-text" :style="{ color: tierColor(item.tier) }">
            {{ tierLabel(item.tier) }}
          </span>
          <el-icon class="arrow" :size="14"><ArrowRight /></el-icon>
        </div>
      </RouterLink>
    </div>

    <div v-if="visibleItems.length < filtered.length" class="load-more">
      <el-button plain @click="limit += 48">
        再显示 48 条（剩余 {{ filtered.length - visibleItems.length }}）
      </el-button>
    </div>

    <el-empty v-if="filtered.length === 0" description="没有符合条件的条目，换个关键词或清掉筛选试试">
      <el-button type="primary" plain @click="resetFilters">清除筛选</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Search, RefreshLeft, Location, ArrowRight } from '@element-plus/icons-vue'
import { getCodexModule } from '../data/codex'
import { categoryCounts, filterCodex, itemHref, sortCodex, tierColor, tierLabel } from '../utils/codex'

const props = defineProps({
  moduleKey: { type: String, required: true },
})

const module = computed(() => getCodexModule(props.moduleKey))

const keyword = ref('')
const categories = ref([])
const onlyDlc = ref(false)
const onlyTop = ref(false)
const sortKey = ref('default')
const limit = ref(48)

const categoryOptions = computed(() => categoryCounts(module.value.items, module.value.categories))

const dlcCount = computed(() => module.value.items.filter((item) => item.dlc).length)

const topCount = computed(() => module.value.items.filter((item) => ['S', 'A'].includes(item.tier)).length)

const highlights = computed(() => [
  { value: module.value.items.length, label: module.value.itemLabel },
  { value: categoryOptions.value.length, label: module.value.categoryLabel },
  { value: dlcCount.value, label: module.value.dlcLabel },
  { value: module.value.items.filter((item) => item.tier === 'S').length, label: module.value.tierLabel },
])

const filtered = computed(() => {
  const list = filterCodex(module.value.items, {
    keyword: keyword.value,
    categories: categories.value,
    onlyDlc: onlyDlc.value,
    onlyTop: onlyTop.value,
  })
  return sortCodex(list, sortKey.value)
})

const visibleItems = computed(() => filtered.value.slice(0, limit.value))

watch([keyword, categories, onlyDlc, onlyTop, sortKey], () => {
  limit.value = 48
})

const isFiltering = computed(
  () =>
    keyword.value.trim() !== '' ||
    categories.value.length > 0 ||
    onlyDlc.value ||
    onlyTop.value ||
    sortKey.value !== 'default'
)

function toggleCategory(id) {
  const index = categories.value.indexOf(id)
  if (index > -1) categories.value.splice(index, 1)
  else categories.value.push(id)
}

function labelOf(id) {
  return module.value.categories.find((item) => item.id === id)?.label || id
}

function resetFilters() {
  keyword.value = ''
  categories.value = []
  onlyDlc.value = false
  onlyTop.value = false
  sortKey.value = 'default'
}
</script>

<style scoped>
.codex-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* 页头 */
.page-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding: 26px 28px;
  border: 1px solid #3a3324;
  border-radius: 12px;
  background: linear-gradient(120deg, rgba(212, 175, 55, 0.14), transparent 65%), #1a1a1a;
}

.hero-text {
  min-width: 0;
}

.hero-eyebrow {
  margin-bottom: 6px;
  font-size: 11.5px;
  letter-spacing: 3px;
  color: #8a8574;
  text-transform: uppercase;
}

.hero-title {
  margin: 0 0 8px;
  font-size: 26px;
  letter-spacing: 2px;
  color: #d4af37;
}

.hero-sub {
  margin: 0;
  max-width: 620px;
  color: #9d977f;
  font-size: 13px;
  line-height: 1.75;
}

.hero-badges {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.hero-badge {
  min-width: 82px;
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
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
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

.sort-select {
  width: 190px;
}

.line-label {
  width: 40px;
  flex-shrink: 0;
  font-size: 13px;
  color: #8a8574;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-toggles {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.all-chip,
.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  font-size: 13px;
  color: #b8b2a0;
  background: #202020;
  border: 1px solid #383225;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.18s;
}

.all-chip:hover,
.chip:hover {
  color: #d4af37;
  border-color: #6b5c2e;
}

.all-chip.active,
.chip.active {
  color: #121212;
  font-weight: 600;
  background: #d4af37;
  border-color: #d4af37;
}

.chip-count {
  font-size: 11px;
  opacity: 0.65;
}

/* 结果条 */
.result-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #8a8574;
}

.result-bar strong {
  color: #d4af37;
}

/* 卡片 */
.codex-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.codex-card {
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 18px;
  border: 1px solid #332d20;
  border-radius: 10px;
  background: #1c1c1c;
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}

.codex-card:hover {
  border-color: #d4af37;
  transform: translateY(-3px);
  box-shadow: 0 10px 26px rgba(212, 175, 55, 0.1);
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.card-name {
  margin: 0;
  font-size: 17px;
  line-height: 1.4;
  color: #e5e3d8;
}

.dlc-tag {
  margin-left: 2px;
  font-size: 11px;
  font-weight: 400;
  color: #c98b3f;
}

.tier-badge {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.02);
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mini-tag {
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
}

.mini-tag.category {
  color: #d4af37;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.mini-tag.role {
  color: #9aa7b8;
  background: #202429;
  border: 1px solid #33404d;
}

.card-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 9px 11px;
  border: 1px solid #2a2519;
  border-radius: 8px;
  background: #161616;
}

.metric {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  font-size: 11.5px;
}

.metric em {
  font-style: normal;
  color: #7a7565;
}

.metric strong {
  font-weight: 600;
  color: #e5e3d8;
  font-variant-numeric: tabular-nums;
}

.card-effect {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: #9d977f;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-location {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin: 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: #7a7565;
}

.card-location .el-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.card-location span {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px dashed #332d20;
  font-size: 12px;
}

.tier-text {
  font-weight: 600;
}

.arrow {
  margin-left: auto;
  color: #6b6555;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 6px 0 2px;
}

@media (max-width: 1100px) {
  .codex-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .page-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 680px) {
  .codex-grid {
    grid-template-columns: 1fr;
  }
  .search-input,
  .sort-select {
    width: 100%;
  }
  .quick-toggles {
    margin-left: 0;
  }
  .hero-badges {
    flex-wrap: wrap;
  }
}
</style>
