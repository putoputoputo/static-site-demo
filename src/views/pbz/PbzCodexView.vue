<template>
  <div class="pbz">
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
          :placeholder="`搜索${module.itemLabel}中文名 / 英文名 / 机制 / 获取地点`"
          clearable
          :prefix-icon="Search"
        />
        <el-select v-model="sortKey" class="sort-select">
          <el-option v-for="item in module.sortOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <button class="chip" :class="{ active: onlyFavorites }" type="button" @click="onlyFavorites = !onlyFavorites">
          <el-icon :size="12"><Star /></el-icon>
          只看收藏
          <span class="chip-count">{{ moduleFavoriteCount }}</span>
        </button>
      </div>

      <div class="filter-line">
        <span class="line-label">{{ module.categoryLabel }}</span>
        <div class="chips">
          <button class="chip" :class="{ active: categories.length === 0 }" @click="categories = []">
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
        <template v-if="categories.length"> · 已选 {{ categories.join('、') }}</template>
      </span>
      <el-button v-if="isFiltering" text type="warning" size="small" :icon="RefreshLeft" @click="resetFilters">
        清除筛选
      </el-button>
    </div>

    <!-- 卡片 -->
    <div v-if="filtered.length" ref="listRef" class="card-grid">
      <RouterLink v-for="item in pagedItems" :key="item.id" class="item-card" :to="itemHref(module, item)">
        <div class="card-head">
          <div class="card-title">
            <h2 class="card-name">{{ item.name }}</h2>
          </div>
          <button
            class="fav-btn"
            :class="{ active: isCodexFavorite(module.key, item.id) }"
            type="button"
            :title="isCodexFavorite(module.key, item.id) ? '取消收藏' : '加入收藏'"
            :aria-label="isCodexFavorite(module.key, item.id) ? '取消收藏' : '加入收藏'"
            @click.prevent.stop="toggleCodexFavorite(module.key, item.id)"
          >
            <el-icon :size="15">
              <StarFilled v-if="isCodexFavorite(module.key, item.id)" />
              <Star v-else />
            </el-icon>
          </button>
        </div>

        <div class="card-tags">
          <span class="mini-tag">{{ item.category }}</span>
          <span v-if="item.zhPending" class="mini-tag pending">中文名待补</span>
        </div>

        <div v-if="item.metrics.length" class="card-metrics">
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
      </RouterLink>
    </div>

    <!-- 分页栏 -->
    <PagerBar
      v-if="filtered.length"
      :page-size="pageSize"
      :current-page="currentPage"
      :total-pages="totalPages"
      :page-items="pageItems"
      :page-size-options="pageSizeOptions"
      :total="filtered.length"
      :unit="`件${module.itemLabel}`"
      @change-page="goPage"
      @change-size="setPageSize"
    />

    <el-empty v-if="filtered.length === 0" description="没有符合条件的条目，换个关键词或清掉筛选试试">
      <el-button type="primary" plain @click="resetFilters">清除筛选</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Search, RefreshLeft, Location, Star, StarFilled } from '@element-plus/icons-vue'
import { getPbzModule } from '../../data/pbz/codex'
import PagerBar from '../../components/PagerBar.vue'
import { usePagination } from '../../composables/usePagination'
import { useQuerySync } from '../../composables/useQuerySync'
import { usePbzFavorites } from '../../composables/usePbzFavorites'
import { itemHref } from '../../utils/codex'
import { filterPbz, groupCounts, sortPbz } from '../../utils/pbz'
import './pbz.css'

const props = defineProps({
  moduleKey: { type: String, required: true },
})

const module = computed(() => getPbzModule(props.moduleKey))

const { isCodexFavorite, toggleCodexFavorite, favoritesOf } = usePbzFavorites()

const keyword = ref('')
const categories = ref([])
const sortKey = ref('default')
const onlyFavorites = ref(false)
const listRef = ref(null)
const pageSizeOptions = [
  { value: 12, label: '12' },
  { value: 24, label: '24' },
  { value: 0, label: '全部' },
]

const categoryOptions = computed(() => groupCounts(module.value.items, module.value.categories, 'category'))

// 收藏是三个模块共用一个 key，这里只统计当前模块
const moduleFavoriteCount = computed(() => favoritesOf(module.value.key).length)

// 中文名全部补齐后这里会是 0，不再显示「0 中文名待补」这种噪音；任一条目缺名时会自动回来
const highlights = computed(() =>
  [
    { value: module.value.items.length, label: module.value.itemLabel },
    { value: categoryOptions.value.length, label: module.value.categoryLabel },
    { value: module.value.items.filter((item) => item.zhPending).length, label: '中文名待补' },
  ].filter((item) => item.value > 0)
)

const filtered = computed(() => {
  let list = filterPbz(module.value.items, {
    keyword: keyword.value,
    groups: categories.value,
    groupKey: 'category',
  })
  // 收藏筛选放在关键词/分类之后：先缩小范围再取交集，语义与「只看收藏」一致
  if (onlyFavorites.value) {
    list = list.filter((item) => isCodexFavorite(module.value.key, item.id))
  }
  return sortPbz(list, sortKey.value)
})

const filterToken = () => [keyword.value, sortKey.value, categories.value.join(','), onlyFavorites.value].join('|')

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

// 武器与影之武装共用这个组件，切模块时两边的分类 id 不通用，筛选项必须整体重置
watch(
  () => props.moduleKey,
  () => resetFilters()
)

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

// 筛选 + 分页状态同步进 URL：刷新不丢、链接可分享
useQuerySync(
  {
    q: keyword,
    cats: categories,
    sort: sortKey,
    fav: onlyFavorites,
    size: pageSize,
    page: currentPage,
  },
  { sort: 'default', size: 12, page: 1 }
)

const isFiltering = computed(
  () =>
    keyword.value.trim() !== '' ||
    categories.value.length > 0 ||
    sortKey.value !== 'default' ||
    onlyFavorites.value
)

function toggleCategory(id) {
  const index = categories.value.indexOf(id)
  if (index > -1) categories.value.splice(index, 1)
  else categories.value.push(id)
}

function resetFilters() {
  keyword.value = ''
  categories.value = []
  sortKey.value = 'default'
  onlyFavorites.value = false
}
</script>
