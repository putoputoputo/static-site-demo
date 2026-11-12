<template>
  <div class="pbz">
    <header class="page-hero">
      <div class="hero-text">
        <div class="hero-eyebrow">BOSS · 分区域</div>
        <h1 class="hero-title">BOSS 攻略</h1>
        <p class="hero-sub">
          按地图整理全部 BOSS 的位置、掉落与打法要点。打法只转述 wiki 页面上写明的机制，页面还是空模板的条目标为「待补」；
          中文名来自 3DM 攻略目录，全部 BOSS 已补齐；招式名与铃铛名按字面意译，与官方中文版可能有出入。
        </p>
      </div>
      <div class="hero-badges">
        <div v-for="item in highlights" :key="item.label" class="hero-badge">
          <span class="badge-value">{{ item.value }}</span>
          <span class="badge-label">{{ item.label }}</span>
        </div>
      </div>
    </header>

    <section class="filter-panel">
      <div class="filter-line">
        <el-input
          v-model="keyword"
          class="search-input"
          placeholder="搜索 BOSS 中文名 / 英文名 / 掉落 / 位置"
          clearable
          :prefix-icon="Search"
        />
        <button class="chip" :class="{ active: onlyFavorites }" type="button" @click="onlyFavorites = !onlyFavorites">
          <el-icon :size="12"><Star /></el-icon>
          只看收藏
          <span class="chip-count">{{ bossFavoriteCount }}</span>
        </button>
      </div>
      <div class="filter-line">
        <span class="line-label">区域</span>
        <div class="chips">
          <button class="chip" :class="{ active: regions.length === 0 }" @click="regions = []">
            全部
            <span class="chip-count">{{ bosses.length }}</span>
          </button>
          <button
            v-for="item in regionOptions"
            :key="item.id"
            class="chip"
            :class="{ active: regions.includes(item.id) }"
            @click="toggleRegion(item.id)"
          >
            {{ item.label }}
            <span class="chip-count">{{ item.count }}</span>
          </button>
        </div>
      </div>
    </section>

    <div class="result-bar">
      <span>
        匹配 <strong>{{ filtered.length }}</strong> / {{ bosses.length }} 个 BOSS
        <template v-if="regions.length"> · 已选 {{ regions.join('、') }}</template>
      </span>
      <el-button v-if="isFiltering" text type="warning" size="small" :icon="RefreshLeft" @click="resetFilters">
        清除筛选
      </el-button>
    </div>

    <div v-if="filtered.length" ref="listRef" class="card-grid">
      <RouterLink v-for="boss in pagedItems" :key="boss.id" class="item-card" :to="bossHref(boss)">
        <div class="card-head">
          <div class="card-title">
            <h2 class="card-name">{{ boss.name }}</h2>
          </div>
          <button
            class="fav-btn"
            :class="{ active: isBossFavorite(boss.id) }"
            type="button"
            :title="isBossFavorite(boss.id) ? '取消收藏' : '加入收藏'"
            :aria-label="isBossFavorite(boss.id) ? '取消收藏' : '加入收藏'"
            @click.prevent.stop="toggleBossFavorite(boss.id)"
          >
            <el-icon :size="15">
              <StarFilled v-if="isBossFavorite(boss.id)" />
              <Star v-else />
            </el-icon>
          </button>
        </div>

        <div class="card-tags">
          <span class="mini-tag">{{ boss.region }}</span>
          <span v-if="boss.phases" class="mini-tag pending">{{ boss.phases }} 阶段</span>
          <span v-if="boss.zhPending" class="mini-tag pending">中文名待补</span>
        </div>

        <div v-if="boss.drop" class="card-metrics">
          <span class="metric">
            <em>掉落</em>
            <strong>{{ boss.drop }}</strong>
          </span>
        </div>

        <p class="card-effect">{{ boss.tips }}</p>

        <p class="card-location">
          <el-icon :size="12"><Location /></el-icon>
          <span>{{ boss.place }}</span>
        </p>
      </RouterLink>
    </div>

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

    <el-empty v-if="filtered.length === 0" description="没有符合条件的 BOSS，换个关键词或清掉筛选试试">
      <el-button type="primary" plain @click="resetFilters">清除筛选</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Search, RefreshLeft, Location, Star, StarFilled } from '@element-plus/icons-vue'
import bosses, { bossRegions } from '../../data/pbz/bosses'
import PagerBar from '../../components/PagerBar.vue'
import { usePagination } from '../../composables/usePagination'
import { useQuerySync } from '../../composables/useQuerySync'
import { usePbzFavorites } from '../../composables/usePbzFavorites'
import { bossHref, filterPbz, groupCounts } from '../../utils/pbz'
import './pbz.css'

const { isBossFavorite, toggleBossFavorite, bossFavoriteCount } = usePbzFavorites()

const keyword = ref('')
const regions = ref([])
const onlyFavorites = ref(false)
const listRef = ref(null)
const pageSizeOptions = [
  { value: 12, label: '12' },
  { value: 24, label: '24' },
  { value: 0, label: '全部' },
]

const regionOptions = computed(() => groupCounts(bosses, bossRegions, 'region'))

// 中文名补齐后这里是 0，不显示「0 中文名待补」；有缺名条目时会自动出现
const highlights = [
  { value: bosses.length, label: 'BOSS' },
  { value: bossRegions.length, label: '区域' },
  { value: bosses.filter((boss) => boss.zhPending).length, label: '中文名待补' },
].filter((item) => item.value > 0)

const filtered = computed(() => {
  const list = filterPbz(bosses, { keyword: keyword.value, groups: regions.value, groupKey: 'region' })
  return onlyFavorites.value ? list.filter((boss) => isBossFavorite(boss.id)) : list
})

const filterToken = () => [keyword.value, regions.value.join(','), onlyFavorites.value].join('|')

const {
  pageSize,
  currentPage,
  totalPages,
  pageItems,
  pagedList: pagedItems,
  goPage: changePage,
  setPageSize: changePageSize,
} = usePagination(filtered, {
  initialPageSize: 12,
  resetToken: filterToken,
})

// 筛选变化时视口可能停在旧列表底部，拉回列表顶部（须在 usePagination 的 watch 之后注册）
watch(filterToken, () => scrollToList())

function goPage(page) {
  if (changePage(page)) scrollToList()
}

function setPageSize(size) {
  if (changePageSize(size)) scrollToList()
}

function scrollToList() {
  const element = listRef.value
  if (!element) return
  const top = element.getBoundingClientRect().top + window.scrollY - 84
  if (window.scrollY > top) {
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

useQuerySync(
  {
    q: keyword,
    regions,
    fav: onlyFavorites,
    size: pageSize,
    page: currentPage,
  },
  { size: 12, page: 1 }
)

const isFiltering = computed(
  () => keyword.value.trim() !== '' || regions.value.length > 0 || onlyFavorites.value
)

function toggleRegion(id) {
  const index = regions.value.indexOf(id)
  if (index > -1) regions.value.splice(index, 1)
  else regions.value.push(id)
}

function resetFilters() {
  keyword.value = ''
  regions.value = []
  onlyFavorites.value = false
}
</script>
