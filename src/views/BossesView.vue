<template>
  <div class="boss-page">
    <el-breadcrumb class="crumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>BOSS 攻略</el-breadcrumb-item>
    </el-breadcrumb>

    <header class="page-hero">
      <div class="hero-text">
        <h1 class="hero-title">BOSS 攻略</h1>
        <p class="hero-sub">
          交界地 {{ stats.total }} 个 BOSS，每一个都写清了三件事：
          <strong>打之前要准备什么</strong>（推荐等级 / 强化等级 / 幽影树祝福）、
          <strong>什么属性打得动</strong>（弱点与抗性）、
          <strong>具体怎么打</strong>（阶段变化与关键招式）。追忆 BOSS 还会直接告诉你追忆能换什么。
        </p>
        <div class="hero-legend">
          <span class="legend-item"><i class="dot base"></i>本体</span>
          <span class="legend-item"><i class="dot dlc"></i>黄金树幽影</span>
          <span class="legend-item"><i class="dot required"></i>主线必打</span>
          <span class="legend-item"><i class="dot remembrance"></i>掉落追忆</span>
        </div>
      </div>
      <div class="hero-badges">
        <div v-for="item in highlights" :key="item.label" class="hero-badge">
          <span class="badge-value">{{ item.value }}</span>
          <span class="badge-label">{{ item.label }}</span>
        </div>
      </div>
    </header>

    <section class="notice">
      <el-icon :size="15" color="#d4af37"><InfoFilled /></el-icon>
      <p>
        弱点只写有把握的：不同站点对同一只 BOSS 的属性弱点经常互相矛盾，凡是没有把握的一律留空，
        界面上显示「无特别弱点记录」，强过写一个错的让你把武器附错属性。
        通用规律仍然成立 —— 毛多弱火、重甲弱雷、亡灵弱圣、石像弱打击。
      </p>
    </section>

    <!-- 筛选 -->
    <section class="filter-panel">
      <el-input
        v-model="keyword"
        class="search-input"
        placeholder="搜索 BOSS、区域、地点、弱点或掉落，例如 玛莲妮亚、出血、女武神"
        clearable
        :prefix-icon="Search"
      />
      <el-select v-model="region" class="region-select" placeholder="全部区域">
        <el-option label="全部区域" value="all" />
        <el-option-group v-for="layer in layers" :key="layer.id" :label="`${layer.name}（${layer.count}）`">
          <el-option
            v-for="item in regionsOf(layer.id)"
            :key="item.id"
            :label="`${item.name}（${item.count}）`"
            :value="item.id"
          />
        </el-option-group>
      </el-select>
      <el-radio-group v-model="dlcFilter" class="dlc-switch">
        <el-radio-button value="all">全部 {{ stats.total }}</el-radio-button>
        <el-radio-button value="base">本体 {{ stats.base }}</el-radio-button>
        <el-radio-button value="dlc">DLC {{ stats.dlc }}</el-radio-button>
      </el-radio-group>
      <div class="filter-tail">
        <el-select v-model="sortKey" class="sort-select" size="default">
          <el-option v-for="option in sortOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
        <el-button v-if="isFiltering" text size="small" :icon="RefreshLeft" @click="resetFilters">
          清除筛选
        </el-button>
      </div>
    </section>

    <!-- 分类 / 弱点筛选 -->
    <div class="chip-row">
      <span class="chip-label">类别</span>
      <button class="chip" :class="{ active: kind === 'all' }" @click="kind = 'all'">全部</button>
      <button class="chip" :class="{ active: kind === 'required' }" @click="kind = 'required'">
        主线必打 {{ stats.required }}
      </button>
      <button class="chip" :class="{ active: kind === 'remembrance' }" @click="kind = 'remembrance'">
        掉落追忆 {{ stats.remembrance }}
      </button>
      <button class="chip" :class="{ active: kind === 'optional' }" @click="kind = 'optional'">
        可选 {{ stats.optional }}
      </button>
    </div>

    <div class="chip-row">
      <span class="chip-label">类型</span>
      <button class="chip" :class="{ active: !types.length }" @click="types = []">全部</button>
      <button
        v-for="item in typeOptions"
        :key="item.name"
        class="chip"
        :class="{ active: types.includes(item.name) }"
        @click="toggle(types, item.name)"
      >
        {{ item.name }} <span class="chip-count">{{ item.count }}</span>
      </button>
    </div>

    <div class="chip-row">
      <span class="chip-label">弱点</span>
      <button class="chip" :class="{ active: !weaknesses.length }" @click="weaknesses = []">全部</button>
      <button
        v-for="item in weaknessOptions"
        :key="item.name"
        class="chip"
        :class="{ active: weaknesses.includes(item.name) }"
        :style="weaknesses.includes(item.name) ? { borderColor: tagColor(item.name), color: tagColor(item.name) } : null"
        @click="toggle(weaknesses, item.name)"
      >
        {{ item.name }} <span class="chip-count">{{ item.count }}</span>
      </button>
    </div>

    <!-- 结果条 -->
    <div class="result-bar">
      <span>
        匹配 <strong>{{ filtered.length }}</strong> / {{ bossList.length }} 个 BOSS
        <span v-if="activeRegionName" class="result-hint">· {{ activeRegionName }}</span>
        <span v-if="!pageSize" class="result-hint">· 已全部渲染，可直接用 Ctrl+F 查找</span>
      </span>
      <span v-if="pageSize && filtered.length" class="result-hint">
        当前显示第 {{ pageStart + 1 }}–{{ pageEnd }} 个 · 分页模式，需全文查找请切「全部」
      </span>
    </div>

    <!-- 列表 -->
    <div ref="listRef" v-if="pagedBosses.length" class="boss-grid">
      <RouterLink
        v-for="boss in pagedBosses"
        :key="boss.key"
        :to="bossHref(boss)"
        class="boss-card"
        :class="{ dlc: boss.dlc, required: boss.required }"
      >
        <div class="card-head">
          <h2 class="boss-name">{{ boss.name }}</h2>
          <span class="danger" :title="`危险度 ${boss.danger} / 5 · ${dangerLabel(boss.danger)}`">
            <i v-for="n in 5" :key="n" class="danger-pip" :class="{ on: n <= boss.danger }" :style="n <= boss.danger ? { background: dangerColor(boss.danger) } : null"></i>
          </span>
        </div>

        <div class="badge-row">
          <span class="tag origin" :class="boss.dlc ? 'dlc' : 'base'">{{ boss.dlc ? 'DLC' : '本体' }}</span>
          <span v-if="boss.required" class="tag required">必打</span>
          <span v-if="boss.remembrance" class="tag remembrance">追忆</span>
          <span class="tag type">{{ boss.type }}</span>
        </div>

        <p class="place-line">
          <span class="region">{{ boss.regionName }}</span>
          <span v-if="boss.place" class="place">· {{ boss.place }}</span>
        </p>

        <div class="stat-line">
          <span class="stat"><i>推荐等级</i>{{ boss.level }}</span>
          <span v-if="boss.blessing" class="stat"><i>祝福</i>{{ boss.blessing }}</span>
          <span class="stat"><i>阶段</i>{{ boss.phases }}</span>
        </div>

        <div v-if="boss.weak.length" class="weak-line">
          <span class="weak-label">弱</span>
          <span
            v-for="tag in boss.weak.slice(0, 4)"
            :key="tag"
            class="weak-tag"
            :style="{ color: tagColor(tag), borderColor: `${tagColor(tag)}66` }"
          >
            {{ tag }}
          </span>
        </div>
        <div v-else class="weak-line empty">
          <span class="weak-label">弱</span>
          <span class="weak-none">无特别弱点记录</span>
        </div>

        <p v-if="boss.tips.length" class="tip-preview">{{ boss.tips[0] }}</p>

        <span class="card-arrow">打法 →</span>
      </RouterLink>
    </div>

    <el-empty v-else description="没有符合条件的 BOSS，换个关键词或清掉筛选试试">
      <el-button type="primary" plain @click="resetFilters">清除筛选</el-button>
    </el-empty>

    <PagerBar
      v-if="filtered.length"
      :page-size="pageSize"
      :current-page="currentPage"
      :total-pages="totalPages"
      :page-items="pageItems"
      :page-size-options="pageSizeOptions"
      :total="filtered.length"
      unit="个 BOSS"
      @change-page="goPage"
      @change-size="setPageSize"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Search, RefreshLeft, InfoFilled } from '@element-plus/icons-vue'
