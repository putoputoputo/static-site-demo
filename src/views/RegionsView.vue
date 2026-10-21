<template>
  <div class="regions-page">
    <el-breadcrumb class="crumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/main-quest' }">主线流程</el-breadcrumb-item>
      <el-breadcrumb-item>区域 &amp; BOSS 图鉴</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 页头 -->
    <header class="page-hero">
      <div class="hero-text">
        <h1 class="hero-title">区域 &amp; BOSS 图鉴</h1>
        <p class="hero-sub">
          主线章节讲「怎么走」，这一页讲「这片地区有什么、谁在守、要不要打」。共
          <strong>{{ stats.total }}</strong> 个区域、<strong>{{ stats.bosses }}</strong> 个 BOSS，其中追忆 BOSS
          <strong>{{ stats.remembrance }}</strong> 个（本体 {{ stats.remembranceBase }} + DLC
          {{ stats.remembranceDlc }}）。像拉塔恩、深根底层、希芙拉河这种不在必经路上、却会卡住结局或 DLC
          的地方，都在这里单独立了区域。
        </p>
        <div class="hero-legend">
          <span class="legend-item"><i class="dot must"></i>必打</span>
          <span class="legend-item"><i class="dot remembrance"></i>追忆 BOSS</span>
          <span class="legend-item"><i class="dot optional"></i>可选 / 野外</span>
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
      <el-input
        v-model="keyword"
        class="search-input"
        placeholder="搜索区域 / BOSS / 地点，例如 拉塔恩、深根底层、希芙拉河"
        clearable
        :prefix-icon="Search"
      />
      <el-radio-group v-model="layer" class="layer-switch">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="surface">地表</el-radio-button>
        <el-radio-button value="hub">据点</el-radio-button>
        <el-radio-button value="under">地下</el-radio-button>
        <el-radio-button value="dlc">幽影之地</el-radio-button>
      </el-radio-group>
      <el-checkbox v-model="onlyRemembrance" class="remembrance-check">只看追忆 BOSS</el-checkbox>
      <div class="filter-tail">
        <span class="result-count">{{ matchedRegions.length }} 个区域 / {{ visibleBossCount }} 个 BOSS</span>
        <el-button v-if="isFiltering" text size="small" :icon="RefreshLeft" @click="resetFilters">
          清除筛选
        </el-button>
      </div>
    </section>

    <!-- 区域分组 -->
    <section v-for="group in groups" :key="group.id" class="layer-section">
      <div class="layer-head">
        <h2 class="layer-title">{{ group.name }}</h2>
        <span class="layer-count">{{ group.regions.length }} 个区域</span>
        <p class="layer-desc">{{ group.desc }}</p>
      </div>

      <div class="region-grid">
        <article
          v-for="region in group.regions"
          :id="region.id"
          :key="region.id"
          class="region-card"
          :class="{ dlc: region.dlc }"
        >
          <div class="region-head">
            <div class="title-wrap">
              <h3 class="region-name">{{ region.name }}</h3>
              <p class="region-alias">{{ region.alias }}</p>
            </div>
            <span class="path-tag" :class="region.mainPath">
              {{ mainPathLabel(region.mainPath) }}
            </span>
          </div>

          <div class="meta-row">
            <span class="meta-item level">等级 {{ region.level }}</span>
            <span class="meta-item">{{ region.bosses.length }} 个 BOSS</span>
            <span v-if="remembranceCount(region)" class="meta-item remembrance">
              追忆 {{ remembranceCount(region) }}
            </span>
            <span v-if="region.subAreas?.length" class="meta-item">{{ region.subAreas.length }} 个子区域</span>
          </div>

          <p class="region-summary">{{ region.summary }}</p>

          <div class="access-row">
            <span class="access-label">进入方式</span>
            <span class="access-text">{{ region.access }}</span>
          </div>

          <div v-if="visibleBosses(region).length" class="boss-list">
            <div
              v-for="boss in visibleBosses(region)"
              :key="boss.name"
              class="boss-row"
              :class="{ hit: isHit(boss) }"
            >
              <div class="boss-main">
                <span class="boss-name">{{ boss.name }}</span>
                <span v-if="boss.required" class="chip must">必打</span>
                <span v-if="boss.remembrance" class="chip remembrance">追忆</span>
              </div>
              <div class="boss-meta">
                <span class="boss-place">{{ boss.place }}</span>
                <span v-if="boss.note" class="boss-note">{{ boss.note }}</span>
                <RouterLink
                  v-if="boss.quest && questName(boss.quest)"
                  :to="`/side-quests/${boss.quest}`"
                  class="boss-quest"
                >
                  支线：{{ questName(boss.quest) }} →
                </RouterLink>
                <RouterLink
                  v-if="boss.remembrance"
                  :to="`/main-quest/remembrances?q=${encodeURIComponent(boss.name)}`"
                  class="boss-quest"
                >
                  追忆兑换 →
                </RouterLink>
              </div>
            </div>
          </div>
          <p v-else class="no-boss">
            {{ onlyRemembrance ? '这个区域没有追忆 BOSS。' : '没有可战斗 BOSS，是枢纽或过场区域。' }}
          </p>

          <div v-if="region.subAreas?.length" class="sub-row">
            <span class="sub-label">包含</span>
            <span class="sub-text">{{ region.subAreas.join(' · ') }}</span>
          </div>

          <div v-if="chapterLinks(region).length" class="chapter-row">
            <span class="chapter-label">对应章节</span>
            <RouterLink
              v-for="item in chapterLinks(region)"
              :key="item.id"
              :to="`/main-quest/${item.id}`"
              class="chapter-link"
            >
              {{ item.name }} →
            </RouterLink>
          </div>
        </article>
      </div>
    </section>

    <el-empty v-if="!matchedRegions.length" description="没有匹配的区域，换个关键词试试">
      <el-button type="primary" plain @click="resetFilters">清除筛选</el-button>
    </el-empty>

    <!-- 追忆总表 -->
    <section class="remembrance-section">
      <div class="section-head">
        <h2 class="section-title">追忆 BOSS 总表（{{ stats.remembrance }}）</h2>
        <p class="section-desc">
          本体 15 个、DLC 10 个，全部按「击败后掉落追忆」统计。追忆可以在圆桌厅堂找解指恩雅兑换武器或法术，
          每个追忆二选一；地图上的漫步灵庙可以复制追忆。
        </p>
      </div>
      <div class="remembrance-columns">
        <div class="remembrance-col">
          <h3 class="col-title">本体 · {{ stats.remembranceBase }}</h3>
          <ul class="remembrance-list">
            <li v-for="boss in baseRemembrances" :key="boss.name" class="remembrance-item">
              <span class="rm-name">{{ boss.name }}</span>
              <a :href="`#${boss.regionId}`" class="rm-region">{{ boss.regionName }}</a>
            </li>
          </ul>
        </div>
        <div class="remembrance-col">
          <h3 class="col-title">幽影之地 · {{ stats.remembranceDlc }}</h3>
          <ul class="remembrance-list">
            <li v-for="boss in dlcRemembrances" :key="boss.name" class="remembrance-item">
              <span class="rm-name">{{ boss.name }}</span>
              <a :href="`#${boss.regionId}`" class="rm-region">{{ boss.regionName }}</a>
            </li>
          </ul>
        </div>
      </div>
      <p class="section-foot">
        注：神兽舞狮在 DLC 出现两次，只有塔之镇那只掉追忆；狂龙贝勒不掉追忆，但仍是 DLC 最强的野外 BOSS。
      </p>
    </section>

    <div class="back-row">
      <RouterLink to="/main-quest" class="back-link">
        <el-icon :size="13"><ArrowLeft /></el-icon>
        返回主线章节
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Search, RefreshLeft, ArrowLeft } from '@element-plus/icons-vue'
import {
  mainRegions,
  regionStats,
  remembranceBosses,
  matchRegion,
  matchBoss,
  groupByLayer,
} from '../utils/regions'
import { getChapter } from '../utils/mainline'
import { getQuest } from '../utils/quest'
import { useQuerySync } from '../composables/useQuerySync'

