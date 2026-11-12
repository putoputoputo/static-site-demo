<template>
  <div v-if="archetype" class="pbz">
    <el-breadcrumb class="breadcrumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/pbz' }">影之刃零</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/pbz/archetypes' }">流派库</el-breadcrumb-item>
      <el-breadcrumb-item>{{ archetype.name }}</el-breadcrumb-item>
    </el-breadcrumb>

    <header class="detail-hero">
      <div class="hero-main">
        <div class="hero-eyebrow">流派 · {{ archetype.role }}</div>
        <h1 class="detail-title">{{ archetype.name }}</h1>
        <p class="detail-place">
          <template v-if="archetype.alias.length">别名：{{ archetype.alias.join(' / ') }}</template>
          <template v-else>配装方案</template>
        </p>
        <p class="detail-effect">{{ archetype.summary }}</p>
        <div class="hero-tags">
          <span
            class="mini-tag"
            :style="{
              color: pbzRoleColor(archetype.role),
              borderColor: `${pbzRoleColor(archetype.role)}66`,
              background: `${pbzRoleColor(archetype.role)}1f`,
            }"
          >
            {{ archetype.role }}
          </span>
          <span class="mini-tag pending">{{ pbzStageLabel(archetype.stage) }}</span>
          <span v-for="tag in archetype.tags" :key="tag" class="mini-tag pending">{{ tag }}</span>
        </div>

        <button
          class="fav-btn labelled detail-fav"
          :class="{ active: isArchetypeFavorite(archetype.id) }"
          type="button"
          :aria-pressed="isArchetypeFavorite(archetype.id)"
          @click="toggleArchetypeFavorite(archetype.id)"
        >
          <el-icon :size="15">
            <StarFilled v-if="isArchetypeFavorite(archetype.id)" />
            <Star v-else />
          </el-icon>
          <span>{{ isArchetypeFavorite(archetype.id) ? '已收藏' : '收藏' }}</span>
        </button>
      </div>

      <div class="hero-facts">
        <div class="fact">
          <span class="fact-label">取向</span>
          <span class="fact-value">{{ archetype.role }}</span>
        </div>
        <div class="fact">
          <span class="fact-label">成型阶段</span>
          <span class="fact-value">{{ pbzStageLabel(archetype.stage) }}</span>
        </div>
        <div class="fact">
          <span class="fact-label">上手难度</span>
          <span class="fact-value">{{ pbzDifficultyLabel(archetype.difficulty) }}</span>
        </div>
        <div class="fact">
          <span class="fact-label">核心槽位</span>
          <span class="fact-value">{{ archetype.items.weapons.length }} 主武器 · {{ archetype.items.edges.length }} 影之武装</span>
        </div>
      </div>
    </header>

    <div class="detail-body">
      <div class="detail-main">
        <section class="panel">
          <h2 class="panel-title">机制与思路</h2>
          <p v-for="(paragraph, index) in archetype.hook" :key="index" class="paragraph">{{ paragraph }}</p>
        </section>

        <section class="panel">
          <h2 class="panel-title">核心配装</h2>

          <div class="loadout-group">
            <h3 class="loadout-title">主武器</h3>
            <div class="loadout-grid">
              <RouterLink v-for="weapon in archetype.items.weapons" :key="weapon.id" :to="weapon.to" class="loadout-card">
                <div class="loadout-head">
                  <span class="mini-tag">{{ weapon.category }}</span>
                  <span v-if="weapon.zhPending" class="mini-tag pending">中文名待补</span>
                </div>
                <strong class="loadout-name">{{ weapon.name }}</strong>
                <p class="loadout-effect">{{ weapon.effect }}</p>
                <p v-if="weapon.note" class="loadout-note">{{ weapon.note }}</p>
                <span class="loadout-location">{{ weapon.location }}</span>
              </RouterLink>
            </div>
          </div>

          <div class="loadout-group">
            <h3 class="loadout-title">影之武装</h3>
            <div class="loadout-grid">
              <RouterLink v-for="edge in archetype.items.edges" :key="edge.id" :to="edge.to" class="loadout-card">
                <div class="loadout-head">
                  <span class="mini-tag">{{ edge.category }}</span>
                  <span v-if="edge.zhPending" class="mini-tag pending">中文名待补</span>
                </div>
                <strong class="loadout-name">{{ edge.name }}</strong>
                <p class="loadout-effect">{{ edge.effect }}</p>
                <p v-if="edge.note" class="loadout-note">{{ edge.note }}</p>
                <span class="loadout-location">{{ edge.location }}</span>
              </RouterLink>
            </div>
          </div>
        </section>

        <section class="panel">
          <h2 class="panel-title">饰品与秘药</h2>

          <h3 class="loadout-title">饰品</h3>
          <div class="stack">
            <div v-for="entry in archetype.core.accessories" :key="entry.name" class="entry">
              <div class="entry-head">
                <h4 class="entry-name">{{ entry.name }}</h4>
              </div>
              <p class="entry-line">{{ entry.effect }}</p>
              <p class="entry-line"><em>获取</em>{{ entry.where }}</p>
            </div>
          </div>
          <p v-if="archetype.accessoryNote" class="paragraph muted" style="margin-top: 10px">
            {{ archetype.accessoryNote }}
          </p>

          <h3 class="loadout-title" style="margin-top: 18px">秘药</h3>
          <div class="stack">
            <div v-for="entry in archetype.core.medicines" :key="entry.name" class="entry">
              <div class="entry-head">
                <h4 class="entry-name">{{ entry.name }}</h4>
              </div>
              <p class="entry-line">{{ entry.effect }}</p>
              <p class="entry-line"><em>获取</em>{{ entry.where }}</p>
            </div>
          </div>
        </section>

        <section v-if="archetype.core.abilities.length" class="panel">
          <h2 class="panel-title">能力训练顺序</h2>
          <ol class="loop-list">
            <li v-for="ability in archetype.core.abilities" :key="ability.name" class="loop-step">
              <strong>{{ ability.name }}</strong>
              <span class="ability-cost">{{ ability.cost }}</span>
              <p>{{ ability.effect }}</p>
            </li>
          </ol>
          <p class="paragraph muted">能力在铃铛处用残尘训练，可随时重置。顺序按「先解决续航，再补伤害」排。</p>
        </section>

        <section class="panel">
          <h2 class="panel-title">战斗循环</h2>
          <ol class="loop-list">
            <li v-for="(step, index) in archetype.loop" :key="index" class="loop-step">{{ step }}</li>
          </ol>
        </section>

        <section v-if="archetype.upgrades.length" class="panel">
          <h2 class="panel-title">升级优先级</h2>
          <div class="stack">
            <div v-for="entry in archetype.upgrades" :key="entry.name" class="entry">
              <div class="entry-head">
                <h4 class="entry-name">{{ entry.name }}</h4>
              </div>
              <p class="entry-line">{{ entry.plan }}</p>
            </div>
          </div>
          <p class="paragraph muted" style="margin-top: 10px">
            武器 10 级前重置免费并全额返还材料，10 级后需要回退符；前中期可以大胆试错。
          </p>
        </section>

        <section class="panel">
          <h2 class="panel-title">成型路线</h2>
          <div class="stack">
            <div v-for="phase in phaseList" :key="phase.title" class="phase-block">
              <div class="phase-head">
                <h4 class="phase-title">{{ phase.title }}</h4>
                <span class="phase-when">{{ phase.when }}</span>
              </div>
              <p class="phase-goal">{{ phase.goal }}</p>

              <div v-if="hasGear(phase)" class="gear-chips">
                <RouterLink
                  v-for="gear in [...phase.gearItems.weapons, ...phase.gearItems.edges]"
                  :key="gear.kind + gear.id"
                  :to="gear.to"
                  class="gear-chip"
                >
                  {{ gear.name }}
                </RouterLink>
                <span v-for="name in phase.gearItems.accessories" :key="name" class="gear-chip plain">{{ name }}</span>
              </div>

              <ol class="phase-steps">
                <li v-for="(step, index) in phase.steps" :key="index">{{ step }}</li>
              </ol>
            </div>
          </div>
        </section>

        <section class="panel">
          <h2 class="panel-title">优点与短板</h2>
          <div class="pros-cons">
            <div>
              <h3 class="loadout-title">优点</h3>
              <ul class="note-list">
                <li v-for="item in archetype.pros" :key="item">{{ item }}</li>
              </ul>
            </div>
            <div>
              <h3 class="loadout-title">短板</h3>
              <ul class="note-list">
                <li v-for="item in archetype.cons" :key="item">{{ item }}</li>
              </ul>
            </div>
          </div>
        </section>

        <section class="panel">
          <h2 class="panel-title">常见误区</h2>
          <ul class="mistake-list">
            <li v-for="item in archetype.mistakes" :key="item">{{ item }}</li>
          </ul>
        </section>

        <section v-if="archetype.swaps.length" class="panel">
          <h2 class="panel-title">替换方案</h2>
          <div class="swap-list">
            <div v-for="swap in archetype.swaps" :key="swap.slot + swap.from + swap.to" class="swap-row">
              <span class="swap-slot">{{ swap.slot }}</span>
              <span class="swap-weapons">{{ swap.from }} → {{ swap.to }}</span>
              <p class="swap-note">{{ swap.note }}</p>
            </div>
          </div>
        </section>

        <section class="panel">
          <h2 class="panel-title">数据出处</h2>
          <p class="paragraph muted">
            配装与打法整理自游民星空的《全流派配装推荐》与《二周目推荐八套武器流派》，机制部分交叉参考
            Fextralife 与影之刃零 Wiki。武器与影之武装的类别、机制、获取方式以本站图鉴条目为准；
            饰品中有几件的卡面效果暂未找到可靠数值，已在对应位置注明。
          </p>
          <ul class="source-list">
            <li v-for="source in archetype.sources" :key="source.url">
              <a class="source-link" :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.label }}</a>
            </li>
          </ul>
        </section>
      </div>

      <aside>
        <section class="panel sticky">
          <h2 class="panel-title small">{{ archetype.role }} · {{ pbzStageLabel(archetype.stage) }}</h2>
          <p class="category-desc">{{ pbzStageHint(archetype.stage) }}</p>

          <div class="aside-facts">
            <div class="fact">
              <span class="fact-label">上手难度</span>
              <span class="fact-value">{{ pbzDifficultyLabel(archetype.difficulty) }}</span>
            </div>
            <div class="fact">
              <span class="fact-label">成型路线</span>
              <span class="fact-value">{{ archetype.phases.length }} 步</span>
            </div>
          </div>

          <div class="pager">
            <button class="pager-btn" :disabled="!prevArchetype" @click="goTo(prevArchetype)">
              <el-icon><ArrowLeft /></el-icon>
              上一套
            </button>
            <button class="pager-btn" :disabled="!nextArchetype" @click="goTo(nextArchetype)">
              下一套
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
          <p class="pager-hint">
            {{ prevArchetype ? prevArchetype.name : '已经是第一套' }} ·
            {{ nextArchetype ? nextArchetype.name : '已经是最后一套' }}
          </p>

          <RouterLink to="/pbz/archetypes" class="back-link">
            <el-icon :size="12"><Back /></el-icon>
            返回流派库
          </RouterLink>
        </section>
      </aside>
    </div>
  </div>

  <el-empty v-else description="没有找到这套流派，可能是链接已失效">
    <el-button type="primary" plain @click="$router.push('/pbz/archetypes')">返回流派库</el-button>
  </el-empty>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Back, Star, StarFilled } from '@element-plus/icons-vue'
