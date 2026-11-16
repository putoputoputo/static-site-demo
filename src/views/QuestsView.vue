<template>
  <div class="quests-page">
    <!-- 页头 -->
    <header class="page-hero">
      <div class="hero-text">
        <h1 class="hero-title">支线任务</h1>
        <p class="hero-sub">
          共收录 <strong>{{ stats.total }}</strong> 条 NPC 支线（本体 <strong>{{ stats.base }}</strong>
          条 + DLC <strong>{{ stats.dlc }}</strong> 条），其中
          <strong>{{ stats.missable }}</strong> 条存在错过节点。全部
          <strong>{{ stats.ready }}</strong> 条均已完成全流程整理，含步骤、奖励与分支对照。
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
          placeholder="搜索 NPC / 区域 / 奖励 / 步骤关键词"
          clearable
          :prefix-icon="Search"
        />
        <el-radio-group v-model="scope" class="scope-switch">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="base">本体</el-radio-button>
          <el-radio-button value="dlc">DLC</el-radio-button>
        </el-radio-group>
        <el-select v-model="sortKey" class="sort-select" placeholder="排序">
          <el-option v-for="item in sortOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <div class="filter-line">
        <span class="line-label">区域</span>
        <div class="chips">
          <button class="chip" :class="{ active: selectedRegions.length === 0 }" @click="selectedRegions = []">
            全部
          </button>
          <button
            v-for="item in regionOptions"
            :key="item.name"
            class="chip"
            :class="{ active: selectedRegions.includes(item.name) }"
            @click="toggleRegion(item.name)"
          >
            {{ item.name }}
            <span class="chip-count">{{ item.count }}</span>
          </button>
        </div>
      </div>

      <div class="filter-line">
        <span class="line-label">筛选</span>
        <div class="chips">
          <button
            v-for="item in progressOptions"
            :key="item.value"
            class="chip"
            :class="{ active: progressFilter === item.value }"
            @click="progressFilter = item.value"
          >
            {{ item.label }}
          </button>
          <span class="chip-divider"></span>
          <button class="chip warn" :class="{ active: onlyMissable }" @click="onlyMissable = !onlyMissable">
            仅看易错过
          </button>
          <button
            v-if="stats.ready < stats.total"
            class="chip"
            :class="{ active: onlyReady }"
            @click="onlyReady = !onlyReady"
          >
            仅看已整理
          </button>
        </div>
        <div class="filter-tail">
          <span class="result-count">{{ filtered.length }} 条</span>
          <el-button v-if="isFiltering" text size="small" :icon="RefreshLeft" @click="resetFilters">
            清除筛选
          </el-button>
        </div>
      </div>
    </section>

    <!-- 列表 -->
    <section v-if="filtered.length" class="quest-grid">
      <article
        v-for="quest in filtered"
        :key="quest.id"
        class="quest-card"
        :class="{ done: isCompleted(quest.id), pending: !quest.ready }"
        @click="goDetail(quest.id)"
      >
        <div class="card-head">
          <h2 class="card-name">
            {{ quest.name }}
            <span v-if="quest.dlc" class="dlc-tag">(DLC)</span>
          </h2>
          <button
            class="done-toggle"
            :class="{ active: isCompleted(quest.id) }"
            :title="isCompleted(quest.id) ? '标记为未完成' : '标记为已完成'"
            @click.stop="toggleCompleted(quest.id)"
          >
            <el-icon :size="14"><Check /></el-icon>
          </button>
        </div>

        <div class="card-tags">
          <span class="mini-tag region">
            <el-icon :size="12"><Location /></el-icon>
            {{ quest.region }}
          </span>
          <span class="mini-tag length" :style="{ color: LENGTH_COLORS[quest.length], borderColor: LENGTH_COLORS[quest.length] + '55' }">
            {{ LENGTH_LABELS[quest.length] }}线
          </span>
          <span v-if="quest.missable" class="mini-tag missable">易错过</span>
          <span v-if="quest.ready" class="mini-tag steps">{{ stepCount(quest) }} 步</span>
          <span v-else class="mini-tag pending-tag">整理中</span>
        </div>

        <p class="card-summary">{{ quest.summary }}</p>

        <div v-if="quest.rewards?.length" class="card-rewards">
          <span class="reward-label">奖励</span>
          <span v-for="reward in quest.rewards.slice(0, 3)" :key="reward.name" class="reward-item">
            {{ reward.name }}
          </span>
          <span v-if="quest.rewards.length > 3" class="reward-more">+{{ quest.rewards.length - 3 }}</span>
        </div>
      </article>
    </section>

    <el-empty v-else description="没有符合条件的支线，换个关键词试试">
      <el-button type="primary" plain @click="resetFilters">清除筛选</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search, RefreshLeft, Location, Check } from '@element-plus/icons-vue'