const route = useRoute()
const stats = regionStats

const keyword = ref('')
const layer = ref('all')
const onlyRemembrance = ref(false)

// 全站搜索 / 追忆兑换表会带 ?q=BOSS 名 过来，筛选状态也一并进 URL
useQuerySync({ q: keyword, layer, rem: onlyRemembrance }, { layer: 'all', rem: false })

const highlights = computed(() => [
  { value: stats.total, label: '区域' },
  { value: stats.bosses, label: 'BOSS 总数' },
  { value: stats.remembrance, label: '追忆 BOSS' },
  { value: stats.required, label: '必打 BOSS' },
])

const isFiltering = computed(
  () => keyword.value.trim() !== '' || layer.value !== 'all' || onlyRemembrance.value
)

const matchedRegions = computed(() =>
  mainRegions
    .filter((region) => {
      if (layer.value !== 'all' && region.layer !== layer.value) return false
      if (onlyRemembrance.value && !region.bosses.some((boss) => boss.remembrance)) return false
      return matchRegion(region, keyword.value)
    })
    .sort((a, b) => a.order - b.order)
)

const groups = computed(() => groupByLayer(matchedRegions.value))

const visibleBossCount = computed(() =>
  matchedRegions.value.reduce((sum, region) => sum + visibleBosses(region).length, 0)
)

