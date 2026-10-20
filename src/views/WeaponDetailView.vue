<template>
  <div v-if="weapon" class="weapon-detail">
    <el-breadcrumb class="breadcrumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/weapons' }">武器图鉴</el-breadcrumb-item>
      <el-breadcrumb-item>{{ weapon.name }}</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 头部 -->
    <header class="detail-hero">
      <div class="hero-main">
        <div class="title-row">
          <h1 class="detail-title">
            {{ weapon.name }}
            <span v-if="weapon.dlc" class="dlc-tag">(DLC)</span>
          </h1>
          <button
            class="fav-btn"
            :class="{ active: isFavorite(weapon.id) }"
            @click="toggleFavorite(weapon.id)"
          >
            <el-icon :size="14">
              <StarFilled v-if="isFavorite(weapon.id)" />
              <Star v-else />
            </el-icon>
            <span>{{ isFavorite(weapon.id) ? '已收藏' : '收藏' }}</span>
          </button>
        </div>
        <div class="hero-tags">
          <span class="tag type">{{ weapon.type }}</span>
          <span class="tag region">
            <el-icon :size="12"><Location /></el-icon>
            {{ weapon.region }}
          </span>
          <span class="tag attack">攻击类型：{{ attackTypeOf(weapon) }}</span>
          <span
            v-for="status in weapon.status"
            :key="status"
            class="tag status"
            :style="{ color: statusColor(status), borderColor: statusColor(status) }"
          >
            {{ status }}
          </span>
          <span class="tag attrs">
            主加 {{ topAttributes(weapon.scaling).map((item) => item.label).join(' / ') || '无' }}
          </span>
        </div>
        <p class="detail-desc">{{ weapon.description }}</p>
      </div>

      <div class="hero-facts">
        <div class="fact">
          <span class="fact-label">物理攻击</span>
          <span class="fact-value">{{ weapon.stats.physical }}</span>
        </div>
        <div class="fact">
          <span class="fact-label">属性攻击</span>
          <span class="fact-value" :style="{ color: extraDamages(weapon.stats)[0]?.color || '#5d5849' }">
            {{ extraDamages(weapon.stats).length ? extraDamages(weapon.stats).map((d) => d.value).join(' + ') : '—' }}
          </span>
        </div>
        <div class="fact">
          <span class="fact-label">致命一击</span>
          <span class="fact-value">{{ weapon.stats.critical }}</span>
        </div>
        <div class="fact">
          <span class="fact-label">重量</span>
          <span class="fact-value">{{ weapon.stats.weight }}</span>
        </div>
      </div>
    </header>

    <div class="detail-body">
      <div class="detail-main">
        <!-- 攻击力 -->
        <section class="panel">
          <h2 class="panel-title">攻击力面板</h2>
          <div class="damage-list">
            <div v-for="item in damageList(weapon.stats)" :key="item.key" class="damage-row">
              <span class="damage-label">{{ item.label }}</span>
              <div class="damage-bar">
                <div
                  class="damage-bar-inner"
                  :style="{ width: barWidth(item.value), background: item.color }"
                />
              </div>
              <span class="damage-value" :style="{ color: item.value ? item.color : '#5d5849' }">
                {{ item.value }}
              </span>
            </div>
          </div>
          <div class="damage-total">
            <span>面板合计伤害</span>
            <strong>{{ totalDamage(weapon.stats) }}</strong>
          </div>
        </section>

        <!-- 补正与需求 -->
        <section class="panel">
          <h2 class="panel-title">能力补正与需求</h2>
          <div class="scaling-grid">
            <div v-for="attr in ATTR_KEYS" :key="attr" class="scaling-item">
              <div class="scaling-head">
                <span class="scaling-attr">{{ ATTR_LABELS[attr] }}</span>
                <span
                  class="scaling-letter"
                  :style="{ color: scalingColor(weapon.scaling[attr]), borderColor: scalingColor(weapon.scaling[attr]) }"
                >
                  {{ weapon.scaling[attr] === '-' ? '无' : weapon.scaling[attr] }}
                </span>
              </div>
              <div class="scaling-bar">
                <div
                  class="scaling-bar-inner"
                  :style="{
                    width: `${(scalingScore(weapon.scaling[attr]) / SCALING_MAX) * 100}%`,
                    background: scalingColor(weapon.scaling[attr]),
                  }"
                />
              </div>
              <span class="scaling-req">
                {{ weapon.requirements[attr] > 0 ? `需求 ${weapon.requirements[attr]}` : '无需求' }}
              </span>
            </div>
          </div>
        </section>

        <!-- 战技 -->
        <section class="panel">
          <h2 class="panel-title">战技</h2>
          <div v-if="weapon.skill" class="skill-box">
            <div class="skill-head">
              <el-icon :size="16" color="#d4af37"><MagicStick /></el-icon>
              <span class="skill-name">{{ weapon.skill.name }}</span>
            </div>
            <p class="skill-desc">{{ weapon.skill.description }}</p>
          </div>
          <p v-else class="muted">该武器没有固有战技，可自行搭配战灰（若该类型支持）。</p>
        </section>

        <!-- 玩法要点 -->
        <section class="panel">
          <h2 class="panel-title">玩法要点</h2>
          <ul class="tips">
            <li v-for="(tip, index) in weapon.gameplay" :key="index">
              <span class="tip-index">{{ index + 1 }}</span>
              <span>{{ tip }}</span>
            </li>
          </ul>
        </section>

        <!-- 推荐配装 -->
        <section class="panel">
          <h2 class="panel-title">推荐配装</h2>

          <h3 class="sub-title">建议加点</h3>
          <div class="build-stats">
            <div v-for="item in buildStatList(weapon.build.stats)" :key="item.key" class="build-stat">
              <span class="build-label">{{ item.label }}</span>
              <span class="build-value">{{ item.value }}</span>
            </div>
          </div>

          <template v-for="group in buildGroups" :key="group.key">
            <template v-if="group.items.length">
              <h3 class="sub-title">{{ group.label }}</h3>
              <div class="tag-list">
                <span v-for="name in group.items" :key="name" class="item-tag">{{ name }}</span>
              </div>
            </template>
          </template>
        </section>

        <!-- 获取方式 -->
        <section class="panel">
          <h2 class="panel-title">获取方式</h2>
          <div class="location-box">
            <el-icon :size="16" color="#d4af37"><Location /></el-icon>
            <p>{{ weapon.location }}</p>
          </div>
        </section>
      </div>

      <!-- 侧栏 -->
      <aside class="detail-aside">
        <section class="panel sticky">
          <h2 class="panel-title small">同类型武器</h2>
          <div class="sibling-list">
            <RouterLink
              v-for="item in siblings"
              :key="item.id"
              :to="`/weapons/${item.id}`"
              class="sibling-item"
            >
              <span class="sibling-name">{{ item.name }}</span>
              <span class="sibling-stat">物理 {{ item.stats.physical }}</span>
            </RouterLink>
            <p v-if="!siblings.length" class="muted">暂无同类型武器</p>
          </div>

          <div class="pager">
            <button class="pager-btn" :disabled="!prevWeapon" @click="goTo(prevWeapon)">
              <el-icon><ArrowLeft /></el-icon>
              上一件
            </button>
            <button class="pager-btn" :disabled="!nextWeapon" @click="goTo(nextWeapon)">
              下一件
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
          <p class="pager-hint">
            {{ prevWeapon ? prevWeapon.name : '已经是第一件' }} ·
            {{ nextWeapon ? nextWeapon.name : '已经是最后一件' }}
          </p>
        </section>
      </aside>
    </div>
  </div>

  <el-empty v-else description="没有找到这件武器，可能是链接已失效">
    <el-button type="primary" plain @click="$router.push('/weapons')">返回武器图鉴</el-button>
  </el-empty>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Star, StarFilled } from '@element-plus/icons-vue'