import quests, { questStats, questRegions } from '../data/quests'
import { LENGTH_COLORS, LENGTH_LABELS, matchQuest, sortQuests, stepCount } from '../utils/quest'
import { useQuestProgress } from '../composables/useQuestProgress'

const router = useRouter()
const { isCompleted, toggleCompleted, completedCount } = useQuestProgress()

const stats = questStats

const keyword = ref('')
const selectedRegions = ref([])
const scope = ref('all')
const onlyMissable = ref(false)
const onlyReady = ref(false)
const progressFilter = ref('all')
const sortKey = ref('region')

const sortOptions = [
  { value: 'region', label: '按区域顺序' },
  { value: 'name', label: '按名称' },
  { value: 'length', label: '按支线长度' },
]

const progressOptions = [
  { value: 'all', label: '全部' },
  { value: 'todo', label: '未完成' },
  { value: 'done', label: '已完成' },
]

const totalSteps = computed(() => quests.reduce((sum, item) => sum + (item.steps?.length || 0), 0))

const branchCount = computed(() =>
  quests.reduce((sum, item) => sum + (item.branches?.length || 0), 0)
)

const highlights = computed(() => [
  { value: stats.total, label: '总支线' },
  { value: stats.missable, label: '易错过' },
  { value: `${completedCount.value}/${stats.total}`, label: '我的进度' },
  { value: totalSteps.value, label: '攻略步骤' },
  { value: branchCount.value, label: '分支对照' },
])

const regionOptions = computed(() =>
  questRegions
    .map((name) => ({ name, count: quests.filter((item) => item.region === name).length }))
    .filter((item) => item.count > 0)
)

const isFiltering = computed(
  () =>
    keyword.value.trim() !== '' ||
    selectedRegions.value.length > 0 ||
    scope.value !== 'all' ||
    onlyMissable.value ||
    onlyReady.value ||
    progressFilter.value !== 'all'
)

const filtered = computed(() => {
  const list = quests.filter((item) => {
    if (!matchQuest(item, keyword.value)) return false
    if (selectedRegions.value.length && !selectedRegions.value.includes(item.region)) return false
    if (scope.value === 'base' && item.dlc) return false
    if (scope.value === 'dlc' && !item.dlc) return false
    if (onlyMissable.value && !item.missable) return false
    if (onlyReady.value && !item.ready) return false
    if (progressFilter.value === 'todo' && isCompleted(item.id)) return false
    if (progressFilter.value === 'done' && !isCompleted(item.id)) return false
    return true
  })

  if (sortKey.value === 'name') {
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
  }
  if (sortKey.value === 'length') {
    const rank = { 长: 3, 中: 2, 短: 1 }
    return [...list].sort((a, b) => rank[b.length] - rank[a.length])
  }
  return sortQuests(list)
})

function toggleRegion(name) {
  const index = selectedRegions.value.indexOf(name)
  if (index > -1) {
    selectedRegions.value.splice(index, 1)
  } else {
    selectedRegions.value.push(name)
  }
}

function resetFilters() {
  keyword.value = ''
  selectedRegions.value = []
  scope.value = 'all'
  onlyMissable.value = false
  onlyReady.value = false
  progressFilter.value = 'all'
  sortKey.value = 'region'
}

function goDetail(id) {
  router.push(`/side-quests/${id}`)
}
</script>

<style scoped>
.quests-page {
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
  border: 1px solid color-mix(in srgb, var(--accent) 14%, transparent);
  border-radius: 12px;
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 14%, transparent), transparent 65%), var(--surface);
}

.hero-title {
  margin: 0 0 8px;
  font-size: 26px;
  letter-spacing: 2px;
  color: var(--accent);
}

.hero-sub {
  margin: 0;
  max-width: 620px;
  color: var(--fg-3);
  font-size: 13px;
  line-height: 1.7;
}

