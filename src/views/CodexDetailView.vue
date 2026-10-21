<template>
  <div v-if="item" class="codex-detail">
    <el-breadcrumb class="breadcrumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: module.path }">{{ module.title }}</el-breadcrumb-item>
      <el-breadcrumb-item>{{ item.name }}</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 头部 -->
    <header class="detail-hero">
      <div class="hero-main">
        <div class="hero-eyebrow">
          {{ module.eyebrow }}
          <span class="dot">·</span>
          {{ item.category }}
        </div>
        <div class="title-row">
          <h1 class="detail-title">
            {{ item.name }}
            <span v-if="item.dlc" class="dlc-tag">(DLC)</span>
          </h1>
          <span
            class="tier-badge"
            :style="{ color: tierColor(item.tier), borderColor: tierColor(item.tier) }"
          >
            {{ item.tier }} · {{ tierLabel(item.tier) }}
          </span>
          <button
            class="fav-btn"
            :class="{ active: isFavorite(module.key, item.id) }"
            :title="isFavorite(module.key, item.id) ? '取消收藏' : '加入收藏'"
            @click="toggleFavorite(module.key, item.id)"
          >
            <el-icon :size="16">
              <StarFilled v-if="isFavorite(module.key, item.id)" />
              <Star v-else />
            </el-icon>
            <span class="fav-text">{{ isFavorite(module.key, item.id) ? '已收藏' : '收藏' }}</span>
          </button>
        </div>

        <p class="detail-effect">{{ item.effect }}</p>

        <div class="hero-tags">
          <span class="tag category">{{ item.category }}</span>
          <span v-if="item.role" class="tag role">{{ item.role }}</span>
          <span v-if="item.req" class="tag req">需求 {{ item.req }}</span>
        </div>
      </div>

      <div class="hero-facts">
        <div v-for="metric in item.metrics" :key="metric.label" class="fact">
          <span class="fact-label">{{ metric.label }}</span>
          <span class="fact-value">{{ metric.value }}</span>
        </div>
      </div>
    </header>

    <div class="detail-body">
      <div class="detail-main">
        <section class="panel">
          <h2 class="panel-title">效果说明</h2>
          <p class="paragraph">{{ item.effect }}</p>
          <p v-if="item.slots" class="paragraph muted">
            占用 {{ item.slots }} 个记忆空格，施放消耗 {{ item.fp }} 点专注值。
          </p>
          <p v-if="item.hp" class="paragraph muted">
            召唤消耗 {{ item.hp }} 点生命值，不消耗专注值。
          </p>
        </section>

        <section class="panel">
          <h2 class="panel-title">获取方式</h2>
          <div class="location-box">
            <el-icon :size="16" color="#d4af37"><Location /></el-icon>
            <p>{{ item.location }}</p>
          </div>
        </section>

        <section v-if="advice" class="panel">
          <h2 class="panel-title">使用建议</h2>
          <p class="paragraph">{{ advice }}</p>
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
              <div class="sibling-head">
                <span class="sibling-name">{{ sibling.name }}</span>
                <span class="sibling-tier" :style="{ color: tierColor(sibling.tier) }">{{ sibling.tier }}</span>
              </div>
              <span class="sibling-effect">{{ sibling.effect }}</span>
            </RouterLink>
          </div>
        </section>
      </div>

      <aside class="detail-aside">
        <section class="panel sticky">
          <h2 class="panel-title small">{{ module.categoryLabel }}思路</h2>
          <p class="category-desc">{{ categoryDesc }}</p>

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
import { getCodexModule } from '../data/codex'
import { itemHref, neighborsOf, tierColor, tierLabel } from '../utils/codex'
import { useCodexFavorites } from '../composables/useCodexFavorites'

const props = defineProps({
  moduleKey: { type: String, required: true },
})

const route = useRoute()
const router = useRouter()
const module = computed(() => getCodexModule(props.moduleKey))
const { isFavorite, toggleFavorite } = useCodexFavorites()

const item = computed(() => module.value.items.find((entry) => entry.id === route.params.id))

const neighbors = computed(() => neighborsOf(module.value.items, route.params.id))

const prevItem = computed(() => neighbors.value.prev)
const nextItem = computed(() => neighbors.value.next)
const siblings = computed(() => neighbors.value.siblings)

const categoryDesc = computed(() => {
  const category = module.value.categories.find((entry) => entry.id === item.value?.category)
  return category?.desc || module.value.intro
})

const advice = computed(() => {
  if (!item.value) return ''
  return item.value.advice || module.value.notes[item.value.category] || ''
})

function goTo(target) {
  if (!target) return
  router.push(itemHref(module.value, target))
}
</script>

<style scoped>
.fav-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  font-size: 12px;
  font-family: inherit;
  color: #8a8574;
  background: #1f1f1f;
  border: 1px solid #383225;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.18s, border-color 0.18s, background 0.18s;
}

