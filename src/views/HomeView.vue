<template>
  <div class="home">
    <div class="banner">
      <h1>艾尔登法环攻略站</h1>
      <p>交界地的褪色者啊，愿你在这里找到指引——愿黄金指引与你同在</p>
    </div>

    <div class="board-grid">
      <RouterLink
        v-for="board in boards"
        :key="board.path"
        :to="board.path"
        class="board-card"
      >
        <el-icon :size="36" color="#d4af37">
          <component :is="board.icon" />
        </el-icon>
        <h2>{{ board.label }}</h2>
        <p>{{ board.desc }}</p>
        <el-tag v-if="board.ready" type="warning" effect="dark" size="small">已上线</el-tag>
        <el-tag v-else type="info" effect="plain" size="small">敬请期待</el-tag>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { Flag, ChatDotRound, KnifeFork, Medal, MagicStick, Sunrise, Avatar } from '@element-plus/icons-vue'
import {
  weaponCount,
  weaponTypeCount,
  questStats,
  mainStats,
  regionStats,
  talismanStats,
  sorceryStats,
  incantationStats,
  spiritStats,
} from '../data/summary'

const boards = [
  {
    label: '主线',
    desc: `本体 ${mainStats.base} 章 + DLC ${mainStats.dlc} 章 / ${mainStats.steps} 步，另含 ${regionStats.total} 个区域、${regionStats.bosses} 个 BOSS（追忆 ${regionStats.remembrance}）与 ${mainStats.endings} 个结局`,
    path: '/main-quest',
    icon: Flag,
    ready: true,
  },
  {
    label: '支线',
    desc: `${questStats.total} 条 NPC 支线（本体 ${questStats.base} + DLC ${questStats.dlc}），含 ${questStats.missable} 条易错过预警与分支结局`,
    path: '/side-quests',
    icon: ChatDotRound,
    ready: true,
  },
  {
    label: '武器',
    desc: `${weaponCount} 件武器、${weaponTypeCount} 个类型全收录：数值、战技、异常状态与配装推荐`,
    path: '/weapons',
    icon: KnifeFork,
    ready: true,
  },
  {
    label: '符文',
    desc: `${talismanStats.total} 个护符（含 ${talismanStats.dlc} 个 DLC）与 ${talismanStats.greatRunes} 个大卢恩：重量、效果、获取位置与流派取舍`,
    path: '/runes',
    icon: Medal,
    ready: true,
  },
  {
    label: '魔法',
    desc: `${sorceryStats.total} 个魔法、${sorceryStats.schools} 个学派：FP 消耗、记忆格、智力需求与各阶段输出核心`,
    path: '/sorceries',
    icon: MagicStick,
    ready: true,
  },
  {
    label: '祷告',
    desc: `${incantationStats.total} 个祷告、${incantationStats.schools} 个体系：治疗、防护、附魔与龙飨吐息全收录`,
    path: '/incantations',
    icon: Sunrise,
    ready: true,
  },
  {
    label: '骨灰',
    desc: `${spiritStats.total} 个骨灰（含 ${spiritStats.dlc} 个 DLC）：FP 消耗、定位、强化材料与召唤时机`,
    path: '/spirits',
    icon: Avatar,
    ready: true,
  },
]
</script>

<style scoped>
.banner {
  padding: 64px 24px;
  text-align: center;
  background: linear-gradient(180deg, rgba(212, 175, 55, 0.12), transparent),
    radial-gradient(ellipse at center, rgba(212, 175, 55, 0.08), transparent 70%);
  border-radius: 12px;
  border: 1px solid #3a3324;
  margin-bottom: 32px;
}

.banner h1 {
  margin: 0 0 12px;
  font-size: 36px;
  color: #d4af37;
  letter-spacing: 4px;
}

.banner p {
  margin: 0;
  color: #b8b2a0;
  font-size: 15px;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 900px) {
  .board-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .board-grid {
    grid-template-columns: 1fr;
  }
}

.board-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 24px;
  background: #1c1c1c;
  border: 1px solid #3a3324;
  border-radius: 12px;
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}

.board-card:hover {
  border-color: #d4af37;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.12);
}

.board-card h2 {
  margin: 0;
  font-size: 20px;
  color: #e5e3d8;
}

.board-card p {
  margin: 0;
  color: #8a8574;
  font-size: 13px;
  line-height: 1.6;
  flex: 1;
}
</style>