const baseRemembrances = computed(() => remembranceBosses.filter((boss) => !boss.dlc))
const dlcRemembrances = computed(() => remembranceBosses.filter((boss) => boss.dlc))

function visibleBosses(region) {
  return onlyRemembrance.value ? region.bosses.filter((boss) => boss.remembrance) : region.bosses
}

function remembranceCount(region) {
  return region.bosses.filter((boss) => boss.remembrance).length
}

function isHit(boss) {
  return keyword.value.trim() !== '' && matchBoss(boss, keyword.value)
}

function mainPathLabel(value) {
  if (value === 'must') return '主线必经'
  if (value === 'dlc') return 'DLC'
  return '可选'
}

function questName(id) {
  return getQuest(id)?.name || ''
}

function chapterLinks(region) {
  return (region.chapters || []).map((id) => getChapter(id)).filter(Boolean)
}

function resetFilters() {
  keyword.value = ''
  layer.value = 'all'
  onlyRemembrance.value = false
}

onMounted(async () => {
  const hash = route.hash?.replace('#', '')
  if (!hash) return
  await nextTick()
  document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
})
</script>

<style scoped>
.regions-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.crumb {
  font-size: 12px;
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
  max-width: 720px;
  color: #9d977f;
  font-size: 13px;
  line-height: 1.75;
}

.hero-sub strong {
  color: #e5e3d8;
  font-weight: 600;
}

.hero-legend {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 12px;
  color: #8a8574;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot.must {
  background: #c16b4f;
}

.dot.remembrance {
  background: #b58cc0;
}

.dot.optional {
  background: #5d5849;
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
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px 20px;
  border: 1px solid #302b1f;
  border-radius: 10px;
  background: #1a1a1a;
}

.search-input {
  width: 340px;
}

.layer-switch,
.remembrance-check {
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

/* 分组 */
.layer-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.layer-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 6px;
}

.layer-title {
  margin: 0;
  font-size: 18px;
  letter-spacing: 1px;
  color: #d4af37;
}

.layer-count {
  font-size: 12px;
  color: #6f6a5a;
}

.layer-desc {
  flex-basis: 100%;
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #8a8574;
}

.region-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 12px;
}

.region-card {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 16px 18px;
  border: 1px solid #302b1f;
  border-radius: 10px;
  background: #1a1a1a;
  scroll-margin-top: 80px;
}

.region-card.dlc {
  border-color: #3d3226;
  background: linear-gradient(160deg, rgba(201, 139, 63, 0.06), transparent 55%), #1a1a1a;
}

.region-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.region-name {
  margin: 0;
  font-size: 16px;
  color: #e5e3d8;
}

.region-alias {
  margin: 3px 0 0;
  font-size: 11px;
  color: #6f6a5a;
}

