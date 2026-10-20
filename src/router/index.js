import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import WeaponsView from '../views/WeaponsView.vue'
import WeaponDetailView from '../views/WeaponDetailView.vue'
import QuestsView from '../views/QuestsView.vue'
import QuestDetailView from '../views/QuestDetailView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/weapons', name: 'weapons', component: WeaponsView },
  { path: '/weapons/:id', name: 'weapon-detail', component: WeaponDetailView },
  { path: '/side-quests', name: 'side-quests', component: QuestsView },
  { path: '/side-quests/:id', name: 'quest-detail', component: QuestDetailView },
  { path: '/main-quest', name: 'main-quest', component: PlaceholderView, props: { title: '主线' } },
  { path: '/runes', name: 'runes', component: PlaceholderView, props: { title: '符文' } },
  { path: '/sorceries', name: 'sorceries', component: PlaceholderView, props: { title: '魔法' } },
  { path: '/incantations', name: 'incantations', component: PlaceholderView, props: { title: '祷告' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition ? savedPosition : { top: 0 }
  },
})

export default router
