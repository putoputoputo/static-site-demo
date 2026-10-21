<template>
  <div v-if="boss" class="detail-page">
    <el-breadcrumb class="crumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/bosses' }">BOSS 攻略</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/bosses', query: { region: boss.regionId } }">
        {{ boss.regionName }}
      </el-breadcrumb-item>
      <el-breadcrumb-item>{{ boss.name }}</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 头部 -->
    <header class="detail-hero" :class="{ dlc: boss.dlc }">
      <div class="hero-main">
        <div class="badge-row">
          <span class="tag origin" :class="boss.dlc ? 'dlc' : 'base'">{{ boss.dlc ? '黄金树幽影' : '本体' }}</span>
          <span v-if="boss.required" class="tag required">主线必打</span>
          <span v-if="boss.remembrance" class="tag remembrance">掉落追忆</span>
          <span class="tag type">{{ boss.type }}</span>
        </div>
        <h1 class="boss-title">{{ boss.name }}</h1>
        <p class="boss-place">
          <el-icon :size="13"><Location /></el-icon>
          <RouterLink :to="{ path: '/main-quest/regions', hash: `#${boss.regionId}` }">
            {{ boss.regionName }}
          </RouterLink>
          <template v-if="boss.place">· {{ boss.place }}</template>
        </p>
        <p v-if="boss.note" class="boss-note">{{ boss.note }}</p>

        <div class="danger-line">
          <span class="danger-label">危险度</span>
          <span class="danger-pips">
            <i
              v-for="n in 5"
              :key="n"
              class="pip"
              :style="n <= boss.danger ? { background: dangerColor(boss.danger) } : null"
            ></i>
          </span>
          <span class="danger-text" :style="{ color: dangerColor(boss.danger) }">
            {{ boss.danger }} / 5 · {{ dangerLabel(boss.danger) }}
          </span>
        </div>
      </div>

      <div class="hero-side">
        <div class="prep-item">
          <span class="prep-label">推荐等级</span>
          <strong class="prep-value">{{ boss.level }}</strong>
        </div>
        <div v-if="boss.upgrade" class="prep-item">
          <span class="prep-label">武器强化</span>
          <strong class="prep-value">{{ boss.upgrade }}</strong>
        </div>
        <div v-if="boss.blessing" class="prep-item">
          <span class="prep-label">幽影树祝福</span>
          <strong class="prep-value">{{ boss.blessing }}</strong>
        </div>
        <div class="prep-item">
          <span class="prep-label">战斗阶段</span>
          <strong class="prep-value">{{ boss.phases }}</strong>
        </div>
      </div>
    </header>

    <!-- 属性克制 -->
    <section class="section">
      <h2 class="section-title">属性克制</h2>
      <div class="matchup-grid">
        <div class="matchup-card weak">
          <h3>弱点 · 打这里</h3>
          <div v-if="boss.weak.length" class="tag-list">
            <span
              v-for="tag in boss.weak"
              :key="tag"
              class="attr-tag"
              :style="{ color: tagColor(tag), borderColor: `${tagColor(tag)}77`, background: `${tagColor(tag)}14` }"
            >
              {{ tag }}
            </span>
          </div>
          <p v-else class="matchup-empty">没有可靠记录的特别弱点。按通用规律处理即可：毛多弱火、重甲弱雷、亡灵弱圣、石像弱打击。</p>
        </div>

        <div class="matchup-card resist">
          <h3>抗性 · 别用这个</h3>
          <div v-if="boss.resist.length" class="tag-list">
            <span v-for="tag in boss.resist" :key="tag" class="attr-tag muted">{{ tag }}</span>
          </div>
          <p v-else class="matchup-empty">没有明显抗性。</p>
        </div>

        <div class="matchup-card immune">
          <h3>免疫 · 完全无效</h3>
          <div v-if="boss.immune.length" class="tag-list">
            <span v-for="tag in boss.immune" :key="tag" class="attr-tag immune">{{ tag }}</span>
          </div>
          <p v-else class="matchup-empty">不免疫任何异常状态。</p>
        </div>
      </div>
    </section>

    <!-- 打法要点 -->
    <section v-if="boss.tips.length" class="section">
      <h2 class="section-title">打法要点</h2>
      <ol class="tip-list">
        <li v-for="(tip, index) in boss.tips" :key="index">
          <span class="tip-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <p>{{ tip }}</p>
        </li>
      </ol>
    </section>

    <!-- 召唤 / 掉落 -->
    <div class="two-col">
      <section v-if="boss.summon.length" class="section">
        <h2 class="section-title">可召唤帮手</h2>
        <ul class="plain-list">
          <li v-for="item in boss.summon" :key="item">{{ item }}</li>
        </ul>
        <p class="section-hint">召唤 NPC 需要先在世界上与他们对话 / 完成前置，否则雾门前不会出现召唤印。</p>
      </section>

      <section v-if="boss.drop.length" class="section">
        <h2 class="section-title">关键掉落</h2>
        <ul class="plain-list">
          <li v-for="item in boss.drop" :key="item">{{ item }}</li>
        </ul>
      </section>
    </div>

    <!-- 追忆兑换 -->
    <section v-if="boss.exchange" class="section exchange-section">
      <h2 class="section-title">追忆兑换 · {{ boss.exchange.remembrance }}</h2>
      <p class="section-hint">
        交给圆桌厅堂的「解指」恩雅，<strong>一份追忆只能换一件</strong>；直接使用可获得
        {{ boss.exchange.runes ? boss.exchange.runes.toLocaleString() : '—' }} 卢恩。
        想要两件的话，可以先去漫步灵庙复制一份追忆。
      </p>
      <div class="exchange-list">
        <div v-for="item in boss.exchange.items" :key="item.name" class="exchange-item">
          <span class="exchange-type" :class="`t-${item.type}`">{{ item.type }}</span>
          <RouterLink v-if="item.to" :to="item.to" class="exchange-name link">{{ item.name }}</RouterLink>
          <span v-else class="exchange-name">{{ item.name }}</span>
          <span v-if="!item.to" class="exchange-hint">站内暂无图鉴</span>
        </div>
      </div>
      <RouterLink to="/main-quest/remembrances" class="inline-link">查看全部 25 个追忆的兑换表 →</RouterLink>
    </section>

    <!-- 关联支线 -->
    <section v-if="questInfo" class="section">
      <h2 class="section-title">关联支线</h2>
      <RouterLink :to="`/side-quests/${boss.quest}`" class="quest-link">
        {{ questInfo.name }}
        <span v-if="questInfo.npc" class="quest-npc">· {{ questInfo.npc }}</span>
        <span class="quest-arrow">→</span>
      </RouterLink>
    </section>

    <!-- 同区域其它 BOSS -->
    <section v-if="siblings.length" class="section">
      <h2 class="section-title">{{ boss.regionName }} 的其它 BOSS</h2>
      <div class="sibling-grid">
        <RouterLink v-for="item in siblings" :key="item.key" :to="bossHref(item)" class="sibling-card">
          <span class="sibling-name">{{ item.name }}</span>
          <span class="sibling-meta">
            <i v-for="n in 5" :key="n" class="mini-pip" :style="n <= item.danger ? { background: dangerColor(item.danger) } : null"></i>
            <span class="sibling-type">{{ item.type }}</span>
          </span>
        </RouterLink>
      </div>
    </section>

    <!-- 上一个 / 下一个 -->
    <nav class="neighbors">
      <RouterLink v-if="neighbors.prev" :to="bossHref(neighbors.prev)" class="neighbor">
        <span class="neighbor-dir">← 上一个</span>
        <span class="neighbor-name">{{ neighbors.prev.name }}</span>
        <span class="neighbor-region">{{ neighbors.prev.regionName }}</span>
      </RouterLink>
      <span v-else class="neighbor empty"></span>
      <RouterLink v-if="neighbors.next" :to="bossHref(neighbors.next)" class="neighbor next">
        <span class="neighbor-dir">下一个 →</span>
        <span class="neighbor-name">{{ neighbors.next.name }}</span>
        <span class="neighbor-region">{{ neighbors.next.regionName }}</span>
      </RouterLink>
      <span v-else class="neighbor empty"></span>
    </nav>
  </div>

  <el-empty v-else description="找不到这个 BOSS，可能是链接里的区域或名称不对">
    <RouterLink to="/bosses">
      <el-button type="primary" plain>返回 BOSS 列表</el-button>
    </RouterLink>
  </el-empty>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Location } from '@element-plus/icons-vue'