import PagerBar from '../components/PagerBar.vue'
import { usePagination } from '../composables/usePagination'
import { useQuerySync } from '../composables/useQuerySync'
import {
  bossList,
  bossStats as stats,
  bossLayers as layers,
  bossRegions,
  bossTypes,
  bossWeaknesses,
  bossHref,
  filterBosses,
  sortBosses,
  bossSortOptions as sortOptions,
  dangerLabel,
  dangerColor,
  tagColor,
} from '../utils/bosses'

const typeOptions = bossTypes
const weaknessOptions = bossWeaknesses

const keyword = ref('')
const region = ref('all')
const dlcFilter = ref('all')
const kind = ref('all')
const types = ref([])
const weaknesses = ref([])
const sortKey = ref('default')
const listRef = ref(null)

// 筛选状态进 URL：刷新不丢，也可以直接把「本体 + 弱出血」的筛选结果发给别人
useQuerySync(
  {
    q: keyword,
    region,
    dlc: dlcFilter,
    kind,
    type: types,
    weak: weaknesses,
    sort: sortKey,
  },
  { region: 'all', dlc: 'all', kind: 'all', sort: 'default' }
)

const regionsOf = (layerId) => bossRegions.filter((item) => item.layer === layerId)

const highlights = computed(() => [
  { value: stats.total, label: 'BOSS 总数' },
  { value: stats.remembrance, label: '掉落追忆' },
  { value: stats.required, label: '主线必打' },
  { value: stats.dlc, label: '幽影之地' },
])