import weapons from '../data/weapons'
import { useWeaponFavorites } from '../composables/useWeaponFavorites'
import {
  ATTR_KEYS,
  ATTR_LABELS,
  attackTypeOf,
  buildStatList,
  damageList,
  extraDamages,
  scalingColor,
  scalingScore,
  SCALING_MAX,
  statusColor,
  topAttributes,
  totalDamage,
} from '../utils/weapon'

const route = useRoute()
const router = useRouter()
const { isFavorite, toggleFavorite } = useWeaponFavorites()

const weapon = computed(() => weapons.find((item) => item.id === route.params.id))

const currentIndex = computed(() => weapons.findIndex((item) => item.id === route.params.id))

const prevWeapon = computed(() =>
  currentIndex.value > 0 ? weapons[currentIndex.value - 1] : null
)

const nextWeapon = computed(() =>
  currentIndex.value > -1 && currentIndex.value < weapons.length - 1
    ? weapons[currentIndex.value + 1]
    : null
)

const siblings = computed(() => {
  if (!weapon.value) return []
  return weapons.filter((item) => item.type === weapon.value.type && item.id !== weapon.value.id)
})

const buildGroups = computed(() => {
  if (!weapon.value) return []
  const { talismans = [], weapons: gear = [], sorceries = [], incantations = [] } = weapon.value.build
  return [
    { key: 'talismans', label: '护符', items: talismans },
    { key: 'gear', label: '武器搭配', items: gear },
    { key: 'sorceries', label: '魔法', items: sorceries },
    { key: 'incantations', label: '祷告', items: incantations },
  ]
})

// 面板条按 200 归一，超过 200 取满格
function barWidth(value) {
  return `${Math.min(100, (value / 200) * 100)}%`
}

function goTo(target) {
  if (!target) return
  router.push(`/weapons/${target.id}`)
}
</script>