import {
  getBoss,
  siblingBosses,
  bossNeighbors,
  bossHref,
  dangerLabel,
  dangerColor,
  tagColor,
} from '../utils/bosses'
import { getQuest } from '../utils/quest'

const route = useRoute()

const boss = computed(() => {
  const regionId = String(route.params.region || '')
  const name = String(route.params.name || '')
  return getBoss(regionId, name)
})

const siblings = computed(() => (boss.value ? siblingBosses(boss.value) : []))

const neighbors = computed(() =>
  boss.value ? bossNeighbors(boss.value) : { prev: null, next: null }
)

const questInfo = computed(() => {
  if (!boss.value?.quest) return null
  const quest = getQuest(boss.value.quest)
  if (!quest) return null
  return { name: quest.name, npc: quest.npc || '' }
})
</script>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.crumb {
  font-size: 13px;
}

.detail-hero {
  display: flex;
  justify-content: space-between;
  gap: 28px;
  padding: 24px 26px;
  border: 1px solid #332d20;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e1c16 0%, #16150f 100%);
}

.detail-hero.dlc {
  background: linear-gradient(135deg, #201c28 0%, #16150f 70%);
  border-color: #3a3048;
}

.hero-main {
  flex: 1;
  min-width: 0;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.tag {
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
  border: 1px solid transparent;
}

.tag.base {
  color: #8a8574;
  background: #232323;
  border-color: #383225;
}

.tag.dlc {
  color: #b49ad4;
  background: #241f2e;
  border-color: #3f3453;
}

.tag.required {
  color: #e08b88;
  background: #2a1c1c;
  border-color: #4a2a2a;
}

.tag.remembrance {
  color: #d4af37;
  background: #2a2413;
  border-color: #4a3f1e;
}

.tag.type {
  color: #9aa88f;
  background: #1f241d;
  border-color: #333a2f;
}

.boss-title {
  margin: 0 0 8px;
  font-size: 27px;
  color: #e5e3d8;
  letter-spacing: 1px;
}

.boss-place {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 13px;
  color: #8a8574;
}

.boss-place a {
  color: #b8b2a0;
  text-decoration: none;
  border-bottom: 1px dashed #4a422f;
}

.boss-place a:hover {
  color: #d4af37;
}

.boss-note {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.75;
  color: #a9a496;
  max-width: 680px;
}

.danger-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  font-size: 12px;
}

.danger-label {
  color: #6b6555;
}

.danger-pips {
  display: flex;
  gap: 4px;
}

.pip {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2f2c22;
}

.danger-text {
  font-size: 12px;
}

.hero-side {
  display: grid;
  grid-template-columns: repeat(2, minmax(110px, 1fr));
  gap: 10px;
  align-content: start;
}

.prep-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  border: 1px solid #3a3324;
  border-radius: 9px;
  background: #1a1915;
}

