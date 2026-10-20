/**
 * 武器图鉴分页回归检查。
 * 1. usePagination 纯逻辑：页数、切片、折叠页码、边界收敛
 * 2. SSR 实渲染：首屏 DOM 里到底有多少张卡片
 *
 * 运行：node scripts/check-pager.mjs
 */
import { ref, nextTick } from 'vue'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'
import { usePagination } from '../src/composables/usePagination.js'

let failed = 0
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failed += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${JSON.stringify(actual)}${ok ? '' : `  期望 ${JSON.stringify(expected)}`}`)
}

/* ---------- 1. 纯逻辑 ---------- */
const makeList = (n) => Array.from({ length: n }, (_, index) => ({ id: index }))
const list = ref(makeList(480))
const token = ref('init')

const p = usePagination(list, { initialPageSize: 20, resetToken: () => token.value })

check('总页数', p.totalPages.value, 24)
check('首页切片长度', p.pagedList.value.length, 20)
check('首页切片首项', p.pagedList.value[0].id, 0)
check('首页页码', p.pageItems.value, [1, 2, '...', 24])

p.goPage(24)
check('末页切片长度', p.pagedList.value.length, 20)
check('末页切片首项', p.pagedList.value[0].id, 460)
check('末页页码', p.pageItems.value, [1, '...', 23, 24])
p.goPage(5)
p.goPage(999)
check('越界页码被钳制', p.currentPage.value, 24)
check('省略号不可点', p.goPage('...'), false)

p.goPage(10)
check('中间页页码', p.pageItems.value, [1, '...', 9, 10, 11, '...', 24])

p.setPageSize(0)
check('全部模式：不分页', p.pagedList.value.length, 480)
check('全部模式：总页数', p.totalPages.value, 1)

p.setPageSize(48)
check('切每页条数后回到第 1 页', p.currentPage.value, 1)
check('48 条/页切片', p.pagedList.value.length, 48)

// 筛选条件变化 → 回到第 1 页
p.goPage(3)
token.value = 'filtered'
await nextTick()
check('筛选变化后回到第 1 页', p.currentPage.value, 1)

// 结果变少 → 越界页码收敛
p.setPageSize(20)
p.goPage(20)
list.value = makeList(30)
await nextTick()
check('结果变少后收敛页码', p.currentPage.value, 2)
check('收敛后切片非空', p.pagedList.value.length, 10)

/* ---------- 2. SSR 实渲染 ---------- */
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
  optimizeDeps: { noDiscovery: true, include: [] },
})
const { default: WeaponsView } = await vite.ssrLoadModule('/src/views/WeaponsView.vue')

const Blank = { render: () => null }
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Blank },
    { path: '/weapons', component: WeaponsView },
    { path: '/weapons/:id', component: Blank },
  ],
})
await router.push('/weapons')
await router.isReady()

const app = createSSRApp(WeaponsView)
app.use(router)
const html = await renderToString(app)
await vite.close()

const cards = (html.match(/class="weapon-card"/g) || []).length
const nums = [...html.matchAll(/class="([^"]*pager-num[^"]*)"[^>]*>\s*([\d.]+)\s*</g)].map((m) => m[2])
const active = (html.match(/class="[^"]*\bactive\b[^"]*\bpager-num\b[^"]*"[^>]*>\s*([\d.]+)\s*</) || [])[1]

check('SSR 首屏卡片数', cards, 20)
check('SSR 页码', nums, ['1', '2', '...', '24'])
check('SSR 当前页高亮', active, '1')
check('SSR 分页提示文案', html.includes('当前显示第 1–20 件'), true)
check('SSR 每页选项', ['20', '48', '120', '全部'].every((label) => html.includes(`>${label}<`)), true)

console.log(failed ? `\n${failed} 项未通过` : '\n全部通过')
process.exit(failed ? 1 : 0)
