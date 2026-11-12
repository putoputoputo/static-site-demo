<template>
  <div class="pbz">
    <header class="page-hero">
      <div class="hero-text">
        <div class="hero-eyebrow">主线流程</div>
        <h1 class="hero-title">主线流程</h1>
        <p class="hero-sub">
          从序章到断魂山的章节顺序：每章要做的事、沿途的铃铛与门槛、这一章会遇到的 BOSS。
          前三章按攻略页面写成了逐步流程，后面几章的攻略页面还没有写，只列出该章的 BOSS 顺序与已知门槛。
        </p>
      </div>
      <div class="hero-badges">
        <div class="hero-badge">
          <span class="badge-value">{{ stats.chapters }}</span>
          <span class="badge-label">章节</span>
        </div>
        <div class="hero-badge">
          <span class="badge-value">{{ stats.steps }}</span>
          <span class="badge-label">已写步骤</span>
        </div>
        <div class="hero-badge">
          <span class="badge-value">{{ stats.pending }}</span>
          <span class="badge-label">步骤待补</span>
        </div>
      </div>
    </header>

    <section class="panel">
      <h2 class="panel-title">章节顺序</h2>
      <p class="paragraph muted walkthrough-note">
        章节顺序与逐步流程来自英文 wiki 的流程页；中文章名以攻略目录为准，目录里没有标名的第五到第七章暂用区域名代替。
        悲泣溪谷在 wiki 里被拆成两章，攻略目录都算在「第一章 · 逆流直上」里，这里保留两段、第二段标「续」。
      </p>

      <div class="chapter-list">
        <RouterLink
          v-for="chapter in chapters"
          :key="chapter.id"
          :to="chapterHref(chapter)"
          class="entry chapter-card"
        >
          <div class="chapter-order">{{ chapter.order === 0 ? '序' : chapter.order }}</div>
          <div class="chapter-main">
            <div class="entry-head">
              <h3 class="entry-name">{{ chapterLabel(chapter) }}</h3>
              <span class="mini-tag">{{ chapter.region }}</span>
              <span v-if="chapter.chapterPending" class="mini-tag pending">章名待补</span>
              <span v-else-if="chapter.pending" class="mini-tag pending">步骤待补</span>
              <span v-else class="mini-tag">{{ chapter.steps.length }} 步</span>
            </div>
            <p class="entry-line"><em>目标</em>{{ chapter.goal }}</p>
            <p class="chapter-bosses">
              <em>BOSS</em>
              <span>{{ bossNames(chapter).join('、') }}</span>
            </p>
          </div>
        </RouterLink>
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">看流程前先知道这几件事</h2>
      <ul class="note-list">
        <li>铃铛是这一作的存档兼地图点，敲一口点亮一片。主线推进几乎都靠铃铛串起来，见到就敲。</li>
        <li>影之武装不只是副武器：巨凶斧劈锁链、追命锁镰跨断桥与攀爬、羽弓击落悬挂物，缺一件就有一整段路走不了。</li>
        <li>红光攻击只能闪避，蓝光攻击可以招架并触发鬼步。这两条从头用到尾，序章的教学别跳过。</li>
        <li>部分区域的 BOSS 是支线或隐藏的，主线流程里会标出「可选」，可以留到后期回头再打。</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { pbzOrderedChapters, pbzWalkthroughStats } from '../../data/pbz/walkthrough'
import { chapterBosses, chapterHref, chapterLabel } from '../../utils/pbzWalkthrough'
import './pbz.css'

const chapters = pbzOrderedChapters
const stats = pbzWalkthroughStats

function bossNames(chapter) {
  return chapterBosses(chapter).map((boss) => boss.name)
}
</script>