.hero-sub strong {
  color: var(--fg);
  font-weight: 600;
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
  border: 1px solid color-mix(in srgb, var(--accent) 14%, transparent);
  border-radius: 8px;
  background: var(--bg);
}

.badge-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--accent);
}

.badge-label {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: var(--fg-3);
}

/* 筛选区 */
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
  border: 1px solid color-mix(in srgb, var(--accent) 12%, transparent);
  border-radius: 10px;
  background: var(--surface);
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
  width: 150px;
}

.scope-switch {
  flex-shrink: 0;
}

.line-label {
  width: 36px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--fg-3);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  font-size: 12px;
  color: var(--fg-3);
  background: var(--surface-2);
  border: 1px solid var(--fg-4);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.16s ease;
}

.chip:hover {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
}

.chip.active {
  color: var(--surface);
  background: var(--accent);
  border-color: var(--accent);
  font-weight: 600;
}

.chip.active .chip-count {
  color: var(--accent);
}

.chip.warn.active {
  background: color-mix(in srgb, #c16b4f var(--tone-mix), var(--fg));
  border-color: color-mix(in srgb, #c16b4f var(--tone-mix), var(--fg));
  color: var(--surface);
}

.chip-count {
  font-size: 11px;
  color: var(--fg-4);
}

.chip-divider {
  width: 1px;
  height: 16px;
  background: color-mix(in srgb, var(--accent) 11%, transparent);
  margin: 0 2px;
}

.filter-tail {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-count {
  font-size: 12px;
  color: var(--fg-3);
}

/* 卡片 */
.quest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.quest-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px 18px;
  border: 1px solid color-mix(in srgb, var(--accent) 12%, transparent);
  border-radius: 10px;
  background: var(--surface);
  cursor: pointer;
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.quest-card:hover {
  border-color: color-mix(in srgb, var(--accent) 41%, transparent);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.quest-card.done {
  border-color: color-mix(in srgb, #3f5237 var(--tone-mix), var(--fg));
  background: linear-gradient(160deg, rgba(122, 158, 106, 0.08), transparent 55%), var(--surface);
}

.quest-card.pending {
  background: var(--surface);
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.card-name {
  margin: 0;
  font-size: 16px;
  color: var(--fg);
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.dlc-tag {
  font-size: 11px;
  color: color-mix(in srgb, var(--accent) 86%, transparent);
  font-weight: 400;
}

.done-toggle {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--fg-4);
  background: transparent;
  border: 1px solid var(--fg-4);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.16s ease;
}

.done-toggle:hover {
  color: color-mix(in srgb, #9bbd8a var(--tone-mix), var(--fg));
  border-color: color-mix(in srgb, #4e6242 var(--tone-mix), var(--fg));
}

.done-toggle.active {
  color: var(--surface);
  background: color-mix(in srgb, #8fb87e var(--tone-mix), var(--fg));
  border-color: color-mix(in srgb, #8fb87e var(--tone-mix), var(--fg));
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mini-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  font-size: 11px;
  border-radius: 4px;
  color: var(--fg-3);
  background: var(--surface-3);
  border: 1px solid color-mix(in srgb, var(--accent) 13%, transparent);
}

.mini-tag.region {
  color: var(--fg-3);
}

.mini-tag.length {
  background: transparent;
}

.mini-tag.missable {
  color: color-mix(in srgb, #c16b4f var(--tone-mix), var(--fg));
  background: rgba(193, 107, 79, 0.1);
  border-color: rgba(193, 107, 79, 0.3);
}

.mini-tag.steps {
  color: color-mix(in srgb, #8fa88a var(--tone-mix), var(--fg));
  background: rgba(143, 168, 138, 0.1);
  border-color: rgba(143, 168, 138, 0.25);
}

.mini-tag.pending-tag {
  color: var(--fg-4);
  background: transparent;
  border-style: dashed;
  border-color: color-mix(in srgb, var(--accent) 11%, transparent);
}

.card-summary {
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--fg-3);
}

.card-rewards {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px dashed color-mix(in srgb, var(--accent) 7%, transparent);
}

.reward-label {
  font-size: 11px;
  color: var(--fg-4);
}

.reward-item {
  font-size: 11px;
  color: color-mix(in srgb, var(--accent) 93%, transparent);
  background: color-mix(in srgb, var(--accent) 7%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
  border-radius: 4px;
  padding: 1px 6px;
}

.reward-more {
  font-size: 11px;
  color: var(--fg-4);
}
</style>
