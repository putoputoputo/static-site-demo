<template>
  <div class="pbz">
    <header class="page-hero">
      <div class="hero-text">
        <div class="hero-eyebrow">结局 · 难度 · 机制</div>
        <h1 class="hero-title">结局与难度</h1>
        <p class="hero-sub">
          四个结局各自的触发条件、四档难度的规则，以及读懂战斗所需的几个核心机制。结局涉及剧情，介意剧透的话请先通关。
        </p>
      </div>
      <div class="hero-badges">
        <div class="hero-badge">
          <span class="badge-value">{{ endings.length }}</span>
          <span class="badge-label">结局</span>
        </div>
        <div class="hero-badge">
          <span class="badge-value">{{ difficulties.length }}</span>
          <span class="badge-label">难度</span>
        </div>
      </div>
    </header>

    <section class="panel">
      <h2 class="panel-title">结局</h2>
      <div class="stack">
        <article v-for="ending in endings" :key="ending.id" class="entry">
          <div class="entry-head">
            <h3 class="entry-name">{{ ending.name }}</h3>
            <span v-if="ending.zhPending" class="mini-tag pending">中文名待补</span>
          </div>
          <p class="entry-line"><em>条件</em>{{ ending.condition }}</p>
          <p class="entry-line"><em>内容</em>{{ ending.summary }}</p>
        </article>
      </div>
      <p class="paragraph muted" style="margin-top: 14px">
        结局条件整理自
        <a class="source-link" :href="endings[0].source" target="_blank" rel="noopener noreferrer">Fextralife 英文 wiki · 结局</a>
        与英文维基百科条目；具体需要完成哪些任务，wiki 尚未逐条列出。
      </p>
    </section>

    <section class="panel">
      <h2 class="panel-title">难度</h2>
      <div class="stack">
        <article v-for="item in difficulties" :key="item.id" class="entry">
          <div class="entry-head">
            <h3 class="entry-name">{{ item.name }}</h3>
            <span class="mini-tag">{{ item.tier }}</span>
          </div>
          <p class="entry-line">{{ item.text }}</p>
        </article>
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">核心机制</h2>
      <div class="stack">
        <article v-for="item in mechanics" :key="item.name" class="entry">
          <div class="entry-head">
            <h3 class="entry-name">{{ item.name }}</h3>
          </div>
          <p class="entry-line">{{ item.text }}</p>
          <p class="entry-line">
            <a class="source-link" :href="item.source" target="_blank" rel="noopener noreferrer">出处</a>
          </p>
        </article>
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">章节与区域</h2>
      <p class="paragraph muted">
        章节名来自 3DM《全结局通关流程攻略》的目录，只列出目录里标了名字的章节；中间几章该目录没有逐一标名，这里不补。
      </p>
      <div class="stack" style="margin-top: 12px">
        <article v-for="chapter in chapters" :key="chapter.name" class="entry">
          <div class="entry-head">
            <h3 class="entry-name">{{ chapter.name }}</h3>
            <span class="mini-tag">{{ chapter.region }}</span>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { endings, difficulties, mechanics, chapters } from '../../data/pbz/endings'
import './pbz.css'
</script>
