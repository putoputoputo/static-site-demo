<template>
  <div v-if="item" class="pbz">
    <el-breadcrumb class="breadcrumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/pbz' }">影之刃零</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: module.path }">{{ module.title }}</el-breadcrumb-item>
      <el-breadcrumb-item>{{ item.name }}</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 头部 -->
    <header class="detail-hero">
      <div class="hero-main">
        <div class="hero-eyebrow">{{ module.eyebrow }} · {{ item.category }}</div>
        <h1 class="detail-title">{{ item.name }}</h1>
        <p class="detail-effect">{{ item.effect }}</p>
        <div class="hero-tags">
          <span class="mini-tag">{{ item.category }}</span>
          <span v-if="item.zhPending" class="mini-tag pending">中文名待补</span>
        </div>

        <button
          class="fav-btn labelled detail-fav"
          :class="{ active: isCodexFavorite(module.key, item.id) }"
          type="button"
          :aria-pressed="isCodexFavorite(module.key, item.id)"
          @click="toggleCodexFavorite(module.key, item.id)"
        >
          <el-icon :size="15">
            <StarFilled v-if="isCodexFavorite(module.key, item.id)" />
            <Star v-else />
          </el-icon>
          <span>{{ isCodexFavorite(module.key, item.id) ? '已收藏' : '收藏' }}</span>
        </button>
      </div>

      <div v-if="item.metrics.length" class="hero-facts">
        <div v-for="metric in item.metrics" :key="metric.label" class="fact">
          <span class="fact-label">{{ metric.label }}</span>
          <span class="fact-value">{{ metric.value }}</span>
        </div>
      </div>
    </header>

    <div class="detail-body">
      <div class="detail-main">
        <section class="panel">
          <h2 class="panel-title">招式与机制</h2>
          <ul class="move-list">
            <li v-for="move in item.moves" :key="move.label" class="move-item">
              <span class="move-label">{{ move.label }}</span>
              <p class="move-text">{{ move.text }}</p>
            </li>
          </ul>
        </section>

        <section v-if="item.forge" class="panel">
          <h2 class="panel-title">铸魂</h2>
          <p class="paragraph">{{ item.forge }}</p>
        </section>

        <section v-if="item.useHint" class="panel">
          <h2 class="panel-title">探索用途</h2>
          <p class="paragraph">{{ item.useHint }}</p>
        </section>

        <section class="panel">
          <h2 class="panel-title">获取方式</h2>
          <div class="location-box">
            <el-icon :size="16" color="#d8574a"><Location /></el-icon>
            <p>{{ item.location }}</p>
          </div>
        </section>

        <section class="panel">
          <h2 class="panel-title">数据出处</h2>
          <p class="paragraph muted">
            数值与机制整理自 Fextralife 英文 wiki，面板数值对应的等级已标注在数值旁；中文名来自 3DM 攻略目录。
          </p>
          <p class="paragraph">
            <a class="source-link" :href="item.source" target="_blank" rel="noopener noreferrer">{{ item.source }}</a>
          </p>
        </section>

        <section v-if="siblings.length" class="panel">
          <h2 class="panel-title">同类{{ module.itemLabel }}</h2>
          <div class="sibling-grid">
            <RouterLink
              v-for="sibling in siblings"
              :key="sibling.id"
              :to="itemHref(module, sibling)"
              class="sibling-card"
            >
              <span class="sibling-name">{{ sibling.name }}</span>
              <span class="sibling-effect">{{ sibling.effect }}</span>
            </RouterLink>
          </div>
        </section>
      </div>

      <aside>
        <section class="panel sticky">
          <h2 class="panel-title small">{{ item.category }}{{ module.itemLabel }}</h2>
          <p class="category-desc">{{ module.notes[item.category] }}</p>

          <div class="pager">
            <button class="pager-btn" :disabled="!prevItem" @click="goTo(prevItem)">
              <el-icon><ArrowLeft /></el-icon>
              上一条
            </button>
            <button class="pager-btn" :disabled="!nextItem" @click="goTo(nextItem)">
              下一条
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
          <p class="pager-hint">
            {{ prevItem ? prevItem.name : '已经是第一条' }} ·
            {{ nextItem ? nextItem.name : '已经是最后一条' }}
          </p>

          <RouterLink :to="module.path" class="back-link">
            <el-icon :size="12"><Back /></el-icon>
            返回{{ module.title }}
          </RouterLink>
        </section>
      </aside>
    </div>
  </div>

  <el-empty v-else description="没有找到这个条目，可能是链接已失效">
    <el-button type="primary" plain @click="$router.push(module.path)">返回{{ module.title }}</el-button>
  </el-empty>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Location, ArrowLeft, ArrowRight, Back, Star, StarFilled } from '@element-plus/icons-vue'
import { getPbzModule } from '../../data/pbz/codex'
import { usePbzFavorites } from '../../composables/usePbzFavorites'
import { itemHref, neighborsOf } from '../../utils/codex'
import './pbz.css'

const props = defineProps({
  moduleKey: { type: String, required: true },
})

const route = useRoute()
const router = useRouter()
const module = computed(() => getPbzModule(props.moduleKey))

const { isCodexFavorite, toggleCodexFavorite } = usePbzFavorites()

const item = computed(() => module.value.items.find((entry) => entry.id === route.params.id))

const neighbors = computed(() => neighborsOf(module.value.items, route.params.id))
const prevItem = computed(() => neighbors.value.prev)
const nextItem = computed(() => neighbors.value.next)
const siblings = computed(() => neighbors.value.siblings)

function goTo(target) {
  if (!target) return
  router.push(itemHref(module.value, target))
}
</script>