.prep-label {
  font-size: 11px;
  color: #6b6555;
}

.prep-value {
  font-size: 14px;
  color: #d4af37;
}

.section {
  padding: 20px 22px;
  border: 1px solid #332d20;
  border-radius: 10px;
  background: #1c1c1c;
}

.section-title {
  margin: 0 0 14px;
  font-size: 15px;
  color: #d4af37;
  padding-left: 10px;
  border-left: 3px solid #d4af37;
  line-height: 1.2;
}

.section-hint {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: #6b6555;
}

.section-hint strong {
  color: #d9c47a;
}

.matchup-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.matchup-card {
  padding: 14px 16px;
  border: 1px solid #2f2b20;
  border-radius: 9px;
  background: #191919;
}

.matchup-card.weak {
  border-color: #3d4a34;
}

.matchup-card.resist {
  border-color: #3a3324;
}

.matchup-card.immune {
  border-color: #402f2f;
}

.matchup-card h3 {
  margin: 0 0 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: #b8b2a0;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.attr-tag {
  padding: 3px 10px;
  font-size: 12px;
  border: 1px solid #3a3324;
  border-radius: 5px;
  color: #b8b2a0;
  background: #202020;
}

.attr-tag.muted {
  color: #7d7869;
}

.attr-tag.immune {
  color: #c58a86;
  border-color: #4a2f2f;
  background: #241b1b;
}

