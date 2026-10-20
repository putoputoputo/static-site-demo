import { createRouter, createWebHistory } from 'vue-router'

// 路由级懒加载：各页面与它们依赖的数据文件会被拆成独立 chunk，
// 首屏只下载当前路由需要的代码，避免单文件 bundle 随内容增长一路膨胀。
const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/weapons', name: 'weapons', component: () => import('../views/WeaponsView.vue') },
  { path: '/weapons/:id', name: 'weapon-detail', component: () => import('../views/WeaponDetailView.vue') },
  { path: '/side-quests', name: 'side-quests', component: () => import('../views/QuestsView.vue') },
  { path: '/side-quests/:id', name: 'quest-detail', component: () => import('../views/QuestDetailView.vue') },
  {
    path: '/main-quest',
    name: 'main-quest',
    component: () => import('../views/MainlineView.vue'),
  },
  // 必须放在 /main-quest/:id 之前，否则会被当成章节 id
  {
    path: '/main-quest/regions',
    name: 'main-regions',
    component: () => import('../views/RegionsView.vue'),
  },
  {
    path: '/main-quest/:id',
    name: 'main-chapter',
    component: () => import('../views/MainlineDetailView.vue'),
  },
  {
    path: '/runes',
    name: 'runes',
    component: () => import('../views/PlaceholderView.vue'),
    props: { title: '符文' },
  },
  {
    path: '/sorceries',
    name: 'sorceries',
    component: () => import('../views/PlaceholderView.vue'),
    props: { title: '魔法' },
  },
  {
    path: '/incantations',
    name: 'incantations',
    component: () => import('../views/PlaceholderView.vue'),
    props: { title: '祷告' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition ? savedPosition : { top: 0 }
  },
})

export default router