import { usePbzFavorites } from '../../composables/usePbzFavorites'
import {
  pbzArchetypeDetail,
  pbzArchetypeNeighbors,
  pbzDifficultyLabel,
  pbzRoleColor,
  pbzStageHint,
  pbzStageLabel,
  resolvePbzGear,
} from '../../utils/pbzArchetypes'
import './pbz.css'

const route = useRoute()
const router = useRouter()

const { isArchetypeFavorite, toggleArchetypeFavorite } = usePbzFavorites()

const archetype = computed(() => pbzArchetypeDetail(route.params.id))

const neighbors = computed(() =>
  archetype.value ? pbzArchetypeNeighbors(archetype.value.id) : { prev: null, next: null }
)
const prevArchetype = computed(() => neighbors.value.prev)
const nextArchetype = computed(() => neighbors.value.next)

const phaseList = computed(() =>
  archetype.value
    ? archetype.value.phases.map((phase) => ({ ...phase, gearItems: resolvePbzGear(archetype.value, phase.gear) }))
    : []
)

function hasGear(phase) {
  return phase.gearItems.weapons.length || phase.gearItems.edges.length || phase.gearItems.accessories.length
}

function goTo(target) {
  if (!target) return
  router.push(`/pbz/archetypes/${target.id}`)
}
</script>
