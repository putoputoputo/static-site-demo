<template>
  <el-config-provider :locale="zhCn">
    <div class="layout">
      <header class="site-header">
        <div class="header-inner">
          <RouterLink to="/" class="logo">
            <el-icon :size="26"><Trophy /></el-icon>
            <span>艾尔登法环攻略站</span>
          </RouterLink>
          <div class="header-right">
            <nav class="nav">
              <RouterLink to="/" class="nav-link" :class="{ active: route.path === '/' }">首页</RouterLink>
              <!-- 游戏板块内部才展开三个分组下拉；门户页与摄影板块只留板块级入口 -->
              <template v-if="inGame">
                <NavGroup v-for="group in navGroups" :key="group.label" :label="group.label" :items="group.items" />
              </template>
              <RouterLink v-else to="/game" class="nav-link" :class="{ active: route.path === '/game' }">游戏</RouterLink>
              <RouterLink to="/photo" class="nav-link" :class="{ active: route.path === '/photo' }">摄影</RouterLink>
            </nav>
            <!-- 全站搜索只索引游戏资料，摄影板块下没有可搜内容 -->
            <GlobalSearch v-if="inGame" />
          </div>
        </div>
      </header>
      <main class="site-main">
        <RouterView />
      </main>
      <footer class="site-footer">
        艾尔登法环攻略站 · 交界地褪色者们的指引 · 仅供学习交流
      </footer>
    </div>
  </el-config-provider>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { Trophy } from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import GlobalSearch from './components/GlobalSearch.vue'
import NavGroup from './components/NavGroup.vue'

// 页面已经有 11 个，平铺会把头部撑爆（窄屏只能横向滚动找链接）。
// 按「流程 / 图鉴 / 工具」分成三组下拉，头部只占四个位置。
const navGroups = [
  {
    label: '流程',
    items: [
      { path: '/main-quest', label: '主线流程', desc: '本体 8 章 + DLC 4 章' },
      { path: '/main-quest/regions', label: '区域与 BOSS', desc: '33 个区域 / 105 个 BOSS' },
      { path: '/bosses', label: 'BOSS 攻略', desc: '弱点 · 打法 · 掉落' },
      { path: '/main-quest/remembrances', label: '追忆兑换', desc: '25 个追忆能换什么' },
      { path: '/side-quests', label: '支线任务', desc: '51 条支线 / 531 步' },
    ],
  },
  {
    label: '图鉴',
    items: [
      { path: '/weapons', label: '武器', desc: '480 件 / 42 类' },
      { path: '/runes', label: '符文（护符）', desc: '149 个' },
      { path: '/sorceries', label: '魔法', desc: '84 个' },
      { path: '/incantations', label: '祷告', desc: '129 个' },
      { path: '/spirits', label: '骨灰', desc: '84 个' },
    ],
  },
  {
    label: '工具',
    items: [
      { path: '/archetypes', label: '流派库', desc: '10 套能直接抄的成型路线' },
      { path: '/build', label: '构筑器', desc: '负重 · 需求 · 记忆格' },
      { path: '/progress', label: '我的进度', desc: '主线 / 支线 / 收藏总览' },
    ],
  },
]

const route = useRoute()

// 除门户页与摄影板块外，其余路径都属于游戏板块（含 404 兜底页）
const inGame = computed(() => route.path !== '/' && route.path !== '/photo')
</script>
