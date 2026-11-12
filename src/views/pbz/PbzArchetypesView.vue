<template>
  <div class="pbz">
    <header class="page-hero">
      <div class="hero-text">
        <div class="hero-eyebrow">配装</div>
        <h1 class="hero-title">流派库</h1>
        <p class="hero-sub">
          影之刃零没有属性点，流派拼的是「两把主武器 + 两件影之武装 + 饰品 / 秘药 / 能力」的资源循环。
          这里按「这套靠什么赢」整理了 {{ pbzArchetypeStats.total }} 套配装：从第一章就能凑齐的流血快攻，
          到需要铸魂与二周目资源的换刀青龙。每套都写了核心装备、战斗循环、升级顺序与常见误区。
        </p>
      </div>
      <div class="hero-badges">
        <div v-for="item in highlights" :key="item.label" class="hero-badge">
          <span class="badge-value">{{ item.value }}</span>
          <span class="badge-label">{{ item.label }}</span>
        </div>
      </div>
    </header>

    <!-- 机制先导：不理解杀气 / 杀气精华 / 暗源，抄配装只会抄到表面 -->
    <section class="panel">
      <h2 class="panel-title">先分清三套资源</h2>
      <div class="primer-grid">
        <div class="primer-item">
          <strong>杀气</strong>
          <p>重攻击、杀气连段与格挡都会消耗；轻攻击积攒，切换主武器直接回满。杀气见底会进入破防，所以「换刀」本身就是一次防御。</p>
        </div>
        <div class="primer-item">
          <strong>杀气精华</strong>
          <p>绝技的消耗资源。用主武器攻击会积累特技槽，攒满后释放，每把武器的绝技效果都不同。</p>
        </div>
        <div class="primer-item">
          <strong>暗源</strong>
          <p>影之武装的消耗资源。多数一整套消耗 1 格，召唤类 2 格；坐铃铛恢复，见底时不要硬开团。</p>
        </div>
      </div>
      <p class="paragraph muted" style="margin-top: 12px">
        另外两条通用规则：蓝光招式可以招架，红光与黑光只能闪避；完美招架或完美闪避会触发鬼步，绕到敌人身后并回杀气。
        下面的每一套配装，都是在这几条规则上做取舍。
      </p>
    </section>

    <section class="filter-panel">
      <div class="filter-line">
        <el-input
          v-model="keyword"
          class="search-input"
          placeholder="搜索流派名 / 武器 / 影之武装 / 饰品 / 打法关键词"
          clearable
          :prefix-icon="Search"
        />
        <button class="chip" :class="{ active: onlyFavorites }" type="button" @click="onlyFavorites = !onlyFavorites">
          <el-icon :size="12"><Star /></el-icon>
          只看收藏
          <span class="chip-count">{{ archetypeFavoriteCount }}</span>
        </button>
      </div>

      <div class="filter-line">
        <span class="line-label">取向</span>
        <div class="chips">
          <button class="chip" :class="{ active: roles.length === 0 }" @click="roles = []">
            全部
            <span class="chip-count">{{ pbzArchetypeStats.total }}</span>
          </button>
          <button
            v-for="role in roleOptions"
            :key="role.id"
            class="chip"
            :class="{ active: roles.includes(role.id) }"
            @click="toggleRole(role.id)"
          >
            {{ role.id }}
            <span class="chip-count">{{ role.count }}</span>
          </button>
        </div>
      </div>

      <div class="filter-line">
        <span class="line-label">阶段</span>
        <div class="chips">
          <button class="chip" :class="{ active: stages.length === 0 }" @click="stages = []">
            全部
            <span class="chip-count">{{ pbzArchetypeStats.total }}</span>
          </button>
          <button
            v-for="stage in stageOptions"
            :key="stage.key"
            class="chip"
            :class="{ active: stages.includes(stage.key) }"
            :title="stage.hint"
            @click="toggleStage(stage.key)"
          >
            {{ stage.label }}
            <span class="chip-count">{{ stage.count }}</span>
          </button>
        </div>
      </div>
    </section>

    <div class="result-bar">
      <span>
        匹配 <strong>{{ filtered.length }}</strong> / {{ pbzArchetypeStats.total }} 套
        <template v-if="roles.length || stages.length">
          · 已选 {{ [...roles, ...stages.map(pbzStageLabel)].join('、') }}
        </template>
      </span>
      <el-button v-if="isFiltering" text type="warning" size="small" :icon="RefreshLeft" @click="resetFilters">
        清除筛选
      </el-button>
    </div>

    <div v-if="filtered.length" class="card-grid">
      <RouterLink v-for="item in filtered" :key="item.id" class="item-card" :to="`/pbz/archetypes/${item.id}`">
        <div class="card-head">
          <div class="card-title">
            <h2 class="card-name">{{ item.name }}</h2>
            <p v-if="item.alias.length" class="card-name-en">{{ item.alias.join(' / ') }}</p>
          </div>
          <button
            class="fav-btn"
            :class="{ active: isArchetypeFavorite(item.id) }"
            type="button"
            :title="isArchetypeFavorite(item.id) ? '取消收藏' : '加入收藏'"
            :aria-label="isArchetypeFavorite(item.id) ? '取消收藏' : '加入收藏'"
            @click.prevent.stop="toggleArchetypeFavorite(item.id)"
          >
            <el-icon :size="15">
              <StarFilled v-if="isArchetypeFavorite(item.id)" />
              <Star v-else />
            </el-icon>
          </button>
        </div>

        <div class="card-tags">
          <span
            class="mini-tag"
            :style="{
              color: pbzRoleColor(item.role),
              borderColor: `${pbzRoleColor(item.role)}66`,
              background: `${pbzRoleColor(item.role)}1f`,
            }"
          >
            {{ item.role }}
          </span>
          <span class="mini-tag pending">{{ pbzStageLabel(item.stage) }}</span>
          <span class="mini-tag pending">{{ pbzDifficultyLabel(item.difficulty) }}</span>
        </div>

        <p class="card-effect">{{ item.summary }}</p>

        <div class="core-summary">
          <p class="core-line">
            <em>主武器</em>
            <span>{{ item.items.weapons.map((weapon) => weapon.name).join(' + ') }}</span>
          </p>
          <p class="core-line">
            <em>影之武装</em>
            <span>{{ item.items.edges.map((edge) => edge.name).join(' + ') }}</span>
          </p>
        </div>

        <p class="card-location">
          <el-icon :size="12"><Guide /></el-icon>
          <span>{{ item.phases.length }} 步成型路线 · {{ item.pros[0] }}</span>
        </p>
      </RouterLink>
    </div>

    <el-empty v-if="filtered.length === 0" description="没有符合条件的流派，换个关键词或清掉筛选试试">
      <el-button type="primary" plain @click="resetFilters">清除筛选</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Search, RefreshLeft, Star, StarFilled, Guide } from '@element-plus/icons-vue'