const activeRegionName = computed(() => {
  if (region.value === 'all') return ''
  return bossRegions.find((item) => item.id === region.value)?.name || ''
})

const filtered = computed(() => {
  const result = filterBosses(bossList, {
    keyword: keyword.value,
    region: region.value,
    dlc: dlcFilter.value,
    kind: kind.value,
    types: types.value,
    weaknesses: weaknesses.value,
  })
  return sortBosses(result, sortKey.value)
})

const isFiltering = computed(
  () =>
    keyword.value ||
    region.value !== 'all' ||
    dlcFilter.value !== 'all' ||
    kind.value !== 'all' ||
    types.value.length ||
    weaknesses.value.length ||
    sortKey.value !== 'default'
)

const {
  pageSize,
  currentPage,
  totalPages,
  pageStart,
  pageEnd,
  pageItems,
  pagedList: pagedBosses,
  goPage: changePage,
  setPageSize: changePageSize,
} = usePagination(filtered, {
  initialPageSize: 20,
  // 任一筛选条件变化都回到第 1 页，否则会停在第 4 页而新结果只有 3 条
  resetToken: () =>
    [
      keyword.value,
      region.value,
      dlcFilter.value,
      kind.value,
      sortKey.value,
      types.value.join(','),
      weaknesses.value.join(','),
    ].join('|'),
})

const pageSizeOptions = [
  { value: 20, label: '20' },
  { value: 48, label: '48' },
  { value: 120, label: '全部' },
]

function scrollToList() {
  const element = listRef.value
  if (!element) return
  const top = element.getBoundingClientRect().top + window.scrollY - 84
  if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' })
}

function goPage(page) {
  if (changePage(page)) scrollToList()
}

function setPageSize(size) {
  if (changePageSize(size)) scrollToList()
}

function toggle(list, value) {
  const index = list.indexOf(value)
  if (index >= 0) list.splice(index, 1)
  else list.push(value)
}

function resetFilters() {
  keyword.value = ''
  region.value = 'all'
  dlcFilter.value = 'all'
  kind.value = 'all'
  types.value = []
  weaknesses.value = []
  sortKey.value = 'default'
}
</script>

<style scoped>
.boss-page {
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
  max-width: 760px;
  font-size: 13.5px;
  line-height: 1.85;
  color: #a9a496;
}

.hero-sub strong {
  color: #d9c47a;
}

