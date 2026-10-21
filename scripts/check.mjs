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

/* ---------- 5. 追忆兑换表 / 跨模块链接 / 全站搜索 ---------- */
{
  const { default: remembrances, remembranceStats } = await import('../src/data/remembrances.js')
  const { remembranceList } = await import('../src/utils/remembrances.js')
  const { linkBuildTags } = await import('../src/utils/buildLinks.js')
  const { default: weapons } = await import('../src/data/weapons.js')
  const { searchAll, searchIndexSize, searchGroupOrder } = await import('../src/utils/search.js')

  check('追忆 BOSS 数', remembranceStats.total, 25)
  check('追忆 = 本体 15 + DLC 10', [remembranceStats.base, remembranceStats.dlc], [15, 10])
  check('追忆可兑换物品数', remembranceStats.items, 51)

  const unlinked = remembranceList.flatMap((entry) =>
    entry.items.filter((item) => !item.to).map((item) => item.name)
  )
  // 战灰 / 道具没有对应图鉴模块，DLC 护符「狂怒神兽」还不在 149 条本体护符里 —— 都属于预期内
  check('追忆物品可链接数', remembranceStats.items - unlinked.length, 46)
  check('未链接的只有战灰/道具/未收录护符', unlinked.sort(), ['黑暗波动', '狂怒神兽', '神兽冻霜踏地', '王室恶兆幼子像', '荷莱·露的撼地'].sort())

  const everyType = remembrances.every((entry) => entry.items.length >= 2)
  check('每个追忆至少 2 件兑换物', everyType, true)
  check('拉塔恩追忆可三选一', remembrances.find((item) => item.id === 'promised-consort').items.length, 3)

  // 武器详情「推荐配装」的护符 / 魔法 / 祷告现在都能点进图鉴
  let talismanTags = 0
  let linkedTags = 0
  weapons.forEach((weapon) => {
    linkBuildTags('talismans', weapon.build?.talismans || []).forEach((tag) => {
      talismanTags += 1
      if (tag.to) linkedTags += 1
    })
  })
  check('配装护符标签全部可点', [linkedTags, talismanTags], [talismanTags, talismanTags])

  const radahn = searchAll('拉塔恩')
  check('全站搜索跨模块命中', radahn.length >= 5, true)
  check('搜索分组都在白名单内', radahn.every((group) => searchGroupOrder.includes(group.group)), true)
  check('搜索按名称优先', searchAll('月隐')[0].items[0].name, '名刀月隐')
  check('搜索索引非空', searchIndexSize() > 1000, true)
  check('空关键词不返回结果', searchAll('   ').length, 0)

  const { default: RemembrancesView } = await vite.ssrLoadModule('/src/views/RemembrancesView.vue')
  const { default: WeaponDetailView } = await vite.ssrLoadModule('/src/views/WeaponDetailView.vue')

  const routes = [
    { path: '/', component: () => null },
    { path: '/main-quest', component: () => null },
    { path: '/main-quest/remembrances', component: RemembrancesView },
    { path: '/weapons/:id', component: WeaponDetailView },
    { path: '/weapons', component: () => null },
  ]
  const renderPage = async (view, path) => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push(path)
    await router.isReady()
    const app = createSSRApp(view)
    app.use(router)
    return renderToString(app)
  }

  const remembranceHtml = await renderPage(RemembrancesView, '/main-quest/remembrances')
  // Vue SSR 把动态 class 排在静态 class 前面，两种顺序都要算上
  const cards = (remembranceHtml.match(/class="[^"]*\bremembrance-card\b/g) || []).length
  const rows = (remembranceHtml.match(/class="item-row"/g) || []).length
  const links = (remembranceHtml.match(/class="item-name link"/g) || []).length
  check('SSR 追忆卡片数', cards, 25)
  check('SSR 兑换物行数', rows, 51)
  check('SSR 可点物品数', links, 46)
  check('SSR 三选一提示', remembranceHtml.includes('三选一'), true)

  const detailHtml = await renderPage(WeaponDetailView, '/weapons/uchigatana')
  check('武器详情配装标签可点', (detailHtml.match(/class="item-tag is-link"/g) || []).length > 0, true)
}