.path-tag {
  flex-shrink: 0;
  padding: 1px 7px;
  font-size: 10px;
  border-radius: 3px;
  border: 1px solid #383225;
  color: #8a8574;
}

.path-tag.must {
  color: #d08a6a;
  border-color: rgba(193, 107, 79, 0.35);
  background: rgba(193, 107, 79, 0.08);
}

.path-tag.dlc {
  color: #c98b3f;
  border-color: rgba(201, 139, 63, 0.35);
  background: rgba(201, 139, 63, 0.08);
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-item {
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

.meta-item.remembrance {
  color: #b58cc0;
  background: rgba(181, 140, 192, 0.09);
  border-color: rgba(181, 140, 192, 0.24);
}

.region-summary {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.75;
  color: #a8a292;
}

.access-row,
.sub-row,
.chapter-row {
  display: flex;
  gap: 8px;
  font-size: 11.5px;
  line-height: 1.65;
}

.access-label,
.sub-label,
.chapter-label {
  flex-shrink: 0;
  color: #6f6a5a;
}

.access-text,
.sub-text {
  color: #9d977f;
}

.boss-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-top: 3px;
  border-top: 1px dashed #2e2a22;
  padding-top: 8px;
}

.boss-row {
  padding: 6px 8px;
  border-radius: 5px;
  transition: background 0.15s ease;
}

.boss-row + .boss-row {
  border-top: 1px solid #232323;
}

.boss-row.hit {
  background: rgba(212, 175, 55, 0.08);
}

.boss-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.boss-name {
  font-size: 13px;
  color: #ddd9cb;
}

.chip {
  padding: 0 5px;
  font-size: 10px;
  border-radius: 3px;
  border: 1px solid #383225;
  color: #6f6a5a;
}

.chip.must {
  color: #d08a6a;
  border-color: rgba(193, 107, 79, 0.4);
}

.chip.remembrance {
  color: #b58cc0;
  border-color: rgba(181, 140, 192, 0.4);
}

.boss-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin-top: 2px;
}

.boss-place {
  font-size: 11px;
  color: #8a8574;
}

.boss-note {
  font-size: 11px;
  color: #7d7868;
}

.boss-quest {
  font-size: 11px;
  color: #8fa88a;
  text-decoration: none;
}

.boss-quest:hover {
  color: #d4af37;
}

.no-boss {
  margin: 4px 0 0;
  padding-top: 8px;
  border-top: 1px dashed #2e2a22;
  font-size: 11.5px;
  color: #6f6a5a;
}

.chapter-row {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px dashed #2e2a22;
  flex-wrap: wrap;
}

.chapter-link {
  font-size: 11.5px;
  color: #c9a227;
  text-decoration: none;
}

.chapter-link:hover {
  color: #e5c766;
}

/* 追忆总表 */
.remembrance-section {
  margin-top: 8px;
  padding: 22px 24px;
  border: 1px solid #302b1f;
  border-radius: 10px;
  background: #171717;
}

.section-head {
  margin-bottom: 14px;
}

.section-title {
  margin: 0 0 6px;
  font-size: 18px;
  color: #d4af37;
  letter-spacing: 1px;
}

.section-desc {
  margin: 0;
  max-width: 820px;
  font-size: 12px;
  line-height: 1.75;
  color: #8a8574;
}

.remembrance-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.col-title {
  margin: 0 0 8px;
  font-size: 13px;
  color: #c9a227;
  font-weight: 500;
}

.remembrance-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.remembrance-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #232323;
  font-size: 12.5px;
}

.rm-name {
  color: #ddd9cb;
}

.rm-region {
  flex-shrink: 0;
  font-size: 11px;
  color: #8a8574;
  text-decoration: none;
}

.rm-region:hover {
  color: #d4af37;
}

.section-foot {
  margin: 12px 0 0;
  font-size: 11.5px;
  line-height: 1.7;
  color: #6f6a5a;
}

.back-row {
  padding: 4px 0 8px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #8a8574;
  text-decoration: none;
}

.back-link:hover {
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

  .region-grid {
    grid-template-columns: 1fr;
  }

  .search-input {
    width: 100%;
  }
}
</style>