.fav-btn:hover {
  color: #d4af37;
  border-color: #6b5c2e;
}

.fav-btn.active {
  color: #d4af37;
  background: #2a2413;
  border-color: #4a3f1e;
}

.codex-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.breadcrumb {
  font-size: 13px;
}

/* 头部 */
.detail-hero {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 28px;
  padding: 26px 28px;
  border: 1px solid #3a3324;
  border-radius: 12px;
  background: linear-gradient(120deg, rgba(212, 175, 55, 0.13), transparent 62%), #1a1a1a;
}

.hero-main {
  flex: 1;
  min-width: 0;
}

.hero-eyebrow {
  margin-bottom: 8px;
  font-size: 11.5px;
  letter-spacing: 2px;
  color: #8a8574;
}

.dot {
  margin: 0 4px;
  opacity: 0.6;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.detail-title {
  margin: 0;
  font-size: 27px;
  letter-spacing: 2px;
  color: #d4af37;
}

.dlc-tag {
  font-size: 12px;
  font-weight: 400;
  color: #c98b3f;
}

.tier-badge {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.02);
}

.detail-effect {
  margin: 0 0 14px;
  max-width: 640px;
  font-size: 13.5px;
  line-height: 1.85;
  color: #a8a292;
}

.hero-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  font-size: 12px;
  border-radius: 4px;
}

.tag.category {
  color: #d4af37;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.32);
}

.tag.role {
  color: #9aa7b8;
  background: rgba(154, 167, 184, 0.1);
  border: 1px solid rgba(154, 167, 184, 0.28);
}

.tag.req {
  color: #8fa88a;
  background: rgba(143, 168, 138, 0.1);
  border: 1px solid rgba(143, 168, 138, 0.28);
}

.hero-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(110px, 1fr));
  gap: 10px;
  flex-shrink: 0;
  align-content: center;
  max-width: 320px;
}

.fact {
  padding: 10px 14px;
  border: 1px solid #332d20;
  border-radius: 8px;
  background: #151515;
}

.fact-label {
  display: block;
  font-size: 11px;
  color: #7a7565;
}

.fact-value {
  display: block;
  margin-top: 3px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: #e5e3d8;
  overflow-wrap: anywhere;
}

/* 布局 */
.detail-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 262px;
  gap: 16px;
  align-items: start;
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.panel {
  padding: 20px 22px;
  border: 1px solid #302b1f;
  border-radius: 10px;
  background: #1a1a1a;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #d4af37;
}

.panel-title::before {
  content: '';
  width: 3px;
  height: 15px;
  border-radius: 2px;
  background: #d4af37;
}

.panel-title.small {
  font-size: 14px;
}

.paragraph {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.9;
  color: #b8b2a0;
}

.paragraph + .paragraph {
  margin-top: 10px;
}

.paragraph.muted {
  font-size: 12.5px;
  color: #7a7565;
}

.location-box {
  display: flex;
  gap: 10px;
  padding: 14px 16px;
  border-left: 3px solid rgba(212, 175, 55, 0.6);
  border-radius: 0 8px 8px 0;
  background: #161616;
}

.location-box p {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: #b8b2a0;
}

/* 同类 */
.sibling-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.sibling-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 11px 13px;
  border: 1px solid #2a2519;
  border-radius: 8px;
  background: #161616;
  text-decoration: none;
  transition: all 0.18s;
}

.sibling-card:hover {
  border-color: #5a4c28;
  background: rgba(212, 175, 55, 0.06);
}

.sibling-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sibling-name {
  font-size: 13px;
  font-weight: 600;
  color: #d8d3c4;
}

.sibling-tier {
  font-size: 11px;
  font-weight: 700;
}

.sibling-effect {
  font-size: 11.5px;
  line-height: 1.6;
  color: #7a7565;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 侧栏 */
.sticky {
  position: sticky;
  top: 82px;
}

.category-desc {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.85;
  color: #9d977f;
}

.pager {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed #332d20;
}

.pager-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 7px 8px;
  font-size: 12px;
  color: #b8b2a0;
  background: #222;
  border: 1px solid #383225;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.18s;
}

.pager-btn:hover:not(:disabled) {
  color: #d4af37;
  border-color: #6b5c2e;
}

.pager-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pager-hint {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: #6b6555;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 16px;
  font-size: 12px;
  color: #8a8574;
  text-decoration: none;
}

.back-link:hover {
  color: #d4af37;
}

@media (max-width: 1000px) {
  .detail-body {
    grid-template-columns: 1fr;
  }
  .detail-hero {
    flex-direction: column;
  }
  .hero-facts {
    max-width: none;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .sticky {
    position: static;
  }
}

@media (max-width: 680px) {
  .hero-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .sibling-grid {
    grid-template-columns: 1fr;
  }
}
</style>
