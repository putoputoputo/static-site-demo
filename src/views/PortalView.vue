<template>
  <div class="portal">
    <div class="portal-head">
      <h1>我的计划</h1>
      <p>四个板块：两款游戏的攻略、影像分析，以及一份能落地的北京行程</p>
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

      <RouterLink to="/pbz" class="portal-card pbz">
        <div class="card-icon">
          <el-icon :size="34"><Aim /></el-icon>
        </div>
        <h2>影之刃零</h2>
        <p class="card-desc">
          主武器与影之武装图鉴、按打法整理的流派配装、分区域的 BOSS 攻略，以及四个结局的条件与难度规则。数据逐条标注出处。
        </p>
        <ul class="card-facts">
          <li>{{ pbzStats.weapons }} 把主武器</li>
          <li>{{ pbzStats.phantomEdges }} 件影之武装</li>
          <li>{{ pbzStats.archetypes }} 套流派</li>
          <li>{{ pbzStats.bosses }} 个 BOSS</li>
          <li>{{ pbzStats.endings }} 个结局</li>
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

      <RouterLink to="/travel" class="portal-card travel">
        <div class="card-icon">
          <el-icon :size="34"><Place /></el-icon>
        </div>
        <h2>旅游板块</h2>
        <p class="card-desc">
          春节去北京：故宫与长城必去，按你选的起点终点串成路线，附每段通勤的时间与票价，以及每个景点的门票、预约与闭馆条件。
        </p>
        <ul class="card-facts">
          <li>18 个景点</li>
          <li>路线规划</li>
          <li>门票与预约</li>
        </ul>
        <span class="card-enter">
          进入旅游
          <el-icon :size="14"><ArrowRight /></el-icon>
        </span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { Trophy, Camera, ArrowRight, Aim, Place } from '@element-plus/icons-vue'
// 只从构建期生成的 summary 取数字：门户页是首屏，不能为了四个统计
// 把整份 BOSS / 武器数据（约 200KB）打进首个 chunk
import { mainStats, questStats, weaponCount, regionStats, pbzStats } from '../data/summary'
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
  color: var(--accent);
}

.portal-head p {
  margin: 0;
  font-size: 14px;
  color: var(--fg-3);
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
  min-height: 260px;
  text-decoration: none;
  background: var(--surface);
  border: 1px solid color-mix(in srgb, var(--accent) 14%, transparent);
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
  background: radial-gradient(120% 100% at 20% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%);
}

.portal-card.pbz::before {
  background: radial-gradient(120% 100% at 20% 0%, rgba(216, 87, 74, 0.16), transparent 70%);
}

.portal-card.photo::before {
  background: radial-gradient(120% 100% at 20% 0%, rgba(110, 160, 190, 0.16), transparent 70%);
}

.portal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
}

.portal-card.game:hover {
  border-color: var(--accent);
  box-shadow: 0 10px 28px color-mix(in srgb, var(--accent) 14%, transparent);
}

.portal-card.pbz:hover {
  border-color: color-mix(in srgb, #d8574a var(--tone-mix), var(--fg));
  box-shadow: 0 10px 28px rgba(216, 87, 74, 0.14);
}

.portal-card.photo:hover {
  border-color: color-mix(in srgb, #6ea0be var(--tone-mix), var(--fg));
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
  border: 1px solid color-mix(in srgb, var(--accent) 14%, transparent);
  background: var(--bg);
}

.portal-card.game .card-icon {
  color: var(--accent);
}

.portal-card.pbz .card-icon {
  color: color-mix(in srgb, #d8574a var(--tone-mix), var(--fg));
}

.portal-card.photo .card-icon {
  color: color-mix(in srgb, #6ea0be var(--tone-mix), var(--fg));
}

.portal-card h2 {
  position: relative;
  margin: 0;
  font-size: 22px;
  letter-spacing: 2px;
  color: var(--fg);
}

.card-desc {
  position: relative;
  margin: 0;
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--fg-3);
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
  color: var(--fg-3);
  background: var(--bg);
  border: 1px solid color-mix(in srgb, var(--accent) 13%, transparent);
  border-radius: 999px;
}

.card-enter {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--fg-2);
  transition: color 0.2s, gap 0.2s;
}

.portal-card.game:hover .card-enter {
  color: var(--accent);
  gap: 10px;
}

.portal-card.pbz:hover .card-enter {
  color: color-mix(in srgb, #d8574a var(--tone-mix), var(--fg));
  gap: 10px;
}

.portal-card.photo:hover .card-enter {
  color: color-mix(in srgb, #6ea0be var(--tone-mix), var(--fg));
  gap: 10px;
}

/* 三张卡在中等宽度下每张不足 300px，文案会挤成很多行，先降成单列 */
@media (max-width: 980px) {
  .portal-grid {
    grid-template-columns: 1fr;
  }

  .portal-card {
    min-height: 0;
  }
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
/* 第四个板块：旅游，绿色系，与前三个拉开区分 */
.portal-card.travel::before {
  background: radial-gradient(120% 100% at 20% 0%, rgba(111, 158, 122, 0.16), transparent 70%);
}

.portal-card.travel:hover {
  border-color: color-mix(in srgb, #6f9e7a var(--tone-mix), var(--fg));
  box-shadow: 0 10px 28px rgba(111, 158, 122, 0.14);
}

.portal-card.travel .card-icon {
  color: color-mix(in srgb, #6f9e7a var(--tone-mix), var(--fg));
}

.portal-card.travel:hover .card-enter {
  color: color-mix(in srgb, #6f9e7a var(--tone-mix), var(--fg));
  gap: 10px;
}
</style>