import { useQuerySync } from '../../composables/useQuerySync'
import { usePbzFavorites } from '../../composables/usePbzFavorites'
import {
  filterPbzArchetypes,
  pbzArchetypeList,
  pbzArchetypeFilterOptions,
  pbzArchetypeStats,
  pbzDifficultyLabel,
  pbzRoleColor,
  pbzStageLabel,
} from '../../utils/pbzArchetypes'
import './pbz.css'

const { isArchetypeFavorite, toggleArchetypeFavorite, archetypeFavoriteCount } = usePbzFavorites()

const keyword = ref('')
const roles = ref([])
const stages = ref([])
const onlyFavorites = ref(false)

const highlights = [
  { value: pbzArchetypeStats.total, label: '套配装' },
  { value: pbzArchetypeStats.roles, label: '种取向' },
  { value: pbzArchetypeStats.starters, label: '前期可成型' },
  { value: pbzArchetypeStats.late, label: '后期终局' },
]

const roleOptions = computed(() =>
  pbzArchetypeFilterOptions.roles
    .map((role) => ({ id: role, count: pbzArchetypeList.filter((item) => item.role === role).length }))
    .filter((role) => role.count > 0)
)

const stageOptions = computed(() =>
  pbzArchetypeFilterOptions.stages.map((stage) => ({
    ...stage,
    count: pbzArchetypeList.filter((item) => item.stage === stage.key).length,
  }))
)

const filtered = computed(() => {
  let list = filterPbzArchetypes({ keyword: keyword.value, roles: roles.value, stages: stages.value })
  if (onlyFavorites.value) list = list.filter((item) => isArchetypeFavorite(item.id))
  return list
})

const isFiltering = computed(
  () => keyword.value.trim() !== '' || roles.value.length > 0 || stages.value.length > 0 || onlyFavorites.value
)

useQuerySync(
  { q: keyword, role: roles, stage: stages, fav: onlyFavorites },
  // 数组字段不给默认值：useQuerySync 会把 defaults 里的引用直接赋给 ref，
  // 共用同一个数组会在后续 toggle 时把默认值改脏
  { fav: false }
)

function toggleRole(id) {
  const index = roles.value.indexOf(id)
  if (index > -1) roles.value.splice(index, 1)
  else roles.value.push(id)
}

function toggleStage(key) {
  const index = stages.value.indexOf(key)
  if (index > -1) stages.value.splice(index, 1)
  else stages.value.push(key)
}

function resetFilters() {
  keyword.value = ''
  roles.value = []
  stages.value = []
  onlyFavorites.value = false
}
</script>
