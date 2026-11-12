<template>
  <div class="pbz">
    <header class="page-hero">
      <div class="hero-text">
        <div class="hero-eyebrow">Phantom Blade Zero</div>
        <h1 class="hero-title">影之刃零</h1>
        <p class="hero-sub">
          灵游坊开发的武侠动作角色扮演游戏，2026 年 10 月 29 日登陆 PlayStation 5 与 Windows。
          你将扮演「组织」的冥使「魂」，带着只剩六十六天寿命的毒心，查清陷害自己的阴谋。
        </p>
      </div>
      <div class="hero-badges">
        <div v-for="item in highlights" :key="item.label" class="hero-badge">
          <span class="badge-value">{{ item.value }}</span>
          <span class="badge-label">{{ item.label }}</span>
        </div>
      </div>
    </header>

    <div class="board-grid">
      <RouterLink v-for="board in boards" :key="board.path" :to="board.path" class="board-card">
        <el-icon :size="34" color="#d8574a">
          <component :is="board.icon" />
        </el-icon>
        <h2>{{ board.label }}</h2>
        <p>{{ board.desc }}</p>
        <el-tag type="danger" effect="dark" size="small">已上线</el-tag>
      </RouterLink>
    </div>

    <section class="panel">
      <h2 class="panel-title">关于这里的数据</h2>
      <ul class="note-list">
        <li>数值、机制、位置与掉落整理自 Fextralife 英文 wiki，每个条目的详情页都附了对应的出处链接。</li>
        <li>中文名来自 3DM 攻略目录里出现的官方中文名。目录里没有出现的条目标为「中文名待补」，暂以英文版名称显示，不自行翻译。</li>
        <li>招式名、铃铛名与部分道具名沿用英文版名称。</li>
        <li>武器面板数值在 wiki 各页面标注的等级不同（Lv1 / Lv10 / Lv30），数值旁都带了等级，跨等级不能直接比大小。</li>
        <li>wiki 页面还是空模板的条目写的是「待补」，没有用推测内容填充。</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { KnifeFork, Aim, MagicStick, Flag } from '@element-plus/icons-vue'
// 板块首页只需要几个数字，从构建期生成的 summary 取，不为此加载整份图鉴数据
import { pbzStats } from '../../data/summary'
import './pbz.css'

const highlights = [
  { value: pbzStats.weapons, label: '主武器' },
  { value: pbzStats.phantomEdges, label: '影之武装' },
  { value: pbzStats.bosses, label: 'BOSS' },
  { value: pbzStats.endings, label: '结局' },
]

const boards = [
  {
    label: '武器',
    desc: `${pbzStats.weapons} 把主武器，分单手、双持、双手三类：伤害、破防、连段、独有机制与铸魂效果`,
    path: '/pbz/weapons',
    icon: KnifeFork,
  },
  {
    label: '影之武装',
    desc: `${pbzStats.phantomEdges} 件副武器，分五类：战斗技能、消耗，以及每一件对应的地图机关`,
    path: '/pbz/phantom-edges',
    icon: MagicStick,
  },
  {
    label: 'BOSS 攻略',
    desc: `${pbzStats.bosses} 个 BOSS，按 ${pbzStats.regions} 个区域整理：位置、掉落与打法要点`,
    path: '/pbz/bosses',
    icon: Aim,
  },
  {
    label: '结局与难度',
    desc: `${pbzStats.endings} 个结局的触发条件、${pbzStats.difficulties} 档难度的规则与核心战斗机制`,
    path: '/pbz/endings',
    icon: Flag,
  },
]
</script>