.matchup-empty {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #5d5849;
}

.tip-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tip-list li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.tip-index {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: #6b5c2e;
  padding-top: 2px;
  font-variant-numeric: tabular-nums;
}

.tip-list p {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.85;
  color: #c9c4b4;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.plain-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plain-list li {
  font-size: 13px;
  line-height: 1.7;
  color: #c9c4b4;
}

.exchange-section {
  border-color: #3f3520;
  background: linear-gradient(160deg, #201d14 0%, #1c1c1c 60%);
}

.exchange-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exchange-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 1px solid #332d20;
  border-radius: 7px;
  background: #1a1a1a;
}

.exchange-type {
  min-width: 40px;
  padding: 1px 8px;
  font-size: 11px;
  text-align: center;
  color: #9aa88f;
  background: #1f241d;
  border: 1px solid #333a2f;
  border-radius: 4px;
}

.exchange-type.t-武器 {
  color: #c9a86a;
  background: #241f14;
  border-color: #3f3520;
}

.exchange-type.t-魔法 {
  color: #7f9ad4;
  background: #1a1f2a;
  border-color: #2b3548;
}

.exchange-type.t-祷告 {
  color: #c9b98a;
  background: #242115;
  border-color: #3f3a20;
}

.exchange-type.t-护符 {
  color: #b49ad4;
  background: #221d2a;
  border-color: #3a3048;
}

.exchange-name {
  font-size: 13px;
  color: #e5e3d8;
}

.exchange-name.link {
  color: #d9c47a;
  text-decoration: none;
  border-bottom: 1px dashed #6b5c2e;
}

.exchange-name.link:hover {
  color: #d4af37;
  border-bottom-style: solid;
}

.exchange-hint {
  margin-left: auto;
  font-size: 11px;
  color: #5d5849;
}

.inline-link {
  display: inline-block;
  margin-top: 14px;
  font-size: 12.5px;
  color: #8a7a3f;
  text-decoration: none;
}

.inline-link:hover {
  color: #d4af37;
}

.quest-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 13.5px;
  color: #d9c47a;
  text-decoration: none;
  border: 1px solid #3f3520;
  border-radius: 8px;
  background: #1f1d15;
  transition: all 0.18s;
}

.quest-link:hover {
  border-color: #6b5c2e;
  color: #d4af37;
}

.quest-npc {
  font-size: 12px;
  color: #8a8574;
}

.quest-arrow {
  color: #6b5c2e;
}

.sibling-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.sibling-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 11px 13px;
  border: 1px solid #2f2b20;
  border-radius: 8px;
  background: #191919;
  text-decoration: none;
  transition: border-color 0.18s;
}

.sibling-card:hover {
  border-color: #6b5c2e;
}

.sibling-name {
  font-size: 13px;
  color: #c9c4b4;
}

.sibling-meta {
  display: flex;
  align-items: center;
  gap: 3px;
}

.mini-pip {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #2f2c22;
}

.sibling-type {
  margin-left: 6px;
  font-size: 11px;
  color: #6b6555;
}

.neighbors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.neighbor {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 18px;
  border: 1px solid #332d20;
  border-radius: 10px;
  background: #1c1c1c;
  text-decoration: none;
  transition: border-color 0.18s;
}

.neighbor.next {
  text-align: right;
}

.neighbor:hover {
  border-color: #6b5c2e;
}

.neighbor.empty {
  border: none;
  background: transparent;
}

.neighbor-dir {
  font-size: 11px;
  color: #6b6555;
}

.neighbor-name {
  font-size: 14px;
  color: #d9c47a;
}

.neighbor-region {
  font-size: 11px;
  color: #5d5849;
}

@media (max-width: 980px) {
  .detail-hero {
    flex-direction: column;
  }

  .hero-side {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 680px) {
  .boss-title {
    font-size: 22px;
  }

  .sibling-grid {
    grid-template-columns: 1fr 1fr;
  }

  .neighbors {
    grid-template-columns: 1fr;
  }

  .neighbor.next {
    text-align: left;
  }
}
</style>
