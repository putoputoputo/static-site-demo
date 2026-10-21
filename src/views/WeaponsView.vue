<template>
  <div class="weapons-page">
    <!-- 页头 -->
    <header class="page-hero">
      <div class="hero-text">
        <h1 class="hero-title">武器图鉴</h1>
        <p class="hero-sub">
          共收录 <strong>{{ weapons.length }}</strong> 件武器，覆盖
          <strong>{{ typeOptions.length }}</strong> 个类型（本体 34 类，盾牌拆成小盾 / 中盾 / 大盾；DLC 新增 8
          类），其中 DLC 武器 <strong>{{ dlcCount }}</strong> 件。面板为未强化基础值，
          冷门武器的个别数值为同类型基准估算，盾牌不计攻击力。
        </p>
      </div>
      <div class="hero-badges">
        <div v-for="item in highlights" :key="item.label" class="hero-badge">
          <span class="badge-value">{{ item.value }}</span>
          <span class="badge-label">{{ item.label }}</span>
        </div>
      </div>
    </header>

    <!-- 筛选区 -->
    <section class="filter-panel">
      <div class="filter-line">
        <el-input
          v-model="keyword"
          class="search-input"
          placeholder="搜索武器名称 / 战技 / 玩法关键词"
          clearable
          :prefix-icon="Search"
        />
        <el-select v-model="sortKey" class="sort-select" placeholder="排序">
          <el-option v-for="item in sortOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-radio-group v-model="viewMode" class="view-switch">
          <el-radio-button value="card">卡片</el-radio-button>
          <el-radio-button value="table">表格</el-radio-button>
        </el-radio-group>
      </div>

      <div class="filter-line type-line">
        <span class="line-label">类型</span>
        <div class="type-groups">
          <div v-for="(group, index) in typeGroups" :key="group.label" class="type-group">
            <button
              v-if="index === 0"
              class="all-chip"
              :class="{ active: selectedTypes.length === 0 }"
              @click="selectedTypes = []"
            >
              全部
            </button>
            <span class="group-label">{{ group.label }}</span>
            <button
              v-for="item in group.items"
              :key="item.name"
              class="chip"
              :class="{ active: selectedTypes.includes(item.name) }"
              @click="toggleType(item.name)"
            >
              {{ item.name }}
              <span class="chip-count">{{ item.count }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="filter-line">
        <span class="line-label">版本</span>
        <div class="chips">
          <button
            v-for="item in dlcOptions"
            :key="item.value"
            class="chip"
            :class="{ active: dlcFilter === item.value }"
            @click="dlcFilter = item.value"
          >
            {{ item.label }}
            <span class="chip-count">{{ item.count }}</span>
          </button>
        </div>
      </div>

      <div class="filter-line">
        <span class="line-label">补正</span>
        <div class="chips">
          <button
            v-for="item in ATTR_KEYS"
            :key="item"
            class="chip"
            :class="{ active: selectedAttrs.includes(item) }"
            @click="toggleAttr(item)"
          >
            {{ ATTR_LABELS[item] }}
          </button>
        </div>
      </div>

      <div class="filter-line">
        <span class="line-label">状态</span>
        <div class="chips">
          <button
            v-for="item in statusOptions"
            :key="item.name"
            class="chip"
            :class="{ active: selectedStatuses.includes(item.name) }"
            @click="toggleStatus(item.name)"
          >
            <span class="status-dot" :style="{ background: statusColor(item.name) }" />
            {{ item.name }}
            <span class="chip-count">{{ item.count }}</span>
          </button>
          <span v-if="!statusOptions.length" class="muted">暂无自带异常状态的武器</span>
        </div>

        <div class="quick-toggles">
          <button class="chip" :class="{ active: onlyFavorites }" @click="onlyFavorites = !onlyFavorites">
            <el-icon :size="12"><Star /></el-icon>
            只看收藏
            <span class="chip-count">{{ favoriteCount }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- 结果条 -->
    <div class="result-bar">
      <span>
        匹配 <strong>{{ filteredWeapons.length }}</strong> / {{ weapons.length }} 件武器
        <span v-if="filteredWeapons.length" class="result-hint">
          <template v-if="pageSize">当前显示第 {{ pageStart + 1 }}–{{ pageEnd }} 件 · 分页模式，需全文查找请切「全部」</template>
          <template v-else>已全部渲染，可直接用浏览器 Ctrl+F 查找</template>
        </span>
      </span>
      <el-button v-if="isFiltering" text type="warning" size="small" :icon="RefreshLeft" @click="resetFilters">
        清除筛选
      </el-button>
    </div>

    <!-- 列表容器：翻页后滚动回这里 -->
    <div ref="listRef" class="weapon-list">
      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="weapon-grid" :class="{ 'is-full': !pageSize }">
        <RouterLink
          v-for="weapon in pagedWeapons"
          :key="weapon.id"
          class="weapon-card"
          :to="`/weapons/${weapon.id}`"
        >
          <div class="card-head">
            <h2 class="card-name">
              {{ weapon.name }}
              <span v-if="weapon.dlc" class="dlc-tag">(DLC)</span>
            </h2>
            <button
              class="fav-btn"
              :class="{ active: isFavorite(weapon.id) }"
              :title="isFavorite(weapon.id) ? '取消收藏' : '加入收藏'"
              @click.prevent.stop="toggleFavorite(weapon.id)"
            >
              <el-icon :size="16">
                <StarFilled v-if="isFavorite(weapon.id)" />
                <Star v-else />
              </el-icon>
            </button>
            <div class="card-tags">
              <span class="mini-tag type">{{ weapon.type }}</span>
              <span class="mini-tag region">
                <el-icon :size="12"><Location /></el-icon>
                {{ weapon.region }}
              </span>
              <span class="mini-tag attack">{{ attackTypeOf(weapon) }}</span>
              <span
                v-for="status in weapon.status"
                :key="status"
                class="mini-tag status"
                :style="{ color: statusColor(status), borderColor: statusColor(status) }"
              >
                {{ status }}
              </span>
            </div>
          </div>

          <p class="card-desc">{{ weapon.description }}</p>

          <div class="card-values">
            <div class="value-item">
              <span class="value-label">物理</span>
              <strong class="value-num">{{ weapon.stats.physical }}</strong>
            </div>
            <div v-for="dmg in extraDamages(weapon.stats)" :key="dmg.key" class="value-item">
              <span class="value-label">{{ dmg.label }}</span>
              <strong class="value-num" :style="{ color: dmg.color }">{{ dmg.value }}</strong>
            </div>
            <div class="value-item">
              <span class="value-label">重量</span>
              <strong class="value-num">{{ weapon.stats.weight }}</strong>
            </div>
          </div>

          <div class="card-scaling">
            <span
              v-for="attr in ATTR_KEYS"
              :key="attr"
              class="scaling-pill"
              :class="{ empty: weapon.scaling[attr] === '-' }"
              :style="{ color: scalingColor(weapon.scaling[attr]), borderColor: scalingColor(weapon.scaling[attr]) }"
            >
              {{ ATTR_LABELS[attr][0] }}·{{ weapon.scaling[attr] }}
            </span>
          </div>

          <div class="card-foot">
            <el-icon :size="14"><MagicStick /></el-icon>
            <span class="skill-name">{{ weapon.skill ? weapon.skill.name : '无战技' }}</span>
            <el-icon class="arrow" :size="14"><ArrowRight /></el-icon>
          </div>
        </RouterLink>
      </div>

      <!-- 表格视图 -->
        <el-table
          v-else
          :data="pagedWeapons"
          class="weapon-table"
          row-class-name="weapon-row"
          @row-click="goDetail"
        >
        <el-table-column prop="name" label="武器" min-width="150">
          <template #default="{ row }">
            <span class="table-name">{{ row.name }}</span>
            <span v-if="row.dlc" class="dlc-tag">(DLC)</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="region" label="地区" width="110" />
        <el-table-column label="物理" width="80" align="right">
          <template #default="{ row }">{{ row.stats.physical }}</template>
        </el-table-column>
        <el-table-column label="属性伤害" min-width="120">
          <template #default="{ row }">
            <template v-if="extraDamages(row.stats).length">
              <span
                v-for="dmg in extraDamages(row.stats)"
                :key="dmg.key"
                class="dmg-chip"
                :style="{ color: dmg.color, borderColor: dmg.color }"
              >
                {{ dmg.label }} {{ dmg.value }}
              </span>
            </template>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态异常" width="110">
          <template #default="{ row }">
            <template v-if="row.status.length">
              <span
                v-for="status in row.status"
                :key="status"
                class="dmg-chip"
                :style="{ color: statusColor(status), borderColor: statusColor(status) }"
              >
                {{ status }}
              </span>
            </template>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="重量" width="80" align="right">
          <template #default="{ row }">{{ row.stats.weight }}</template>
        </el-table-column>
        <el-table-column label="补正" min-width="170">
          <template #default="{ row }">
            <span v-for="attr in ATTR_KEYS" :key="attr" class="scaling-pill small" :class="{ empty: row.scaling[attr] === '-' }" :style="{ color: scalingColor(row.scaling[attr]), borderColor: scalingColor(row.scaling[attr]) }">
              {{ ATTR_LABELS[attr][0] }}·{{ row.scaling[attr] }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="战技" min-width="120">
          <template #default="{ row }">
            {{ row.skill ? row.skill.name : '无战技' }}
          </template>
        </el-table-column>
        </el-table>
    </div>

    <!-- 分页栏 -->
    <PagerBar
      v-if="filteredWeapons.length"
      :page-size="pageSize"
      :current-page="currentPage"
      :total-pages="totalPages"
      :page-items="pageItems"
      :page-size-options="pageSizeOptions"
      :total="filteredWeapons.length"
      unit="件"
      @change-page="goPage"
      @change-size="setPageSize"
    />

    <!-- 空状态 -->
    <el-empty v-if="filteredWeapons.length === 0" description="没有符合条件的武器，换个关键词试试">
      <el-button type="primary" plain @click="resetFilters">清除筛选</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Search, RefreshLeft, Star, StarFilled } from '@element-plus/icons-vue'
import weapons, { weaponTypeGroups } from '../data/weapons'
import PagerBar from '../components/PagerBar.vue'
import { usePagination } from '../composables/usePagination'
import { useWeaponFavorites } from '../composables/useWeaponFavorites'
import {
  ATTR_KEYS,
  ATTR_LABELS,
  attackTypeOf,
  extraDamages,
  matchKeyword,
  scalingColor,
  scalingScore,
  scalingTotal,
  statusColor,
} from '../utils/weapon'

const router = useRouter()
const { favoriteCount, isFavorite, toggleFavorite } = useWeaponFavorites()

const keyword = ref('')
const selectedTypes = ref([])
const selectedAttrs = ref([])
const selectedStatuses = ref([])
const onlyFavorites = ref(false)
// 版本筛选：all 全部 / base 本体 / dlc 仅 DLC
const dlcFilter = ref('all')
const viewMode = ref('card')
const sortKey = ref('default')

// 分页：480 件全量渲染约 1.2 万个 DOM 节点，低端机滚动与切换筛选都会掉帧。
// pageSize = 0 表示「全部」，保留 Ctrl+F 全文查找能力（分页模式下只有当前页在 DOM 里）。
const listRef = ref(null)
const pageSizeOptions = [
  { value: 20, label: '20' },
  { value: 48, label: '48' },
  { value: 120, label: '120' },
  { value: 0, label: '全部' },
]

const sortOptions = [
  { value: 'default', label: '默认（按类型）' },
  { value: 'name', label: '名称' },
  { value: 'physical-desc', label: '物理攻击 从高到低' },
  { value: 'scaling-desc', label: '补正总和 从高到低' },
  { value: 'weight-asc', label: '重量 从轻到重' },
]

const dlcCount = computed(() => weapons.filter((item) => item.dlc).length)

const baseCount = computed(() => weapons.length - dlcCount.value)

const dlcOptions = computed(() => [
  { value: 'all', label: '全部', count: weapons.length },
  { value: 'base', label: '本体', count: baseCount.value },
  { value: 'dlc', label: 'DLC', count: dlcCount.value },
])

const typeOptions = computed(() => {
  const counter = new Map()
  weapons.forEach((item) => counter.set(item.type, (counter.get(item.type) || 0) + 1))
  return [...counter.entries()].map(([name, count]) => ({ name, count }))
})

const typeGroups = computed(() => {
  const countMap = new Map(typeOptions.value.map((item) => [item.name, item.count]))
  return weaponTypeGroups
    .map((group) => ({
      label: group.label,
      items: group.types
        .filter((name) => countMap.has(name))
        .map((name) => ({ name, count: countMap.get(name) })),
    }))
    .filter((group) => group.items.length > 0)
})

const statusOptions = computed(() => {
  const counter = new Map()
  weapons.forEach((item) => {
    ;(item.status || []).forEach((status) => counter.set(status, (counter.get(status) || 0) + 1))
  })
  return [...counter.entries()].map(([name, count]) => ({ name, count }))
})

const highlights = computed(() => {
  const maxPhysical = weapons.reduce((max, item) => Math.max(max, item.stats.physical), 0)
  return [
    { value: weapons.length, label: '收录武器' },
    { value: typeOptions.value.length, label: '武器类型' },
    { value: dlcCount.value, label: 'DLC 武器' },
    { value: maxPhysical, label: '最高物理面板' },
  ]
})

const isFiltering = computed(
  () =>
    keyword.value.trim() !== '' ||
    selectedTypes.value.length > 0 ||
    selectedAttrs.value.length > 0 ||
    selectedStatuses.value.length > 0 ||
    onlyFavorites.value ||
    dlcFilter.value !== 'all'
)

const filteredWeapons = computed(() => {
  const list = weapons.filter((item) => {
    if (!matchKeyword(item, keyword.value)) return false
    if (selectedTypes.value.length && !selectedTypes.value.includes(item.type)) return false
    if (dlcFilter.value === 'dlc' && !item.dlc) return false
    if (dlcFilter.value === 'base' && item.dlc) return false
    if (onlyFavorites.value && !isFavorite(item.id)) return false
    if (selectedStatuses.value.length) {
      const hit = selectedStatuses.value.some((status) => (item.status || []).includes(status))
      if (!hit) return false
    }
    if (selectedAttrs.value.length) {
      const hit = selectedAttrs.value.some((attr) => scalingScore(item.scaling[attr]) > 0)
      if (!hit) return false
    }
    return true
  })

  const sorter = {
    name: (a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'),
    'physical-desc': (a, b) => b.stats.physical - a.stats.physical,
    'scaling-desc': (a, b) => scalingTotal(b.scaling) - scalingTotal(a.scaling),
    'weight-asc': (a, b) => a.stats.weight - b.stats.weight,
  }[sortKey.value]

  return sorter ? [...list].sort(sorter) : list
})

// 分页：480 件全量渲染约 1.2 万个 DOM 节点，低端机滚动与切筛选都会掉帧。
// 默认 20 条/页；「全部」选项保留 Ctrl+F 全文查找能力（分页时只有当前页在 DOM 里）。
// 指纹覆盖全部筛选 / 排序维度，任一变化都要丢掉旧页码
const filterToken = () =>
  [
    keyword.value,
    dlcFilter.value,
    sortKey.value,
    onlyFavorites.value,
    selectedTypes.value.join(','),
    selectedAttrs.value.join(','),
    selectedStatuses.value.join(','),
  ].join('|')

const {
  pageSize,
  currentPage,
  totalPages,
  pageStart,
  pageEnd,
  pageItems,
  pagedList: pagedWeapons,
  goPage: changePage,
  setPageSize: changePageSize,
} = usePagination(filteredWeapons, {
  initialPageSize: 20,
  // 不重置的话会停在第 18 页、而新结果只有 3 件，页面看着是空的
  resetToken: filterToken,
})

// 筛选变化时视口可能还停在旧列表底部，一并拉回列表顶部（须在上面的 watch 之后注册）
watch(filterToken, () => scrollToList())

function goPage(page) {
  if (changePage(page)) scrollToList()
}

function setPageSize(size) {
  if (changePageSize(size)) scrollToList()
}

// 翻页后如果视口还在列表下方，滚回列表顶部；顶部导航约 70px，留出余量
function scrollToList() {
  const element = listRef.value
  if (!element) return
  const top = element.getBoundingClientRect().top + window.scrollY - 84
  if (window.scrollY > top) {
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

function toggleType(name) {
  const index = selectedTypes.value.indexOf(name)
  if (index > -1) {
    selectedTypes.value.splice(index, 1)
  } else {
    selectedTypes.value.push(name)
  }
}

function toggleAttr(attr) {
  const index = selectedAttrs.value.indexOf(attr)
  if (index > -1) {
    selectedAttrs.value.splice(index, 1)
  } else {
    selectedAttrs.value.push(attr)
  }
}

function toggleStatus(name) {
  const index = selectedStatuses.value.indexOf(name)
  if (index > -1) {
    selectedStatuses.value.splice(index, 1)
  } else {
    selectedStatuses.value.push(name)
  }
}

function resetFilters() {
  keyword.value = ''
  selectedTypes.value = []
  selectedAttrs.value = []
  selectedStatuses.value = []
  onlyFavorites.value = false
  dlcFilter.value = 'all'
  sortKey.value = 'default'
}

function goDetail(row) {
  router.push(`/weapons/${row.id}`)
}
</script>

<style scoped>
.weapons-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
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
  max-width: 560px;
  color: #9d977f;
  font-size: 13px;
  line-height: 1.7;
}

.hero-sub strong {
  color: #e5e3d8;
  font-weight: 600;
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

/* 筛选区 */
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
  width: 300px;
}

.sort-select {
  width: 190px;
}

.line-label {
  width: 36px;
  flex-shrink: 0;
  font-size: 13px;
  color: #8a8574;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 类型分组：40 类按近战 / 远程 / 防御分三行 */
.type-line {
  align-items: flex-start;
}

.type-line .line-label {
  padding-top: 5px;
}

.type-groups {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.group-label {
  width: 30px;
  flex-shrink: 0;
  font-size: 12px;
  color: #6b6555;
}

.all-chip {
  padding: 5px 12px;
  font-size: 13px;
  color: #b8b2a0;
  background: #202020;
  border: 1px solid #383225;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.18s;
}

.all-chip:hover {
  color: #d4af37;
  border-color: #6b5c2e;
}

.all-chip.active {
  color: #121212;
  font-weight: 600;
  background: #d4af37;
  border-color: #d4af37;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  font-size: 13px;
  color: #b8b2a0;
  background: #202020;
  border: 1px solid #383225;
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

.quick-toggles {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.chip.active .status-dot {
  background: #121212 !important;
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

.result-hint {
  margin-left: 10px;
  font-size: 12px;
  color: #6b6555;
}

/* 卡片 */
.weapon-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.weapon-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border: 1px solid #332d20;
  border-radius: 10px;
  background: #1c1c1c;
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}

/* 「全部」模式下数百张卡片同时存在，屏幕外内容跳过布局与绘制；
   分页模式只有 20 条，开着反而多一次可见性判定，故仅在 is-full 下启用 */
.weapon-grid.is-full .weapon-card {
  content-visibility: auto;
  contain-intrinsic-size: auto 230px;
}

.weapon-card:hover {
  border-color: #d4af37;
  transform: translateY(-3px);
  box-shadow: 0 10px 26px rgba(212, 175, 55, 0.1);
}

.card-head {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 24px;
}

.card-name {
  margin: 0;
  font-size: 17px;
  color: #e5e3d8;
}

.fav-btn {
  position: absolute;
  top: -3px;
  right: -3px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  color: #5d5849;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.18s, background-color 0.18s;
}

.fav-btn:hover {
  color: #d4af37;
  background: rgba(212, 175, 55, 0.12);
}

.fav-btn.active {
  color: #d4af37;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.mini-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
}

.mini-tag.type {
  color: #d4af37;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.mini-tag.region {
  color: #8a8574;
  background: #242424;
  border: 1px solid #383225;
}

.mini-tag.attack {
  color: #9aa7b8;
  background: #202429;
  border: 1px solid #33404d;
}

.mini-tag.status {
  background: transparent;
  border: 1px solid;
}

.card-desc {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: #8a8574;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-values {
  display: flex;
  gap: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #161616;
  border: 1px solid #2a2519;
}

.value-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.value-label {
  font-size: 11px;
  color: #7a7565;
}

.value-num {
  font-size: 15px;
  color: #e5e3d8;
}

.card-scaling {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.scaling-pill {
  padding: 1px 6px;
  font-size: 11px;
  border: 1px solid;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.02);
}

.scaling-pill.empty {
  opacity: 0.4;
}

.scaling-pill.small {
  margin-right: 4px;
}

.card-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px dashed #332d20;
  font-size: 12.5px;
  color: #b8b2a0;
}

.skill-name {
  color: #cfae5b;
}

.arrow {
  margin-left: auto;
  color: #6b6555;
}

/* 表格 */
.weapon-table {
  --el-table-bg-color: #1c1c1c;
  --el-table-tr-bg-color: #1c1c1c;
  --el-table-header-bg-color: #242424;
  --el-table-border-color: #332d20;
  --el-table-text-color: #c9c4b4;
  --el-table-header-text-color: #8a8574;
  --el-table-row-hover-bg-color: rgba(212, 175, 55, 0.07);
  border: 1px solid #332d20;
  border-radius: 10px;
}

.weapon-row {
  cursor: pointer;
}

.table-name {
  color: #e5e3d8;
  font-weight: 600;
}

.dmg-chip {
  display: inline-block;
  margin-right: 4px;
  padding: 0 5px;
  font-size: 11px;
  border: 1px solid;
  border-radius: 4px;
}

.muted {
  color: #5d5849;
}

@media (max-width: 1000px) {
  .weapon-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .page-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 680px) {
  .weapon-grid {
    grid-template-columns: 1fr;
  }
  .search-input,
  .sort-select {
    width: 100%;
  }
  .hero-badges {
    flex-wrap: wrap;
  }
}
</style>
