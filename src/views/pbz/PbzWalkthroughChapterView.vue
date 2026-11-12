<template>
  <div v-if="chapter" class="pbz">
    <el-breadcrumb class="breadcrumb" separator="/">
      <el-breadcrumb-item :to="{ path: '/pbz' }">影之刃零</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/pbz/walkthrough' }">主线流程</el-breadcrumb-item>
      <el-breadcrumb-item>{{ chapterLabel(chapter) }}</el-breadcrumb-item>
    </el-breadcrumb>

    <header class="detail-hero">
      <div class="hero-main">
        <div class="hero-eyebrow">{{ chapter.chapter }} · {{ chapter.region }}</div>
        <h1 class="detail-title">{{ chapter.title }}</h1>
        <p class="detail-place">{{ chapter.goal }}</p>
        <div class="hero-tags">
          <span class="mini-tag">{{ chapter.region }}</span>
          <span v-if="chapter.chapterPending" class="mini-tag pending">章名待补</span>
          <span v-if="chapter.pending" class="mini-tag pending">步骤待补</span>
          <span v-else class="mini-tag">{{ chapter.steps.length }} 步</span>
          <span class="mini-tag">{{ bosses.length }} 个 BOSS</span>
        </div>
      </div>

      <div class="hero-facts">
        <div class="fact">
          <span class="fact-label">进入条件</span>
          <span class="fact-value">{{ chapter.gate }}</span>
        </div>
        <div class="fact">
          <span class="fact-label">区域</span>
          <span class="fact-value">{{ chapter.region }}</span>
        </div>
      </div>
    </header>

    <div class="detail-body">
      <div class="detail-main">
        <section class="panel">
          <h2 class="panel-title">这一章在做什么</h2>
          <p class="paragraph">{{ chapter.summary }}</p>
        </section>

        <section v-if="!chapter.pending" class="panel">
          <h2 class="panel-title">逐步流程</h2>
          <ol class="step-list">
            <li v-for="(step, index) in chapter.steps" :key="step.title" class="step-item">
              <span class="step-index">{{ index + 1 }}</span>
              <div class="step-body">
                <h3 class="step-title">{{ step.title }}</h3>
                <p class="step-place">{{ step.place }}</p>
                <p class="step-detail">{{ step.detail }}</p>
                <p v-if="step.tip" class="step-tip">{{ step.tip }}</p>
              </div>
            </li>
          </ol>
        </section>

        <section v-else class="panel">
          <h2 class="panel-title">这一章的推进顺序</h2>
          <p class="pending-note">
            攻略页面还没写到这一章，所以这里不写逐步流程，只把该章的 BOSS 按攻略目录的顺序列出来，
            外加已经能确认的门槛。等攻略页面补上，这几章会按前三章的格式展开。
          </p>
          <ol class="step-list compact">
            <li v-for="(boss, index) in bosses" :key="boss.id" class="step-item">
              <span class="step-index">{{ index + 1 }}</span>
              <div class="step-body">
                <h3 class="step-title">
                  <RouterLink :to="bossHref(boss)" class="step-boss-link">{{ boss.name }}</RouterLink>
                </h3>
                <p class="step-place">{{ boss.place }}</p>
                <p v-if="boss.drop" class="step-detail">掉落：{{ boss.drop }}</p>
              </div>
            </li>
          </ol>
        </section>

        <section v-if="bosses.length" class="panel">
          <h2 class="panel-title">该章 BOSS</h2>
          <div class="sibling-grid">
            <RouterLink v-for="boss in bosses" :key="boss.id" :to="bossHref(boss)" class="sibling-card">
              <span class="sibling-name">{{ boss.name }}</span>
              <span class="sibling-effect">{{ boss.place }}</span>
            </RouterLink>
          </div>
        </section>

        <section v-if="chapter.keyItems.length" class="panel">
          <h2 class="panel-title">这一章的关键道具</h2>
          <div class="stack">
            <article v-for="item in chapter.keyItems" :key="item.name" class="entry">
              <div class="entry-head">
                <h3 class="entry-name">{{ item.name }}</h3>
              </div>
              <p class="entry-line">{{ item.note }}</p>
            </article>
          </div>
        </section>

        <section v-if="chapter.missable.length" class="panel">
          <h2 class="panel-title">容易卡住或错过</h2>
          <ul class="note-list">
            <li v-for="item in chapter.missable" :key="item">{{ item }}</li>
          </ul>
        </section>

        <section class="panel">
          <h2 class="panel-title">数据出处</h2>
          <p class="paragraph muted">
            章节顺序、铃铛、任务与 BOSS 遭遇顺序整理自英文 wiki 的流程页，地名与人名按字面意译，并与图鉴里的译法对齐；
            中文章名来自攻略目录。
          </p>
          <p v-if="chapter.source" class="paragraph">
            <a class="source-link" :href="chapter.source" target="_blank" rel="noopener noreferrer">{{ chapter.source }}</a>
          </p>
          <p v-else class="paragraph muted">
            这一章还没有对应的流程页，内容来自 BOSS 图鉴里的位置与掉落信息。
          </p>
        </section>
      </div>

      <aside>
        <section class="panel sticky">
          <h2 class="panel-title small">章节导航</h2>
          <div class="pager">
            <button class="pager-btn" :disabled="!neighbors.prev" @click="goTo(neighbors.prev)">
              <el-icon><ArrowLeft /></el-icon>
              上一章
            </button>
            <button class="pager-btn" :disabled="!neighbors.next" @click="goTo(neighbors.next)">
              下一章
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
          <p class="pager-hint">
            {{ neighbors.prev ? chapterLabel(neighbors.prev) : '已经是第一章' }} ·
            {{ neighbors.next ? chapterLabel(neighbors.next) : '已经是最后一章' }}
          </p>

          <RouterLink to="/pbz/walkthrough" class="back-link">
            <el-icon :size="12"><Back /></el-icon>
            返回主线流程
          </RouterLink>
        </section>
      </aside>
    </div>
  </div>

  <el-empty v-else description="没有找到这一章，可能是链接已失效">
    <el-button type="primary" plain @click="$router.push('/pbz/walkthrough')">返回主线流程</el-button>
  </el-empty>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Back } from '@element-plus/icons-vue'
import {
  bossHref,
  chapterBosses,
  chapterLabel,
  chapterNeighbors,
  findChapter,
} from '../../utils/pbzWalkthrough'
import './pbz.css'

const route = useRoute()
const router = useRouter()

const chapter = computed(() => findChapter(route.params.id))
const bosses = computed(() => (chapter.value ? chapterBosses(chapter.value) : []))
const neighbors = computed(() => (chapter.value ? chapterNeighbors(chapter.value) : { prev: null, next: null }))

function goTo(target) {
  if (target) router.push(`/pbz/walkthrough/${encodeURIComponent(target.id)}`)
}
</script>
