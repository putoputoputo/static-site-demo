import { createRouter, createWebHistory } from 'vue-router'

// 静态托管（GitHub Pages）上直接访问深链接会命中 404.html，
// 它把真实路径存进 sessionStorage 后跳回站点根。这里必须在 createWebHistory
// 读取 location 之前把地址改回去，否则用户会落在首页。
const REDIRECT_KEY = 'er-guide:spa-redirect'

if (typeof window !== 'undefined') {
  const pendingPath = window.sessionStorage.getItem(REDIRECT_KEY)
  if (pendingPath) {
    window.sessionStorage.removeItem(REDIRECT_KEY)
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    window.history.replaceState(null, '', `${base}${pendingPath}`)
  }
}

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
    path: '/main-quest/remembrances',
    name: 'main-remembrances',
    component: () => import('../views/RemembrancesView.vue'),
  },
  {
    path: '/main-quest/:id',
    name: 'main-chapter',
    component: () => import('../views/MainlineDetailView.vue'),
  },
  {
    path: '/runes',
    name: 'runes',
    component: () => import('../views/CodexView.vue'),
    props: { moduleKey: 'talismans' },
  },
  {
    path: '/runes/:id',
    name: 'rune-detail',
    component: () => import('../views/CodexDetailView.vue'),
    props: { moduleKey: 'talismans' },
  },
  {
    path: '/sorceries',
    name: 'sorceries',
    component: () => import('../views/CodexView.vue'),
    props: { moduleKey: 'sorceries' },
  },
  {
    path: '/sorceries/:id',
    name: 'sorcery-detail',
    component: () => import('../views/CodexDetailView.vue'),
    props: { moduleKey: 'sorceries' },
  },
  {
    path: '/incantations',
    name: 'incantations',
    component: () => import('../views/CodexView.vue'),
    props: { moduleKey: 'incantations' },
  },
  {
    path: '/incantations/:id',
    name: 'incantation-detail',
    component: () => import('../views/CodexDetailView.vue'),
    props: { moduleKey: 'incantations' },
  },
  {
    path: '/spirits',
    name: 'spirits',
    component: () => import('../views/CodexView.vue'),
    props: { moduleKey: 'spirits' },
  },
  {
    path: '/spirits/:id',
    name: 'spirit-detail',
    component: () => import('../views/CodexDetailView.vue'),
    props: { moduleKey: 'spirits' },
  },
  // 必须放最后：未匹配的路径统一落到 404 页，而不是白屏
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
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
