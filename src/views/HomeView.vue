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
import weapons from '../data/weapons'

const weaponTypesCount = new Set(weapons.map((item) => item.type)).size

const boards = [
  { label: '主线', desc: '主线流程、Boss 顺序与关键节点攻略', path: '/main-quest', icon: 'Flag', ready: false },
  { label: '支线', desc: 'NPC 支线任务与剧情分支全解析', path: '/side-quests', icon: 'ChatDotRound', ready: false },
  {
    label: '武器',
    desc: `${weapons.length} 件武器、${weaponTypesCount} 个类型全收录：数值、战技、异常状态与配装推荐`,
    path: '/weapons',
    icon: 'KnifeFork',
    ready: true,
  },
  { label: '符文', desc: '护符收集与强力符文搭配推荐', path: '/runes', icon: 'Medal', ready: false },
  { label: '魔法', desc: '魔法列表与法师流派构筑指南', path: '/sorceries', icon: 'MagicStick', ready: false },
  { label: '祷告', desc: '祷告一览与信仰流玩法攻略', path: '/incantations', icon: 'Sunrise', ready: false },
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
