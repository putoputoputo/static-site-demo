<template>
  <div class="remembrance-page">
    <el-breadcrumb class="crumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/main-quest' }">主线流程</el-breadcrumb-item>
      <el-breadcrumb-item>追忆兑换</el-breadcrumb-item>
    </el-breadcrumb>

    <header class="page-hero">
      <div class="hero-text">
        <h1 class="hero-title">追忆兑换表</h1>
        <p class="hero-sub">
          击败追忆 BOSS 后，把追忆交给圆桌厅堂的「解指」恩雅，每份追忆只能换其中
          <strong>一件</strong>。这一页把 25 个追忆能换的东西全部列出来，能点进去的直接看图鉴条目——
          省得站在恩雅面前翻半小时菜单，最后还换错。
        </p>
        <div class="hero-legend">
          <span class="legend-item"><i class="dot base"></i>本体</span>
          <span class="legend-item"><i class="dot dlc"></i>黄金树幽影</span>
          <span class="legend-item"><i class="dot link"></i>可点开图鉴</span>
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
      <p>{{ notice }}</p>
    </section>

    <!-- 筛选 -->
    <section class="filter-panel">
      <el-input
        v-model="keyword"
        class="search-input"
        placeholder="搜索 BOSS 或兑换物，例如 玛莲妮亚、义手刀、米凯拉的光"
        clearable
        :prefix-icon="Search"
      />
      <el-radio-group v-model="dlcFilter" class="dlc-switch">
        <el-radio-button value="all">全部 {{ allCount }}</el-radio-button>
        <el-radio-button value="base">本体 {{ baseCount }}</el-radio-button>
        <el-radio-button value="dlc">DLC {{ dlcCount }}</el-radio-button>
      </el-radio-group>
      <div class="filter-tail">
        <span class="result-count">{{ filtered.length }} 个追忆 / {{ visibleItemCount }} 件物品</span>
        <el-button v-if="isFiltering" text size="small" :icon="RefreshLeft" @click="resetFilters">
          清除筛选
        </el-button>
      </div>
    </section>

    <!-- 类型筛选 -->
    <div class="type-row">
      <span class="type-label">兑换物类型</span>
      <button
        class="type-chip"
        :class="{ active: type === '' }"
        @click="type = ''"
      >
        全部
      </button>
      <button
        v-for="option in typeOptions"
        :key="option"
        class="type-chip"
        :class="{ active: type === option }"
        @click="type = type === option ? '' : option"
      >
        {{ option }}
      </button>
    </div>

    <!-- 列表 -->
    <div v-if="filtered.length" class="remembrance-grid">
      <article
        v-for="entry in filtered"
        :key="entry.id"
        class="remembrance-card"
        :class="{ dlc: entry.dlc }"
      >
        <div class="card-head">
          <div class="head-main">
            <h2 class="boss-name">
              <RouterLink v-if="entry.regionId" :to="bossHref(entry)" class="boss-link">
                {{ entry.boss }}
              </RouterLink>
              <template v-else>{{ entry.boss }}</template>
            </h2>
            <span class="remembrance-name">{{ entry.remembrance }}</span>
          </div>
          <span class="origin-chip" :class="entry.dlc ? 'dlc' : 'base'">
            {{ entry.dlc ? 'DLC' : '本体' }}
          </span>
        </div>

        <div class="meta-row">
          <span class="meta-item">{{ entry.regionName }}</span>
          <span v-if="entry.place" class="meta-item place">{{ entry.place }}</span>
          <span v-if="entry.runes" class="meta-item runes">直接使用 {{ entry.runes.toLocaleString() }} 卢恩</span>
        </div>

        <div class="item-list">
          <div v-for="item in entry.items" :key="item.name" class="item-row">
            <span class="item-type" :class="typeClass(item.type)">{{ item.type }}</span>
            <RouterLink v-if="item.to" :to="item.to" class="item-name link">
              {{ item.name }}
            </RouterLink>
            <span v-else class="item-name">{{ item.name }}</span>
            <span v-if="!item.to" class="item-hint">站内暂无图鉴</span>
          </div>
        </div>

        <p v-if="entry.items.length > 2" class="extra-note">
          这是全游戏唯一可以三选一的追忆，换之前先想清楚要走哪个流派。
        </p>
      </article>
    </div>

    <el-empty v-else description="没有匹配的追忆，换个关键词或清掉筛选试试">
      <el-button type="primary" plain @click="resetFilters">清除筛选</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Search, RefreshLeft, InfoFilled } from '@element-plus/icons-vue'
import { remembranceNotice, remembranceStats } from '../data/remembrances'
import { remembranceList, exchangeTypeOptions, filterRemembrances } from '../utils/remembrances'

// 追忆表里的 BOSS 名可点进「BOSS 攻略」详情，避免玩家为了查弱点再回列表翻一遍
const bossHref = (entry) => `/bosses/${entry.regionId}/${encodeURIComponent(entry.boss)}`
import { useQuerySync } from '../composables/useQuerySync'

const notice = remembranceNotice
const typeOptions = exchangeTypeOptions

const keyword = ref('')
const dlcFilter = ref('all')
const type = ref('')

// 区域图鉴的「追忆兑换 →」会带 ?q=BOSS 名过来，筛选状态也一并进 URL
useQuerySync({ q: keyword, dlc: dlcFilter, type }, { dlc: 'all' })

const allCount = remembranceStats.total
const baseCount = remembranceStats.base
const dlcCount = remembranceStats.dlc

const filtered = computed(() =>
  filterRemembrances(remembranceList, {
    keyword: keyword.value,
    dlcFilter: dlcFilter.value,
    type: type.value,
  })
)

