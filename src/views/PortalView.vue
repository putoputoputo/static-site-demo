<template>
  <div class="portal">
    <div class="portal-head">
      <h1>艾尔登法环攻略站</h1>
      <p>两个板块：一边查攻略，一边记录画面</p>
    </div>

    <div class="portal-grid">
      <RouterLink to="/game" class="portal-card game">
        <div class="card-icon">
          <el-icon :size="34"><Trophy /></el-icon>
        </div>
        <h2>游戏板块</h2>
        <p class="card-desc">
          主线流程、支线任务、区域与 BOSS 攻略，武器与四类图鉴，外加流派库、构筑器与进度总览。
        </p>
        <ul class="card-facts">
          <li>{{ mainStats.total }} 章主线</li>
          <li>{{ questStats.total }} 条支线</li>
          <li>{{ regionStats.bosses }} 个 BOSS</li>
          <li>{{ weaponCount }} 件武器</li>
        </ul>
        <span class="card-enter">
          进入攻略
          <el-icon :size="14"><ArrowRight /></el-icon>
        </span>
      </RouterLink>

      <RouterLink to="/photo" class="portal-card photo">
        <div class="card-icon">
          <el-icon :size="34"><Camera /></el-icon>
        </div>
        <h2>摄影板块</h2>
        <p class="card-desc">
          拍下一张照片，或上传已有截图，交给影像分析读取画面信息、给出构图与氛围建议。
        </p>
        <ul class="card-facts">
          <li>拍照</li>
          <li>上传</li>
          <li>画面分析</li>
        </ul>
        <span class="card-enter">
          进入摄影
          <el-icon :size="14"><ArrowRight /></el-icon>
        </span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { Trophy, Camera, ArrowRight } from '@element-plus/icons-vue'
// 只从构建期生成的 summary 取数字：门户页是首屏，不能为了四个统计
// 把整份 BOSS / 武器数据（约 200KB）打进首个 chunk
import { mainStats, questStats, weaponCount, regionStats } from '../data/summary'
</script>

<style scoped>
.portal {
  padding: 24px 0 8px;
}

.portal-head {
  text-align: center;
  margin-bottom: 36px;
}

.portal-head h1 {
  margin: 0 0 10px;
  font-size: 34px;
  letter-spacing: 4px;
  color: #d4af37;
}

.portal-head p {
  margin: 0;
  font-size: 14px;
  color: #8a8574;
}

.portal-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 22px;
}

.portal-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 34px 30px 28px;
  min-height: 300px;
  text-decoration: none;
  background: #1a1a1a;
  border: 1px solid #3a3324;
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.22s, transform 0.22s, box-shadow 0.22s;
}

/* 顶部一层渐隐光，让两张卡在暗色底上有区分度 */
.portal-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 160px;
  pointer-events: none;
}

.portal-card.game::before {
  background: radial-gradient(120% 100% at 20% 0%, rgba(212, 175, 55, 0.16), transparent 70%);
}

.portal-card.photo::before {
  background: radial-gradient(120% 100% at 20% 0%, rgba(110, 160, 190, 0.16), transparent 70%);
}

.portal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
}

.portal-card.game:hover {
  border-color: #d4af37;
  box-shadow: 0 10px 28px rgba(212, 175, 55, 0.14);
}

.portal-card.photo:hover {
  border-color: #6ea0be;
  box-shadow: 0 10px 28px rgba(110, 160, 190, 0.14);
}

.card-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 62px;
  height: 62px;
  border-radius: 14px;
  border: 1px solid #3a3324;
  background: #141414;
}

.portal-card.game .card-icon {
  color: #d4af37;
}

.portal-card.photo .card-icon {
  color: #6ea0be;
}

.portal-card h2 {
  position: relative;
  margin: 0;
  font-size: 22px;
  letter-spacing: 2px;
  color: #e5e3d8;
}

.card-desc {
  position: relative;
  margin: 0;
  font-size: 13.5px;
  line-height: 1.75;
  color: #8a8574;
  flex: 1;
}

.card-facts {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.card-facts li {
  padding: 3px 10px;
  font-size: 12px;
  color: #a09a86;
  background: #141414;
  border: 1px solid #332d20;
  border-radius: 999px;
}

.card-enter {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #b8b2a0;
  transition: color 0.2s, gap 0.2s;
}

.portal-card.game:hover .card-enter {
  color: #d4af37;
  gap: 10px;
}

.portal-card.photo:hover .card-enter {
  color: #6ea0be;
  gap: 10px;
}

@media (max-width: 760px) {
  .portal-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .portal-head h1 {
    font-size: 26px;
  }

  .portal-card {
    min-height: 0;
    padding: 26px 22px 24px;
  }
}
</style>