/* ---------- 6. BOSS 攻略 ---------- */
{
  const { bossList, bossStats, bossTypes, bossWeaknesses, filterBosses, getBoss, bossHref, bossRegions } =
    await import('../src/utils/bosses.js')

  check('BOSS 总数', bossStats.total, 105)
  check('BOSS = 本体 80 + DLC 25', [bossStats.base, bossStats.dlc], [80, 25])
  check('每个 BOSS 都有攻略', bossStats.withGuide, 105)
  check(
    '每个 BOSS 都有推荐等级与打法要点',
    bossList.every((boss) => boss.level !== '—' && boss.tips.length > 0),
    true
  )
  check('追忆 BOSS 全部带兑换信息', bossList.filter((boss) => boss.remembrance).every((boss) => boss.exchange), true)
  check('DLC 追忆 BOSS 带幽影树祝福等级', bossList.filter((boss) => boss.dlc && boss.remembrance).every((boss) => boss.blessing), true)
  check('BOSS 地址唯一', new Set(bossList.map((boss) => bossHref(boss))).size, 105)
  check('必打筛选', filterBosses(bossList, { kind: 'required' }).length, 19)
  check('追忆筛选', filterBosses(bossList, { kind: 'remembrance' }).length, 25)
  check('弱点筛选（出血）命中足够多', filterBosses(bossList, { weaknesses: ['出血'] }).length > 10, true)
  check('区域筛选只返回该区域', filterBosses(bossList, { region: 'limgrave' }).length, 8)
  check('区域筛选与 DLC 筛选叠加', filterBosses(bossList, { region: 'enir' }).every((boss) => boss.dlc), true)
  check('类型标签非空', bossTypes.length > 5 && bossWeaknesses.length > 5, true)
  check('区域列表排除了无 BOSS 区域', bossRegions.length, 31)

  // 同名 BOSS 分布在不同区域，必须能分别取到，否则详情页会串
  check('同名 BOSS 按区域区分', [
    getBoss('limgrave', '死鸟')?.regionName,
    getBoss('caelid', '死鸟')?.regionName,
  ], ['宁姆格福', '盖利德'])
  check('不存在的 BOSS 返回 null', getBoss('limgrave', '不存在的王'), null)

  const { default: BossesView } = await vite.ssrLoadModule('/src/views/BossesView.vue')
  const { default: BossDetailView } = await vite.ssrLoadModule('/src/views/BossDetailView.vue')

  const bossRoutes = [
    { path: '/', component: () => null },
    { path: '/bosses', component: BossesView },
    { path: '/bosses/:region/:name', component: BossDetailView },
    { path: '/main-quest/regions', component: () => null },
    { path: '/main-quest/remembrances', component: () => null },
    { path: '/side-quests/:id', component: () => null },
  ]
  const renderBoss = async (view, path) => {
    const router = createRouter({ history: createMemoryHistory(), routes: bossRoutes })
    await router.push(path)
    await router.isReady()
    const app = createSSRApp(view)
    app.use(router)
    return renderToString(app)
  }

  const listHtml = await renderBoss(BossesView, '/bosses')
  check('SSR BOSS 首屏卡片数', (listHtml.match(/class="[^"]*\bboss-card\b/g) || []).length, 20)
  check('SSR BOSS 总页数', pagerOf(listHtml).nums.at(-1), '6')
  check('SSR BOSS 英雄区统计', listHtml.includes('105'), true)

  const detailHtml = await renderBoss(BossDetailView, `/bosses/${encodeURIComponent('limgrave')}/${encodeURIComponent('接肢葛瑞克')}`)
  check('SSR BOSS 详情渲染标题', detailHtml.includes('接肢葛瑞克'), true)
  check('SSR BOSS 详情有打法要点', (detailHtml.match(/class="tip-index"/g) || []).length >= 3, true)
  check('SSR BOSS 详情弱点标签', (detailHtml.match(/class="attr-tag"/g) || []).length >= 3, true)
  check('SSR BOSS 详情含追忆兑换', detailHtml.includes('追忆兑换 ·'), true)

  const dlcHtml = await renderBoss(BossDetailView, `/bosses/enir/${encodeURIComponent('约定之王拉塔恩')}`)
  check('SSR DLC BOSS 详情含祝福等级', dlcHtml.includes('幽影树祝福'), true)

  const missHtml = await renderBoss(BossDetailView, `/bosses/limgrave/${encodeURIComponent('不存在的王')}`)
  check('SSR 未知 BOSS 走空态', missHtml.includes('找不到这个 BOSS'), true)

  // 首页与全站搜索都要能进到新模块
  const { searchAll } = await import('../src/utils/search.js')
  const bossHit = searchAll('接肢葛瑞克').find((group) => group.group === 'bosses')
  check('搜索能命中 BOSS 详情页', bossHit?.items?.[0]?.to?.startsWith('/bosses/'), true)
}

await vite.close()

console.log(failed ? `\n${failed} 项未通过` : '\n全部通过')
process.exit(failed ? 1 : 0)
