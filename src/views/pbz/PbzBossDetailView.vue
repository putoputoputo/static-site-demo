<template>
  <div v-if="boss" class="pbz">
    <el-breadcrumb class="breadcrumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/pbz' }">影之刃零</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/pbz/bosses' }">BOSS 攻略</el-breadcrumb-item>
      <el-breadcrumb-item>{{ boss.name }}</el-breadcrumb-item>
    </el-breadcrumb>

    <header class="detail-hero">
      <div class="hero-main">
        <div class="hero-eyebrow">BOSS · {{ boss.region }}</div>
        <h1 class="detail-title">{{ boss.name }}</h1>
        <p class="detail-title-en">
          <template v-if="boss.zhPending">中文名待补，暂以英文版名称显示</template>
          <template v-else>{{ boss.nameEn }}</template>
        </p>
        <div class="hero-tags">
          <span class="mini-tag">{{ boss.region }}</span>
          <span v-if="boss.phases" class="mini-tag pending">{{ boss.phases }} 阶段</span>
          <span v-if="boss.zhPending" class="mini-tag pending">中文名待补</span>
        </div>

        <button
          class="fav-btn labelled detail-fav"
          :class="{ active: isBossFavorite(boss.id) }"
          type="button"
          :aria-pressed="isBossFavorite(boss.id)"
          @click="toggleBossFavorite(boss.id)"
        >
          <el-icon :size="15">
            <StarFilled v-if="isBossFavorite(boss.id)" />
            <Star v-else />
          </el-icon>
          <span>{{ isBossFavorite(boss.id) ? '已收藏' : '收藏' }}</span>
        </button>
      </div>

      <div class="hero-facts">
        <div class="fact">
          <span class="fact-label">区域</span>
          <span class="fact-value">{{ boss.region }}</span>
        </div>
        <div class="fact">
          <span class="fact-label">掉落</span>
          <span class="fact-value">{{ boss.drop || '无 / 未记录' }}</span>
        </div>
      </div>
    </header>

    <div class="detail-body">
      <div class="detail-main">
        <section class="panel">
          <h2 class="panel-title">打法要点</h2>
          <p class="paragraph">{{ boss.tips }}</p>
        </section>

        <section class="panel">
          <h2 class="panel-title">位置</h2>
          <div class="location-box">
            <el-icon :size="16" color="#d8574a"><Location /></el-icon>
            <p>{{ boss.region }}：{{ boss.place }}</p>
          </div>
        </section>

        <section v-if="drops.length" class="panel">
          <h2 class="panel-title">掉落</h2>
          <p class="paragraph">{{ boss.drop }}</p>
          <div v-if="linkedDrops.length" class="sibling-grid" style="margin-top: 12px">
            <RouterLink v-for="entry in linkedDrops" :key="entry.to" :to="entry.to" class="sibling-card">
              <span class="sibling-name">{{ entry.name }}</span>
              <span class="sibling-effect">{{ entry.label }} · 查看图鉴</span>
            </RouterLink>
          </div>
        </section>

        <section class="panel">
          <h2 class="panel-title">数据出处</h2>
          <p class="paragraph muted">
            位置、掉落与打法整理自 Fextralife 英文 wiki 对应页面，招式名沿用英文版名称；中文名来自 3DM 攻略目录。
          </p>
          <p class="paragraph">
            <a class="source-link" :href="boss.source" target="_blank" rel="noopener noreferrer">{{ boss.source }}</a>
          </p>
        </section>

        <section v-if="siblings.length" class="panel">
          <h2 class="panel-title">{{ boss.region }}的其他 BOSS</h2>
          <div class="sibling-grid">
            <RouterLink v-for="sibling in siblings" :key="sibling.id" :to="bossHref(sibling)" class="sibling-card">
              <span class="sibling-name">{{ sibling.name }}</span>
              <span class="sibling-effect">{{ sibling.place }}</span>
            </RouterLink>
          </div>
        </section>
      </div>

      <aside>
        <section class="panel sticky">
          <h2 class="panel-title small">{{ boss.region }}</h2>
          <p class="category-desc">{{ regionDesc }}</p>

          <div class="pager">
            <button class="pager-btn" :disabled="!prevBoss" @click="goTo(prevBoss)">
              <el-icon><ArrowLeft /></el-icon>
              上一个
            </button>
            <button class="pager-btn" :disabled="!nextBoss" @click="goTo(nextBoss)">
              下一个
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
          <p class="pager-hint">
            {{ prevBoss ? prevBoss.name : '已经是第一个' }} ·
            {{ nextBoss ? nextBoss.name : '已经是最后一个' }}
          </p>

          <RouterLink to="/pbz/bosses" class="back-link">
            <el-icon :size="12"><Back /></el-icon>
            返回 BOSS 攻略
          </RouterLink>
        </section>
      </aside>
    </div>
  </div>

  <el-empty v-else description="没有找到这个 BOSS，可能是链接已失效">
    <el-button type="primary" plain @click="$router.push('/pbz/bosses')">返回 BOSS 攻略</el-button>
  </el-empty>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Location, ArrowLeft, ArrowRight, Back, Star, StarFilled } from '@element-plus/icons-vue'
import bosses, { bossRegions } from '../../data/pbz/bosses'
import { pbzList } from '../../data/pbz/codex'
import { usePbzFavorites } from '../../composables/usePbzFavorites'
import { itemHref } from '../../utils/codex'
import { bossHref } from '../../utils/pbz'
import './pbz.css'

const route = useRoute()
const router = useRouter()

const { isBossFavorite, toggleBossFavorite } = usePbzFavorites()

const index = computed(() => bosses.findIndex((entry) => entry.id === route.params.id))
const boss = computed(() => bosses[index.value])

const prevBoss = computed(() => (index.value > 0 ? bosses[index.value - 1] : null))
const nextBoss = computed(() => (index.value > -1 && index.value < bosses.length - 1 ? bosses[index.value + 1] : null))

const siblings = computed(() =>
  bosses.filter((entry) => entry.region === boss.value.region && entry.id !== boss.value.id)
)

const regionDesc = computed(() => bossRegions.find((region) => region.id === boss.value.region).desc)

// 掉落是「、」分隔的名称串；其中能在武器 / 影之武装图鉴里按中文名对上的，给出跳转
const drops = computed(() => (boss.value.drop ? boss.value.drop.split('、') : []))

const linkedDrops = computed(() =>
  drops.value.flatMap((name) =>
    pbzList.flatMap((module) =>
      module.items
        .filter((item) => item.name === name || item.nameEn === name)
        .map((item) => ({ name: item.name, label: module.itemLabel, to: itemHref(module, item) }))
    )
  )
)

function goTo(target) {
  if (!target) return
  router.push(bossHref(target))
}
</script>