.hero-legend {
  display: flex;
  gap: 16px;
  margin-top: 14px;
  font-size: 12px;
  color: #8a8574;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.base {
  background: #6b6555;
}

.dot.dlc {
  background: #8a6fb0;
}

.dot.required {
  background: #d9534f;
}

.dot.remembrance {
  background: #d4af37;
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
  font-size: 20px;
  font-weight: 700;
  color: #d4af37;
}

.badge-label {
  font-size: 11px;
  color: #8a8574;
}

.notice {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 16px;
  border: 1px solid #3a3324;
  border-left: 3px solid #d4af37;
  border-radius: 8px;
  background: #1a1915;
}

.notice p {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.75;
  color: #a9a496;
}

.filter-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #332d20;
  border-radius: 10px;
  background: #1c1c1c;
}

.search-input {
  width: 320px;
}

.region-select {
  width: 190px;
}

.filter-tail {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.sort-select {
  width: 160px;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.chip-label {
  font-size: 12px;
  color: #8a8574;
  min-width: 34px;
}

.chip {
  padding: 5px 11px;
  font-size: 12px;
  color: #b8b2a0;
  background: #1c1c1c;
  border: 1px solid #332d20;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.18s;
}

.chip:hover {
  color: #d4af37;
  border-color: #6b5c2e;
}

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

.result-bar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #8a8574;
}

.result-bar strong {
  color: #d4af37;
}

.result-hint {
  font-size: 12px;
  color: #6b6555;
}

.boss-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 14px;
}

.boss-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 16px 18px 18px;
  border: 1px solid #332d20;
  border-radius: 10px;
  background: #1c1c1c;
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}

.boss-card:hover {
  border-color: #6b5c2e;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.boss-card.dlc {
  background: linear-gradient(160deg, #1d1a22 0%, #1c1c1c 45%);
}

.boss-card.required {
  border-left: 2px solid #d9534f;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.boss-name {
  margin: 0;
  font-size: 15.5px;
  color: #e5e3d8;
  line-height: 1.4;
}

.danger {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.danger-pip {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #2f2c22;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag {
  padding: 2px 7px;
  font-size: 11px;
  border-radius: 4px;
  border: 1px solid transparent;
}

.tag.base {
  color: #8a8574;
  background: #232323;
  border-color: #383225;
}

.tag.dlc {
  color: #b49ad4;
  background: #241f2e;
  border-color: #3f3453;
}

.tag.required {
  color: #e08b88;
  background: #2a1c1c;
  border-color: #4a2a2a;
}

.tag.remembrance {
  color: #d4af37;
  background: #2a2413;
  border-color: #4a3f1e;
}

.tag.type {
  color: #9aa88f;
  background: #1f241d;
  border-color: #333a2f;
}

.place-line {
  margin: 0;
  font-size: 12.5px;
  color: #8a8574;
}

.region {
  color: #b8b2a0;
}

.place {
  color: #6b6555;
}

.stat-line {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #c9c4b4;
}

.stat i {
  font-style: normal;
  margin-right: 5px;
  color: #6b6555;
}

.weak-line {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.weak-label {
  font-size: 11px;
  color: #6b6555;
}

.weak-tag {
  padding: 1px 7px;
  font-size: 11px;
  border: 1px solid;
  border-radius: 4px;
}

.weak-none {
  font-size: 11px;
  color: #5d5849;
}

.tip-preview {
  margin: 2px 0 0;
  font-size: 12px;
  line-height: 1.65;
  color: #8a8574;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-arrow {
  margin-top: auto;
  align-self: flex-end;
  font-size: 12px;
  color: #6b5c2e;
}

.boss-card:hover .card-arrow {
  color: #d4af37;
}

@media (max-width: 980px) {
  .page-hero {
    flex-direction: column;
  }

  .hero-badges {
    grid-template-columns: repeat(4, 1fr);
  }

  .search-input,
  .region-select,
  .sort-select {
    width: 100%;
  }

  .filter-tail {
    margin-left: 0;
    width: 100%;
  }
}

@media (max-width: 680px) {
  .hero-badges {
    grid-template-columns: repeat(2, 1fr);
  }

  .boss-grid {
    grid-template-columns: 1fr;
  }
}
</style>
