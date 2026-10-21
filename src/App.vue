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
              <RouterLink
                v-for="item in navItems"
                :key="item.path"
                :to="item.path"
                class="nav-link"
                :class="{ active: isActive(item.path) }"
              >
                {{ item.label }}
              </RouterLink>
            </nav>
            <GlobalSearch />
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
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { Trophy } from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import GlobalSearch from './components/GlobalSearch.vue'

const navItems = [
  { path: '/', label: '首页' },
  { path: '/main-quest', label: '主线' },
  { path: '/side-quests', label: '支线' },
  { path: '/weapons', label: '武器' },
  { path: '/runes', label: '符文' },
  { path: '/sorceries', label: '魔法' },
  { path: '/incantations', label: '祷告' },
  { path: '/spirits', label: '骨灰' },
]

const route = useRoute()

function isActive(path) {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>
