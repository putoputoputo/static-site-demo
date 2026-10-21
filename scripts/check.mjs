/**
 * 页面回归检查。
 * 1. usePagination 纯逻辑：页数、切片、折叠页码、边界收敛
 * 2. SSR 实渲染：武器列表首屏 DOM 里到底有多少张卡片
 * 3. 四个图鉴模块：确认不再「每批 48 条」
 * 4. 404 兜底：路由 catch-all 与 public/404.html
 *
 * 运行：npm run check
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ref, nextTick, h } from 'vue'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'
import { usePagination } from '../src/composables/usePagination.js'

const root = resolve(import.meta.dirname, '..')

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
const { default: CodexView } = await vite.ssrLoadModule('/src/views/CodexView.vue')
const { codexModules } = await vite.ssrLoadModule('/src/data/codex.js')

const Blank = { render: () => null }

async function renderView(component, path, props) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Blank },
      { path: '/weapons', component: Blank },
      { path: '/weapons/:id', component: Blank },
      { path: '/codex/:id', component: Blank },
      { path: '/:pathMatch(.*)*', component: Blank },
    ],
  })
  await router.push(path)
  await router.isReady()
  const app = props ? createSSRApp({ render: () => h(component, props) }) : createSSRApp(component)
  app.use(router)
  return renderToString(app)
}

function pagerOf(html) {
  return {
    nums: [...html.matchAll(/class="([^"]*pager-num[^"]*)"[^>]*>\s*([\d.]+)\s*</g)].map((m) => m[2]),
    active: (html.match(/class="[^"]*\bactive\b[^"]*\bpager-num\b[^"]*"[^>]*>\s*([\d.]+)\s*</) || [])[1],
  }
}

const html = await renderView(WeaponsView, '/weapons')
const { nums, active } = pagerOf(html)

check('SSR 首屏卡片数', (html.match(/class="weapon-card"/g) || []).length, 20)
check('SSR 页码', nums, ['1', '2', '...', '24'])
check('SSR 当前页高亮', active, '1')
check('SSR 分页提示文案', html.includes('当前显示第 1–20 件'), true)
check('SSR 每页选项', ['20', '48', '120', '全部'].every((label) => html.includes(`>${label}<`)), true)

/* ---------- 3. 四个图鉴模块：不再「每批 48 条」 ---------- */
for (const mod of Object.values(codexModules)) {
  const listHtml = await renderView(CodexView, '/codex/talismans', { moduleKey: mod.key })
  const cardsInDom = (listHtml.match(/class="codex-card"/g) || []).length
  const expectedPages = Math.ceil(mod.items.length / 20)

  check(`${mod.key} 总数`, mod.items.length, mod.items.length)
  check(`${mod.key} 首屏卡片数`, cardsInDom, Math.min(20, mod.items.length))
  check(`${mod.key} 总页数`, pagerOf(listHtml).nums.at(-1), String(expectedPages))
  check(`${mod.key} 已移除「再显示」按钮`, listHtml.includes('再显示'), false)
  check(`${mod.key} 分页提示`, listHtml.includes('当前显示第 1–20 条'), mod.items.length > 20)
}

/* ---------- 4. 404 兜底 ---------- */
const { default: NotFoundView } = await vite.ssrLoadModule('/src/views/NotFoundView.vue')
const notFoundHtml = await renderView(NotFoundView, '/no-such-page')

check('404 页渲染标题', notFoundHtml.includes('这条赐福不在这里'), true)
check('404 页显示访问路径', notFoundHtml.includes('/no-such-page'), true)
check('404 页含返回首页', notFoundHtml.includes('回到首页'), true)

const routerSource = readFileSync(resolve(root, 'src/router/index.js'), 'utf8')
check('路由含 catch-all', routerSource.includes('pathMatch(.*)*'), true)

const notFoundStatic = resolve(root, 'public/404.html')
check('public/404.html 已生成', existsSync(notFoundStatic), true)
if (existsSync(notFoundStatic)) {
  const staticHtml = readFileSync(notFoundStatic, 'utf8')
  check('404.html 写入跳转路径', staticHtml.includes("sessionStorage.setItem('er-guide:spa-redirect'"), true)
  check('404.html 注入 base', /var base = '\/[^']*'/.test(staticHtml), true)

  // 真正跑一遍 404.html 里的内联脚本，确认不同深链接都能还原成应用内路径
  const inline = staticHtml.match(/<script>([\s\S]*?)<\/script>/)[1]
  const base = staticHtml.match(/var base = '([^']*)'/)[1]
  const runRedirect = (pathname) => {
    const store = {}
    const location = { pathname, search: '', hash: '', replaced: null, replace(url) { this.replaced = url } }
    const sessionStorage = {
      setItem(key, value) { store[key] = value },
      getItem(key) { return store[key] },
    }
    // eslint-disable-next-line no-new-func
    new Function('location', 'sessionStorage', 'console', inline)(location, sessionStorage, console)
    return { path: store['er-guide:spa-redirect'], replaced: location.replaced }
  }

  const basePrefix = base.replace(/\/$/, '')
  const samples = ['/weapons/moonveil', '/side-quests/seluvis', '/main-quest/regions', '/']
  const restored = samples.map((p) => runRedirect(`${basePrefix}${p}`))
  check('404.html 还原深链接', restored.map((r) => r.path), samples)
  check('404.html 跳回站点根', restored.every((r) => r.replaced === base), true)
}

await vite.close()

console.log(failed ? `\n${failed} 项未通过` : '\n全部通过')
process.exit(failed ? 1 : 0)