<style scoped>
.weapon-detail {
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

.title-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.detail-title {
  margin: 0;
  font-size: 27px;
  letter-spacing: 2px;
  color: #d4af37;
}

.fav-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  font-size: 12px;
  color: #b8b2a0;
  background: #222;
  border: 1px solid #383225;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.18s;
}

.fav-btn:hover {
  color: #d4af37;
  border-color: #6b5c2e;
}

.fav-btn.active {
  color: #121212;
  background: #d4af37;
  border-color: #d4af37;
}

.hero-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  font-size: 12px;
  border-radius: 4px;
}

.tag.type {
  color: #d4af37;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.32);
}

.tag.region {
  color: #b8b2a0;
  background: #242424;
  border: 1px solid #383225;
}

.tag.attrs {
  color: #8fa88a;
  background: rgba(143, 168, 138, 0.1);
  border: 1px solid rgba(143, 168, 138, 0.28);
}

.tag.attack {
  color: #9aa7b8;
  background: rgba(154, 167, 184, 0.1);
  border: 1px solid rgba(154, 167, 184, 0.28);
}

.tag.status {
  background: transparent;
  border: 1px solid;
}

.detail-desc {
  margin: 0;
  max-width: 620px;
  font-size: 13.5px;
  line-height: 1.85;
  color: #a8a292;
}

.hero-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(96px, 1fr));
  gap: 10px;
  flex-shrink: 0;
  align-content: center;
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
  font-size: 17px;
  font-weight: 600;
  color: #e5e3d8;
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

.sub-title {
  margin: 18px 0 10px;
  font-size: 13px;
  font-weight: 500;
  color: #8a8574;
}

.sub-title:first-of-type {
  margin-top: 0;
}

/* 攻击力 */
.damage-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.damage-row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 52px;
  align-items: center;
  gap: 12px;
}

.damage-label {
  font-size: 12.5px;
  color: #8a8574;
}

.damage-bar {
  height: 8px;
  border-radius: 4px;
  background: #262626;
  overflow: hidden;
}

.damage-bar-inner {
  height: 100%;
  border-radius: 4px;
  opacity: 0.85;
  transition: width 0.4s ease;
}

.damage-value {
  text-align: right;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.damage-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 13px;
  border-top: 1px dashed #332d20;
  font-size: 13px;
  color: #8a8574;
}

.damage-total strong {
  font-size: 20px;
  color: #d4af37;
}

/* 补正 */
.scaling-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.scaling-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border: 1px solid #2a2519;
  border-radius: 8px;
  background: #161616;
}

.scaling-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.scaling-attr {
  font-size: 12.5px;
  color: #b8b2a0;
}

.scaling-letter {
  padding: 0 5px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid;
  border-radius: 3px;
}

.scaling-bar {
  height: 4px;
  border-radius: 2px;
  background: #262626;
  overflow: hidden;
}

.scaling-bar-inner {
  height: 100%;
  border-radius: 2px;
  opacity: 0.75;
}

.scaling-req {
  font-size: 11px;
  color: #7a7565;
}

/* 战技 */
.skill-box {
  padding: 16px;
  border: 1px solid rgba(212, 175, 55, 0.22);
  border-radius: 8px;
  background: rgba(212, 175, 55, 0.05);
}

.skill-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.skill-name {
  font-size: 15px;
  font-weight: 600;
  color: #e0bf68;
}

.skill-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: #a8a292;
}

/* 玩法要点 */
.tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tips li {
  display: flex;
  gap: 10px;
  font-size: 13px;
  line-height: 1.8;
  color: #a8a292;
}

.tip-index {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #d4af37;
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 50%;
}

/* 配装 */
.build-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.build-stat {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #2a2519;
  border-radius: 6px;
  background: #161616;
  font-size: 12.5px;
}

.build-label {
  color: #8a8574;
}

.build-value {
  font-weight: 600;
  color: #e5e3d8;
  font-variant-numeric: tabular-nums;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.item-tag {
  padding: 4px 10px;
  font-size: 12px;
  color: #c9c4b4;
  background: #232323;
  border: 1px solid #383225;
  border-radius: 4px;
}

/* 获取方式 */
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

/* 侧栏 */
.sticky {
  position: sticky;
  top: 82px;
}

.sibling-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sibling-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid transparent;
  text-decoration: none;
  transition: all 0.18s;
}

.sibling-item:hover {
  border-color: #4a4228;
  background: rgba(212, 175, 55, 0.07);
}

.sibling-name {
  font-size: 12.5px;
  color: #c9c4b4;
}

.sibling-stat {
  font-size: 11px;
  color: #7a7565;
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

.muted {
  margin: 0;
  font-size: 12.5px;
  color: #7a7565;
}

@media (max-width: 1000px) {
  .detail-body {
    grid-template-columns: 1fr;
  }
  .detail-hero {
    flex-direction: column;
  }
  .sticky {
    position: static;
  }
  .scaling-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 680px) {
  .scaling-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .build-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .hero-facts {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