const visibleItemCount = computed(() =>
  filtered.value.reduce((sum, entry) => sum + entry.items.length, 0)
)

const linkedCount = remembranceList.reduce(
  (sum, entry) => sum + entry.items.filter((item) => item.to).length,
  0
)

const highlights = [
  { value: allCount, label: '追忆 BOSS' },
  { value: remembranceStats.items, label: '可兑换物品' },
  { value: `${baseCount} + ${dlcCount}`, label: '本体 + DLC' },
  { value: linkedCount, label: '已接入图鉴' },
]

const isFiltering = computed(() => Boolean(keyword.value || type.value || dlcFilter.value !== 'all'))

function resetFilters() {
  keyword.value = ''
  type.value = ''
  dlcFilter.value = 'all'
}

function typeClass(value) {
  return `type-${exchangeTypeOptions.indexOf(value)}`
}
</script>

<style scoped>
.remembrance-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.crumb {
  font-size: 13px;
}

.page-hero {
  display: flex;
  gap: 28px;
  justify-content: space-between;
  padding: 26px 28px;
  border: 1px solid #332d20;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.09), rgba(20, 20, 20, 0.4));
}

.hero-text {
  max-width: 660px;
}

.hero-title {
  margin: 0 0 10px;
  font-size: 26px;
  color: #e8d9a8;
  letter-spacing: 1px;
}

.hero-sub {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.85;
  color: #a8a293;
}

.hero-sub strong {
  color: #d4af37;
}

.hero-legend {
  display: flex;
  gap: 16px;
  margin-top: 14px;
  font-size: 12px;
  color: #8a8574;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot.base {
  background: #7a7565;
}

.dot.dlc {
  background: #9b6bb5;
}

.dot.link {
  background: #d4af37;
}

.hero-badges {
  display: grid;
  grid-template-columns: repeat(2, minmax(88px, auto));
  gap: 10px;
  align-content: start;
}

.hero-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid #3a3428;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
}

.badge-value {
  font-size: 20px;
  font-weight: 600;
  color: #d4af37;
}

.badge-label {
  font-size: 11px;
  color: #8a8574;
}

.notice {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-left: 3px solid rgba(212, 175, 55, 0.6);
  border-radius: 0 8px 8px 0;
  background: #161616;
}

.notice p {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.8;
  color: #9c9686;
}

.filter-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #2c2c2c;
  border-radius: 10px;
  background: #191919;
}

.search-input {
  width: 340px;
}

.filter-tail {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.result-count {
  font-size: 12.5px;
  color: #8a8574;
}

.type-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
}

.type-label {
  margin-right: 4px;
  font-size: 12.5px;
  color: #6f6a5c;
}

.type-chip {
  padding: 5px 12px;
  font-size: 12px;
  color: #9c9686;
  cursor: pointer;
  background: #1e1e1e;
  border: 1px solid #332d20;
  border-radius: 999px;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}

.type-chip:hover {
  color: #d4af37;
  border-color: rgba(212, 175, 55, 0.45);
}

.type-chip.active {
  color: #12100c;
  background: #d4af37;
  border-color: #d4af37;
}

.remembrance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 14px;
}

.remembrance-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border: 1px solid #332d20;
  border-radius: 10px;
  background: #1c1c1c;
}

.remembrance-card.dlc {
  border-color: #3b2f45;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.head-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.boss-link {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px dashed transparent;
  transition: color 0.16s, border-color 0.16s;
}

.boss-link:hover {
  color: #d4af37;
  border-bottom-color: #6b5c2e;
}

.boss-name {
  margin: 0;
  font-size: 16.5px;
  color: #e8d9a8;
}

.remembrance-name {
  font-size: 12px;
  color: #7d786a;
}

.origin-chip {
  flex: none;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
}

.origin-chip.base {
  color: #a8a293;
  background: #262626;
  border: 1px solid #3a3428;
}

.origin-chip.dlc {
  color: #c9a7dd;
  background: rgba(155, 107, 181, 0.12);
  border: 1px solid rgba(155, 107, 181, 0.4);
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #7d786a;
}

.meta-item.place::before {
  content: '· ';
}

.meta-item.runes {
  color: #b99a4a;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px dashed #302b22;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-type {
  flex: none;
  width: 40px;
  padding: 2px 0;
  font-size: 11px;
  text-align: center;
  border-radius: 4px;
}

.type-0 {
  color: #d8c48a;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.35);
}

.type-1 {
  color: #8fb4d8;
  background: rgba(92, 141, 190, 0.14);
  border: 1px solid rgba(92, 141, 190, 0.4);
}

.type-2 {
  color: #e0bb8a;
  background: rgba(200, 150, 90, 0.12);
  border: 1px solid rgba(200, 150, 90, 0.38);
}

.type-3 {
  color: #b7c48f;
  background: rgba(150, 170, 110, 0.12);
  border: 1px solid rgba(150, 170, 110, 0.35);
}

.type-4,
.type-5 {
  color: #9a948a;
  background: #242424;
  border: 1px solid #383838;
}

.item-name {
  font-size: 13.5px;
  color: #cfc9b8;
}

.item-name.link {
  color: #d4af37;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

.item-name.link:hover {
  border-color: rgba(212, 175, 55, 0.6);
}

.item-hint {
  font-size: 11px;
  color: #5d5849;
}

.extra-note {
  margin: 0;
  font-size: 11.5px;
  color: #8a8574;
}

@media (max-width: 980px) {
  .page-hero {
    flex-direction: column;
    gap: 16px;
  }

  .hero-badges {
    grid-template-columns: repeat(4, minmax(70px, 1fr));
  }

  .search-input {
    width: 100%;
  }

  .remembrance-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .hero-badges {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-tail {
    margin-left: 0;
  }
}
</style>
