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
      // renderView 渲染的是传入的组件，不走 router-view；这里补路径只为让
      // useRoute().params 拿到真实参数（流派详情靠 params.id 取数据）
      { path: '/archetypes', component: Blank },
      { path: '/archetypes/:id', component: Blank },
      // 主线详情页靠 params.id 取章节
      { path: '/main-quest', component: Blank },
      { path: '/main-quest/:id', component: Blank },
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

/* ---------- 7. 进度存储层与进度总览 ---------- */
{
  const { createIdStore, exportProgress, importProgress, clearAllProgress, STORAGE_KEYS } =
    await import('../src/composables/progress.js')

  // 每个 store 的 key 都不同，测试时用独立命名，避免互相干扰
  const storeA = createIdStore('er-guide:test-a')
  const storeB = createIdStore('er-guide:test-a')

  check('同一个 key 只会创建一份状态', storeA === storeB, true)
  check('add 返回是否真的写入', [storeA.add('x'), storeA.add('x')], [true, false])
  check('toggle 返回操作后状态', [storeB.toggle('x'), storeB.toggle('x')], [false, true])
  storeA.clear()
  check('clear 清空', storeA.count.value, 0)
  storeA.replace(['a', 'b', 1, null, 'c'])
  check('replace 过滤非字符串', storeA.ids.value, ['a', 'b', 'c'])
  storeA.clear()

  const exported = exportProgress()
  const parsed = JSON.parse(exported)
  check('导出包含版本号', parsed.version, 1)
  check('导出覆盖全部 key', Object.keys(parsed.data).sort(), Object.keys(STORAGE_KEYS).sort())

  const bad = importProgress('not json at all')
  check('导入非 JSON 被拒绝', bad.ok, false)
  check('导入缺少 data 被拒绝', importProgress('{"foo":1}').ok, false)

  const roundtrip = importProgress(JSON.stringify({ site: 'er-guide', data: { main: ['limgrave'], quest: [] } }))
  check('导入合法结构成功', roundtrip.ok, true)
  check('导入后提示包含项数', roundtrip.message.includes('主线进度 1 项'), true)

  clearAllProgress()
  check('清空全部进度', JSON.parse(exportProgress()).data.main, [])

  // 图鉴收藏用 `${moduleKey}:${id}` 做键，同名条目不会被串到一起
  const { useCodexFavorites } = await import('../src/composables/useCodexFavorites.js')
  const codexFav = useCodexFavorites()
  codexFav.clearFavorites()
  codexFav.toggleFavorite('sorceries', '同一条目')
  codexFav.toggleFavorite('incantations', '同一条目')
  check('图鉴收藏按模块隔离', [
    codexFav.isFavorite('sorceries', '同一条目'),
    codexFav.isFavorite('incantations', '同一条目'),
  ], [true, true])
  check('按模块统计收藏', codexFav.countsByModule(['sorceries', 'incantations', 'spirits']), {
    sorceries: 1,
    incantations: 1,
    spirits: 0,
  })
  codexFav.clearFavorites()
  check('清空图鉴收藏', codexFav.favoriteCount.value, 0)

  // 三个旧 composable 现在共用同一套存储，key 必须各归各位
  const { STORAGE_KEYS: keys2 } = await import('../src/composables/progress.js')
  check('四类进度的 key 互不重复', new Set(Object.values(keys2)).size, 4)

  const { default: ProgressView } = await vite.ssrLoadModule('/src/views/ProgressView.vue')
  const progressRouter = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: () => null },
      { path: '/progress', component: ProgressView },
      { path: '/main-quest/:id', component: () => null },
      { path: '/side-quests/:id', component: () => null },
      { path: '/weapons/:id', component: () => null },
    ],
  })
  await progressRouter.push('/progress')
  await progressRouter.isReady()
  const progressApp = createSSRApp(ProgressView)
  progressApp.use(progressRouter)
  const progressHtml = await renderToString(progressApp)

  // 用数据里的章节数，不写死 12 —— 以后补章节不用回来改断言
  const { mainStats: progressMainStats } = await import('../src/data/mainline.js')
  check('SSR 进度页渲染主线章节', (progressHtml.match(/class="check-row/g) || []).length, progressMainStats.total)
  check('SSR 进度页显示四项总览', (progressHtml.match(/class="hero-badge"/g) || []).length, 4)
  check('SSR 进度页有导出入口', progressHtml.includes('下载 JSON'), true)
  check('SSR 进度页有清空确认', progressHtml.includes('清空全部进度'), true)
  check('SSR 进度页统计图鉴收藏', progressHtml.includes('图鉴收藏'), true)
}

/* ---------- 8. 构筑器 ---------- */
{
  const {
    ATTRS,
    DEFAULT_STATS,
    equipLoadFromEndurance,
    maxEquipLoad,
    loadTier,
    enduranceForTier,
    lighterTier,
    loadBonusFromTalismans,
    parseRequirements,
    checkRequirements,
    canTwoHand,
    summarize,
    memoryStatus,
    tierColor,
  } = await import('../src/utils/build.js')

  // 官方负重表抽查：这几个点在游戏里能直接读出来
  const loadTable = [
    [1, 45], [8, 45], [9, 46.6], [15, 56.1], [20, 64.1], [25, 72],
    [30, 77.6], [40, 90.9], [50, 105.2], [60, 120], [80, 140.5], [99, 160],
  ]
  check('耐力 → 负重 与官方表逐点吻合', loadTable.map(([lv]) => equipLoadFromEndurance(lv)), loadTable.map(([, v]) => v))
  check('耐力低于 8 固定 45', equipLoadFromEndurance(3), 45)
  check('耐力超过 99 按 99 算', equipLoadFromEndurance(120), 160)

  const { default: talismansData } = await import('../src/data/talismans.js')
  const pickTalismans = (names) => talismansData.filter((item) => names.includes(item.name))

  // 负重护符按乘法叠加，且必须只认「装备重量上限 / 负重 +N%」这种写法
  const loadTalismans = pickTalismans(['大壶众武护符', '黄金树的恩惠+2', '铜绿圆碟'])
  const bonus = loadBonusFromTalismans(loadTalismans)
  check('负重护符只算真正加负重的那两件', bonus.sources.map((item) => item.name), ['大壶众武护符', '黄金树的恩惠+2'])
  check('负重加成按乘法叠加', Math.round(bonus.multiplier * 10000) / 10000, 1.2852)
  check('铜绿圆碟不被误判为负重加成', loadBonusFromTalismans(pickTalismans(['铜绿圆碟'])).sources, [])
  check('最大负重 = 基础 × 加成', maxEquipLoad(99, loadTalismans).total, 205.6)

  // 档位边界：29 / 30 / 69.9 / 70 / 99.9 / 100
  check('负重档位边界', [
    loadTier(29, 100).key,
    loadTier(30, 100).key,
    loadTier(69.9, 100).key,
    loadTier(70, 100).key,
    loadTier(99.9, 100).key,
    loadTier(100, 100).key,
  ], ['light', 'medium', 'medium', 'heavy', 'heavy', 'overloaded'])
  check('无最大负重时档位未知', loadTier(10, 0).key, 'unknown')
  check('四个档位都有颜色', ['light', 'medium', 'heavy', 'overloaded'].every((key) => /^#[0-9a-f]{6}$/i.test(tierColor(key))), true)
  check('上一档映射', [lighterTier('overloaded'), lighterTier('heavy'), lighterTier('medium'), lighterTier('light')], ['heavy', 'medium', 'light', null])

  // 耐力建议要真的能压进目标档位
  const needMedium = enduranceForTier(60, [], 'medium')
  check('60 负重进中负重所需耐力', needMedium.endurance, 37)
  check('该耐力下确实不到 70%', loadTier(60, needMedium.maxLoad).key, 'medium')
  check('少一级就超出去', loadTier(60, maxEquipLoad(36, []).total).key, 'heavy')
  check('负太重时给 null 而不是瞎猜', enduranceForTier(500, loadTalismans, 'light'), null)
  check('空构筑不需要耐力', enduranceForTier(0, [], 'medium').endurance, 1)

  // 需求解析与检查
  check('法术需求文本解析', parseRequirements('智力 19 / 信仰 10'), { int: 19, fai: 10 })
  check('认不出的属性名不瞎猜', parseRequirements('幸运 30'), {})
  check('空需求返回空对象', parseRequirements(''), {})

  const stats = { ...DEFAULT_STATS }
  check('需求达标判定', checkRequirements(stats, { str: 20, int: 40 }).map((row) => row.ok), [true, false])
  check('缺口数量正确', checkRequirements(stats, { int: 40 }).map((row) => row.gap), [30])
  check('需求为 0 的属性不参与判定', checkRequirements(stats, { fai: 0, arc: 0 }).length, 0)
  // 双手持握：力气 30 视为 45，够到 40 的大剑需求
  check('双手持握按 1.5 倍算力气', checkRequirements({ ...stats, str: 30 }, { str: 40 }, { twoHand: true }).map((row) => row.ok), [true])
  check('不双手持握就够不到', checkRequirements({ ...stats, str: 30 }, { str: 40 }).map((row) => row.ok), [false])
  check('双手持握向下取整', checkRequirements({ ...stats, str: 21 }, { str: 32 }, { twoHand: true }).map((row) => row.have), [31])

  check('弓弩盾牌不能双手持握', ['轻弓', '弩炮', '大盾', '法杖', '圣印记'].map(canTwoHand), [false, false, false, false, false])
  check('近战武器可以双手持握', ['刀', '特大剑', '大曲剑', '拳套'].every((type) => canTwoHand(type)), true)

  // 汇总：重量只看武器与护符，FP 与记忆格只看法术
  const { default: weaponsData } = await import('../src/data/weapons.js')
  const { default: sorceriesData } = await import('../src/data/sorceries.js')
  const pickWeapon = (name) => weaponsData.find((item) => item.name === name)
  const moonveil = pickWeapon('名刀月隐')
  const uchigatana = pickWeapon('打刀')
  const rockSling = sorceriesData.find((item) => item.name === '岩石球')

  check('月隐重量与需求', [moonveil.stats.weight, moonveil.requirements.int], [6.5, 23])
  const sum = summarize({
    weapons: [moonveil, uchigatana],
    talismans: pickTalismans(['大壶众武护符', '魔法师球护符']),
    spells: [rockSling],
  })
  check('汇总总负重', sum.totalWeight, 14.2)
  check('汇总 FP 与记忆格', [sum.spellFp, sum.spellSlots], [18, 1])
  check('空构筑全为 0', summarize({}).totalWeight, 0)

  check('记忆格够用', memoryStatus(3, 8), { used: 3, capacity: 8, ok: true, over: 0 })
  check('记忆格超标', memoryStatus(9, 8), { used: 9, capacity: 8, ok: false, over: 1 })

  // 预设不能指向不存在的东西，属性也不能越界
  const { buildPresets } = await import('../src/data/buildPresets.js')
  const weaponNames = new Set(weaponsData.map((item) => item.name))
  const { default: incantationsData } = await import('../src/data/incantations.js')
  const spellNames = new Set([...sorceriesData, ...incantationsData].map((item) => item.name))
  const talismanNames = new Set(talismansData.map((item) => item.name))

  check('预设武器都存在', buildPresets.every((preset) => (!preset.main || weaponNames.has(preset.main)) && (!preset.off || weaponNames.has(preset.off))), true)
  check('预设护符都存在', buildPresets.every((preset) => preset.talismans.every((name) => talismanNames.has(name))), true)
  check('预设法术都存在', buildPresets.every((preset) => preset.spells.every((name) => spellNames.has(name))), true)
  check('预设护符不超过 4 个', buildPresets.every((preset) => preset.talismans.length <= 4), true)
  check('预设属性齐全且不越界', buildPresets.every((preset) => ATTRS.every((attr) => {
    const value = preset.stats[attr.key]
    return Number.isInteger(value) && value >= 1 && value <= 99
  })), true)
  check('预设 key 不重复', new Set(buildPresets.map((preset) => preset.key)).size, buildPresets.length)

  // SSR 实渲染：默认空构筑要能出结果栏，且不报错
  const { default: BuildView } = await vite.ssrLoadModule('/src/views/BuildView.vue')
  const buildRouter = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: () => null },
      { path: '/build', component: BuildView },
      { path: '/weapons/:id', component: () => null },
      { path: '/runes/:id', component: () => null },
    ],
  })
  await buildRouter.push('/build')
  await buildRouter.isReady()
  const buildApp = createSSRApp(BuildView)
  buildApp.use(buildRouter)
  const buildHtml = await renderToString(buildApp)

  check('SSR 构筑器渲染八个属性', (buildHtml.match(/class="stat-cell"/g) || []).length, 8)
  check('SSR 构筑器渲染四个护符栏位', (buildHtml.match(/class="slot"/g) || []).length >= 6, true)
  check('SSR 构筑器显示默认负重上限', buildHtml.includes('72.0'), true)
  check('SSR 构筑器渲染空态提示', buildHtml.includes('还没装东西'), true)

  // 带参数的构筑：URL → 状态还原，负重与档位要跟着变
  const withBuild = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: () => null },
      { path: '/build', component: BuildView },
      { path: '/weapons/:id', component: () => null },
      { path: '/runes/:id', component: () => null },
    ],
  })
  await withBuild.push({
    path: '/build',
    query: { w: 'moonveil', t: '大壶众武护符', st: '40,25,20,12,20,40,10,10' },
  })
  await withBuild.isReady()
  const builtApp = createSSRApp(BuildView)
  builtApp.use(withBuild)
  const builtHtml = await renderToString(builtApp)

  check('SSR 按 URL 还原主手武器', builtHtml.includes('名刀月隐'), true)
  check('SSR 按 URL 还原护符', builtHtml.includes('大壶众武护符'), true)
  check('SSR 负重随构筑变化', builtHtml.includes('76.3'), true)
  // 智力 40 满足月隐 23，标不应出现在缺口列表里
  check('SSR 满足需求时不列缺口', builtHtml.includes('当前属性满足所有装备的需求'), true)

  // 属性不够时要把缺口列出来
  const gapRouter = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: () => null },
      { path: '/build', component: BuildView },
      { path: '/weapons/:id', component: () => null },
      { path: '/runes/:id', component: () => null },
    ],
  })
  await gapRouter.push({ path: '/build', query: { w: 'moonveil', st: '10,10,10,10,10,5,10,10' } })
  await gapRouter.isReady()
  const gapApp = createSSRApp(BuildView)
  gapApp.use(gapRouter)
  const gapHtml = await renderToString(gapApp)
  check('SSR 属性不足时列出缺口', (gapHtml.match(/class="gap-row"/g) || []).length, 3)
  check('SSR 缺口包含智力', gapHtml.includes('差 18'), true)

  // 护符的 +1 / +2 强化版在 URL 里是 %2B，被中间环节还原成空格后仍要能认回来
  const { parseQuery, stringifyQuery } = await import('vue-router')
  check('护符 +2 能完整往返 URL', parseQuery(stringifyQuery({ t: '黄金树的恩惠+2' })).t, '黄金树的恩惠+2')

  const plusRouter = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: () => null },
      { path: '/build', component: BuildView },
      { path: '/weapons/:id', component: () => null },
      { path: '/runes/:id', component: () => null },
    ],
  })
  await plusRouter.push({ path: '/build', query: { t: '黄金树的恩惠 2', st: '40,10,10,10,10,10,10,10' } })
  await plusRouter.isReady()
  const plusApp = createSSRApp(BuildView)
  plusApp.use(plusRouter)
  const plusHtml = await renderToString(plusApp)
  check('护符名里的 + 变成空格也能认回来', plusHtml.includes('黄金树的恩惠+2'), true)
  check('认回来之后计入负重', plusHtml.includes('1.5'), true)

  // 分享链接里带着已删除的旧 id 时，界面不该凭空多出一件装备
  const staleRouter = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: () => null },
      { path: '/build', component: BuildView },
      { path: '/weapons/:id', component: () => null },
      { path: '/runes/:id', component: () => null },
    ],
  })
  await staleRouter.push({ path: '/build', query: { w: 'not-a-weapon', t: '不存在的护符', s: 'sc:不存在', st: '40,10,10,10,10,10,10,10' } })
  await staleRouter.isReady()
  const staleApp = createSSRApp(BuildView)
  staleApp.use(staleRouter)
  const staleHtml = await renderToString(staleApp)
  check('失效 id 被清掉且不报错', staleHtml.includes('还没装东西'), true)
  check('失效构筑负重归零', staleHtml.includes('0.0'), true)

  // 工具页也进全站搜索：搜「负重」「进度」应该直接给到页面
  const { searchAll: searchTools } = await import('../src/utils/search.js')
  check('搜「负重」能进构筑器', searchTools('负重').some((group) => group.group === 'tools' && group.items[0].to === '/build'), true)
  check('搜「进度」能进进度页', searchTools('进度').some((group) => group.group === 'tools' && group.items[0].to === '/progress'), true)
}

/* ---------- 9. 流派库 ---------- */
{
  const A = await import('../src/utils/archetypes.js')
  const { default: ArchetypesView } = await vite.ssrLoadModule('/src/views/ArchetypesView.vue')
  const { default: ArchetypeView } = await vite.ssrLoadModule('/src/views/ArchetypeView.vue')
  const { default: BuildView } = await vite.ssrLoadModule('/src/views/BuildView.vue')

  const list = A.archetypeList

  // ---- 数据完整性 ----
  check('流派数量', list.length, 10)
  check('流派 id 唯一', new Set(list.map((item) => item.id)).size, list.length)
  check('主属性都在筛选表里', list.every((item) => A.archetypeFilterOptions.primaries.includes(item.primary)), true)
  check('成型阶段合法', list.every((item) => ['starter', 'mid', 'late'].includes(item.stage)), true)
  check('难度在 1–5 之间', list.every((item) => item.difficulty >= 1 && item.difficulty <= 5), true)
  check('护符不超过四个栏位', list.every((item) => item.items.talismans.length <= 4), true)
  check('每套都有主手武器', list.every((item) => Boolean(item.items.main)), true)
  check('每套都有成型路线与加点计划', list.every((item) => item.phases.length >= 2 && item.statPlan.length >= 2), true)
  check('每套都写了优点、短板与误区', list.every((item) => item.pros.length > 0 && item.cons.length > 0 && item.mistakes.length > 0), true)

  // 装备缺失位置 / 说明是最容易在补数据时漏掉的：漏了页面就会空一块
  const allGear = list.flatMap((item) => [
    ...item.items.weapons,
    ...item.items.talismans,
    ...item.items.spells,
    ...(item.items.spirit ? [item.items.spirit] : []),
  ])
  check('每件核心装备都解析到了', allGear.every((gear) => Boolean(gear.name && gear.to)), true)
  check('每件核心装备都有获取位置', allGear.every((gear) => Boolean(gear.location)), true)
  check('每件核心装备都有数值说明', allGear.every((gear) => Boolean(gear.effect) || Boolean(gear.note)), true)

  // ---- 派生计算：不能和原始表对不上 ----
  const weightOf = (item) =>
    Math.round(
      ([...item.items.weapons, ...item.items.talismans].reduce((sum, gear) => sum + gear.weight, 0)) * 10
    ) / 10
  check('负重 = 逐件相加', list.map((item) => item.load.weight), list.map(weightOf))
  check(
    '留给护甲 = 上限 - 装备负重',
    list.map((item) => item.load.armorRoom),
    list.map((item) => Math.round((item.load.max - item.load.weight) * 10) / 10)
  )
  check('记忆格与法术表一致', A.archetypeDetail('comet-azur').load.spellSlots, 5)
  check('FP 与法术表一致', A.archetypeDetail('comet-azur').load.spellFp, 65)

  // ---- 筛选 ----
  check('按主属性筛选', A.filterArchetypes({ primary: '智力' }).length, list.filter((item) => item.primary === '智力').length)
  check('按阶段筛选开局速成', A.filterArchetypes({ stage: 'starter' }).length, list.filter((item) => item.stage === 'starter').length)
  check('关键词命中跳劈流', A.filterArchetypes({ keyword: '跳劈' }).map((item) => item.id), ['greatsword-jump'])
  check('关键词能搜到核心武器', A.filterArchetypes({ keyword: '岩石球' }).length > 0, true)
  check('筛不到时返回空数组', A.filterArchetypes({ keyword: '不存在的流派' }).length, 0)

  // ---- 带进构筑器 ----
  const link = A.buildLinkOf(A.archetypeDetail('bleed-dual'))
  check('链接带主手与副手 id', [link.query.w, link.query.o], ['rivers-of-blood', 'uchigatana'])
  check('护符用逗号串而不是重复 key', link.query.t.split(',').length, 4)
  check('属性是八段', link.query.st.split(',').length, 8)
  check(
    '法术值带 sc/inc 前缀',
    A.buildLinkOf(A.archetypeDetail('moonveil'))
      .query.s.split(',')
      .every((value) => /^(sc|inc):/.test(value)),
    true
  )

  // 最关键的一致性：从流派页带进构筑器，负重必须一模一样
  const buildRoutes = [
    { path: '/', component: () => null },
    { path: '/build', component: BuildView },
    { path: '/archetypes', component: () => null },
    { path: '/archetypes/:id', component: () => null },
    { path: '/weapons/:id', component: () => null },
    { path: '/runes/:id', component: () => null },
    { path: '/sorceries/:id', component: () => null },
    { path: '/incantations/:id', component: () => null },
    { path: '/spirits/:id', component: () => null },
  ]

  async function renderBuildOf(archetypeId) {
    const detail = A.archetypeDetail(archetypeId)
    const buildLink = A.buildLinkOf(detail)
    const router = createRouter({ history: createMemoryHistory(), routes: buildRoutes })
    await router.push({ path: '/build', query: buildLink.query })
    await router.isReady()
    const app = createSSRApp(BuildView)
    app.use(router)
    const rendered = await renderToString(app)
    const text = rendered.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    const matched = text.match(/([\d.]+) \/ ([\d.]+) \d+%/)
    return { detail, weight: matched ? Number(matched[1]) : null, max: matched ? Number(matched[2]) : null }
  }

  for (const id of ['bleed-dual', 'moonveil', 'greatsword-jump', 'dragon-communion']) {
    const built = await renderBuildOf(id)
    check(`带进构筑器后负重一致（${built.detail.name}）`, built.weight, built.detail.load.weight)
    check(`带进构筑器后负重上限一致（${built.detail.name}）`, built.max, built.detail.load.max)
  }

  // ---- SSR 实渲染 ----
  const archetypeListHtml = await renderView(ArchetypesView, '/archetypes')
  check('SSR 流派列表渲染全部卡片', (archetypeListHtml.match(/class="card"/g) || []).length, 10)
  check('SSR 列表显示属性合计', archetypeListHtml.includes('套流派'), true)

  const filteredHtml = await renderView(ArchetypesView, { path: '/archetypes', query: { attr: '智力' } })
  check('SSR 按主属性筛选生效', (filteredHtml.match(/class="card"/g) || []).length, 4)
  const emptyHtml = await renderView(ArchetypesView, { path: '/archetypes', query: { q: '不存在的流派' } })
  check('SSR 搜不到时给空态与清空按钮', emptyHtml.includes('没有匹配的流派') && emptyHtml.includes('清空筛选'), true)

  const detailHtml = await renderView(ArchetypeView, '/archetypes/bleed-dual')
  check('SSR 详情页渲染装备卡（主副手 + 4 护符 + 骨灰）', (detailHtml.match(/class="gear-card"/g) || []).length, 7)
  check('SSR 详情页渲染三个阶段', (detailHtml.match(/class="phase"/g) || []).length, 3)
  check('SSR 详情页有带进构筑器的链接', /href="\/build\?w=rivers-of-blood/.test(detailHtml), true)
  check('SSR 详情页有打法循环与误区', detailHtml.includes('打法循环') && detailHtml.includes('常见误区'), true)
  check('SSR 详情页上下篇都能点', (detailHtml.match(/class="neighbor /g) || []).length, 2)

  const cometHtml = await renderView(ArchetypeView, '/archetypes/comet-azur')
  check('SSR 法系流派显示记忆格与 FP', cometHtml.includes('5') && cometHtml.includes('65 FP'), true)

  const missHtml = await renderView(ArchetypeView, '/archetypes/no-such-build')
  check('SSR 不存在的流派给空态', missHtml.includes('没有这套流派'), true)

  // ---- 与已有模块的连通 ----
  const { searchAll: searchArchetypes } = await import('../src/utils/search.js')
  check('全站搜索能搜到流派', searchArchetypes('跳劈').some((group) => group.group === 'archetypes'), true)
  check('搜流派名落到详情页', searchArchetypes('龙飨龙息').flatMap((group) => group.items).some((item) => item.to === '/archetypes/dragon-communion'), true)
  check('主属性配色全覆盖', A.archetypeFilterOptions.primaries.every((name) => /^#[0-9a-f]{6}$/i.test(A.primaryColor(name))), true)
}

/* ---------- 10. 主线 DLC 覆盖 ---------- */
{
  const { default: mainChapters, mainStats } = await import('../src/data/mainline.js')
  const { chapterNeighbors, getChapter } = await import('../src/utils/mainline.js')
  const { default: remembrances } = await import('../src/data/remembrances.js')
  const { default: quests } = await import('../src/data/quests.js')
  const { default: regions } = await import('../src/data/regions.js')
  const { default: MainlineView } = await vite.ssrLoadModule('/src/views/MainlineView.vue')
  const { default: MainlineDetailView } = await vite.ssrLoadModule('/src/views/MainlineDetailView.vue')

  const dlcChapters = mainChapters.filter((chapter) => chapter.dlc)
  const sideChapters = mainChapters.filter((chapter) => chapter.sideTrack)

  check('主线章节总数', mainChapters.length, 14)
  check('DLC 章节数', dlcChapters.length, 6)
  check('DLC 可选章节数', sideChapters.length, 2)
  check('可选章节都是 DLC', sideChapters.every((chapter) => chapter.dlc), true)
  check(
    '可选章节的 BOSS 都不是必打',
    sideChapters.every((chapter) => (chapter.bosses || []).every((boss) => !boss.required)),
    true
  )

  // 最关键的一条：DLC 的追忆 BOSS 必须都能在主线里找到。
  // 之前有 5 个追忆 BOSS 在主线里一次都没出现，玩家按主线走会漏掉一半追忆。
  const blob = JSON.stringify(mainChapters)
  const dlcRemembrances = remembrances.filter((entry) => entry.dlc)
  check('DLC 追忆总数', dlcRemembrances.length, 10)
  check(
    '每个 DLC 追忆 BOSS 都在主线出现',
    dlcRemembrances.filter((entry) => !blob.includes(entry.boss)).map((entry) => entry.boss),
    []
  )

  // 三条翻页链互不串味：本体、DLC 主线、DLC 可选
  check('本体终章没有下一章', chapterNeighbors(getChapter('ashen')).next, null)
  check('DLC 主线终章没有下一章', chapterNeighbors(getChapter('dlc-enir')).next, null)
  check('可选链首章没有上一章', chapterNeighbors(sideChapters[0]).prev, null)
  check('可选链两章相连', chapterNeighbors(sideChapters[0]).next.id, sideChapters[1].id)
  check('兜底：盖利德仍在本体链里', chapterNeighbors(getChapter('caelid')).next.id, 'altus')

  // 区域反链：区域页点「所属章节」不能指向不存在的 id
  const chapterIds = new Set(mainChapters.map((chapter) => chapter.id))
  check(
    '区域引用的章节都存在',
    regions.flatMap((region) =>
      (region.chapters || []).filter((id) => !chapterIds.has(id)).map((id) => `${region.id}->${id}`)
    ),
    []
  )
  check(
    'DLC 区域全部有章节归属',
    regions.filter((region) => region.dlc && !(region.chapters || []).length).map((region) => region.id),
    []
  )

  // 支线引用
  const questIds = new Set(quests.map((quest) => quest.id))
  const badRefs = [...new Set(mainChapters.flatMap((chapter) => chapter.relatedQuests || []))].filter(
    (id) => !questIds.has(id)
  )
  check('主线引用的支线都存在', badRefs, [])
  check(
    'DLC 支线全部挂上了章节',
    quests
      .filter(
        (quest) => quest.dlc && !mainChapters.some((chapter) => (chapter.relatedQuests || []).includes(quest.id))
      )
      .map((quest) => quest.id),
    []
  )

  // 名称统一：全站其余位置都是「蕾菈娜」
  check('不再出现旧译名「蕾拉娜」', blob.includes('蕾拉娜'), false)

  // 贝瑞特不再是「可选支线」—— 它掉的头部是角人老妪线刚需，标成可选会让人直接跳过
  const gravesite = getChapter('dlc-gravesite')
  const beret = gravesite.steps.find((step) => step.place.includes('贝瑞特'))
  check('贝瑞特步骤不再写「可选支线」', beret.title.includes('可选支线'), false)

  // SSR 实渲染
  const listHtml = await renderView(MainlineView, { path: '/main-quest' })
  check('SSR 主线列表渲染全部章节', (listHtml.match(/class="chapter-card/g) || []).length, mainStats.total)
  check('SSR 列表里出现可选标记', listHtml.includes('optional-tag'), true)

  const southHtml = await renderView(MainlineDetailView, '/main-quest/dlc-optional-south')
  check('SSR 可选章节同时标 DLC 与可选', southHtml.includes('DLC 黄金树幽影') && southHtml.includes('可选章节'), true)
  check('SSR 可选章节显示章节号', southHtml.includes('第 14 章'), true)
  check('SSR 南线渲染 8 步', (southHtml.match(/class="step-title"/g) || []).length, 8)
  check('SSR 南线有关联支线', southHtml.includes('尤弥尔') && southHtml.includes('托莉娜'), true)

  const eastHtml = await renderView(MainlineDetailView, '/main-quest/dlc-optional-east')
  check('SSR 东线渲染 8 步', (eastHtml.match(/class="step-title"/g) || []).length, 8)
  check('SSR 东线提到魅惑失效', eastHtml.includes('魅惑'), true)
}

/* ---------- 11. 门户页 / 游戏板块 / 摄影板块 ---------- */
{
  const { default: PortalView } = await vite.ssrLoadModule('/src/views/PortalView.vue')
  const { default: GameHomeView } = await vite.ssrLoadModule('/src/views/GameHomeView.vue')
  const { default: PhotoView } = await vite.ssrLoadModule('/src/views/PhotoView.vue')

  const portalHtml = await renderView(PortalView, '/')
  check('门户页渲染两个板块卡片', (portalHtml.match(/class="[^"]*\bportal-card\b/g) || []).length, 2)
  check('门户页能进游戏板块', portalHtml.includes('href="/game"'), true)
  check('门户页能进摄影板块', portalHtml.includes('href="/photo"'), true)

  // 原首页整体搬到 /game，卡片数量不变
  const gameHtml = await renderView(GameHomeView, '/game')
  check('游戏板块保留原首页 12 张卡片', (gameHtml.match(/class="board-card"/g) || []).length, 12)

  const photoHtml = await renderView(PhotoView, '/photo')
  check(
    '摄影页有拍照 / 上传 / 开始分析三个按钮',
    ['拍照', '上传图片', '开始分析'].every((label) => photoHtml.includes(label)),
    true
  )
  check('摄影页未选图时给空态', photoHtml.includes('还没有图片'), true)
  check('摄影页有选择模型入口', photoHtml.includes('选择模型'), true)
  check('摄影页有查看日志入口', photoHtml.includes('查看日志'), true)
  check('摄影页未保存配置时提示先选模型', photoHtml.includes('还没选择模型'), true)
  check('摄影页开始分析按钮初始禁用', /<button[^>]*disabled/.test(photoHtml), true)
  check('摄影页分析结果默认不渲染', photoHtml.includes('分析结果'), false)

  // 模型与提示词是产品定义，改名 / 删段都会让分析结构对不上
  const { AI_CONFIG, ANALYSIS_PROMPT } = await import('../src/config/ai.js')
  // 1500 会在「具体问题」之后耗尽预算，「优化建议」整段消失
  check('max_tokens 留足余量', AI_CONFIG.maxTokens >= 2048, true)
  check(
    '提示词含四个小节',
    ['### 整体评价', '### 具体问题', '### 优化建议', '### 图像编辑提示词（英文）'].every((h) => ANALYSIS_PROMPT.includes(h)),
    true
  )
  // 接口地址 / Key / 模型名已经搬到页面上，源码里不能再残留默认 key
  check('源码不再内置接口地址', 'baseUrl' in AI_CONFIG, false)
  check('源码不再内置 API Key', 'apiKey' in AI_CONFIG, false)

  const { parseAnalysis } = await import('../src/utils/ai.js')
  const sample = [
    '### 整体评价',
    '画面干净，但**缺少明确主体**。',
    '### 具体问题',
    '- 地平线略歪',
    '- 前景偏空',
    '### 优化建议',
    '1. 降低机位',
    '### 图像编辑提示词（英文）',
    '```',
    'Keep the subject centered, lift shadows, warm the highlights.',
    '```',
  ].join('\n')
  const parsed = parseAnalysis(sample)
  check('分析结果拆成四个小节', parsed.sections.map((s) => s.title), [
    '整体评价',
    '具体问题',
    '优化建议',
    '图像编辑提示词（英文）',
  ])
  check('连续要点合并成一个列表块', parsed.sections[1].blocks.map((b) => b.kind), ['list'])
  check('列表项数', parsed.sections[1].blocks[0].items.length, 2)
  check('数字序号也识别成列表', parsed.sections[2].blocks[0].kind, 'list')
  check('行内加粗被清掉', parsed.sections[0].blocks[0].text, '画面干净，但缺少明确主体。')
  check('英文提示词单独抽出', parsed.promptText, 'Keep the subject centered, lift shadows, warm the highlights.')
  check('提示词小节被标记', parsed.sections[3].isPrompt, true)
  check('没有提示词小节时为空串', parseAnalysis('### 整体评价\n还行').promptText, '')

  // 模型不写 ### 时，靠小节名兜底；但正文里的「优化建议：xxx」不能被当成标题
  const loose = parseAnalysis('整体评价\n画面干净。\n**优化建议**\n- 机位压低')
  check('缺 ### 的标题也能识别', loose.sections.map((s) => s.title), ['整体评价', '优化建议'])
  check('列表被正确挂到兜底小节下', loose.sections[1].blocks[0].kind, 'list')
  check(
    '正文里的「建议：」不当标题',
    parseAnalysis('### 具体问题\n- 优化建议：压低机位').sections.length,
    1
  )
  check('缺段会被标出来', parseAnalysis('### 整体评价\n还行').missing, ['具体问题', '优化建议', '图像编辑提示词'])
  check('四段齐全时 missing 为空', parsed.missing, [])

  /* ---- 接口配置：页面上填写并保存后才可用 ---- */
  {
    const store = new Map()
    globalThis.window = {
      localStorage: {
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => store.set(key, String(value)),
        removeItem: (key) => store.delete(key),
      },
    }

    const { useAISettings, validateSettings, AI_STORAGE_KEY } = await import(
      '../src/composables/useAISettings.js'
    )
    const ai = useAISettings()
    ai.clear()
    check('初始状态未配置', ai.isReady.value, false)

    check('缺 URL 校验不通过', validateSettings({ baseUrl: '', apiKey: 'k', model: 'm' }).length > 0, true)
    check('非 http 地址被拒', validateSettings({ baseUrl: 'api.x.com', apiKey: 'k', model: 'm' }).includes('http'), true)
    check(
      '三项齐全才通过校验',
      validateSettings({ baseUrl: 'https://a.com/v1/chat/completions', apiKey: 'k', model: 'm' }),
      ''
    )

    check('只填两项保存会失败', ai.save({ baseUrl: 'https://a.com', apiKey: 'k', model: '' }).length > 0, true)
    check('保存失败后仍不可用', ai.isReady.value, false)

    check(
      '三项齐全保存成功',
      ai.save({ baseUrl: ' https://a.com/v1/chat/completions ', apiKey: ' sk-1 ', model: ' m ' }),
      ''
    )
    check('保存后立即可用', ai.isReady.value, true)
    check('保存时去掉首尾空格', ai.settings.value, {
      baseUrl: 'https://a.com/v1/chat/completions',
      apiKey: 'sk-1',
      model: 'm',
    })
    check('写入了 localStorage', JSON.parse(store.get(AI_STORAGE_KEY)).model, 'm')

    ai.clear()
    check('清除后回到未配置', [ai.isReady.value, store.has(AI_STORAGE_KEY)], [false, false])

    // 刷新页面：新的模块实例应当从 localStorage 读回上次保存的配置
    store.set(AI_STORAGE_KEY, JSON.stringify({ baseUrl: 'https://b.com', apiKey: 'k2', model: 'm2' }))
    const reloaded = await import('../src/composables/useAISettings.js?reload=1')
    check('刷新后自动恢复配置', reloaded.useAISettings().settings.value.model, 'm2')

    delete globalThis.window
  }

  /* ---- 请求日志：脱敏、图片摘要、条数上限、持久化 ---- */
  {
    const store = new Map()
    globalThis.window = {
      sessionStorage: {
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => store.set(key, String(value)),
        removeItem: (key) => store.delete(key),
      },
    }

    const logs = await import('../src/utils/aiLog.js?logs=1')

    // 完整 key 绝不能出现在日志里
    const masked = logs.maskSecret('sk-034d4d561a25412da6a5b22c0c15393b')
    check('长 Key 只留首尾', masked, 'sk-034…393b')
    check('脱敏后不含原始 Key', masked.includes('4d561a25412da6a5b22c0c15393b'), false)
    check('短 Key 全掩码', logs.maskSecret('abc'), '***')

    // 图片 base64 有几 MB，日志里只留前缀与体积
    const preview = logs.previewImageUrl('data:image/jpeg;base64,' + 'A'.repeat(4096))
    check('图片摘要保留 mime 前缀', preview.startsWith('data:image/jpeg;base64,…'), true)
    check('图片摘要标注体积', preview.includes('3.0 KB'), true)
    check('图片摘要不含原始 base64', preview.includes('AAAA'), false)

    check('超长响应被截断', logs.clipText('x'.repeat(300), 100).includes('原文共 300 字符'), true)
    check('未超长的响应原样保留', logs.clipText('ok', 100), 'ok')
    check(
      'Headers 对象可序列化',
      logs.headersToObject({ forEach: (fn) => fn('application/json', 'content-type') }),
      { 'content-type': 'application/json' }
    )

    logs.clearLogs()
    check('初始没有日志', logs.getLogs().length, 0)

    logs.appendLog({ model: 'm1', durationMs: 900, request: { method: 'POST', url: 'https://a.com', headers: {}, body: '{}' } })
    check('追加后有一条', logs.getLogs().length, 1)
    check('最新的一条在最前', logs.getLogs()[0].model, 'm1')
    check('写入 sessionStorage', store.has('er-guide:ai-logs'), true)

    for (let index = 0; index < logs.MAX_LOGS + 5; index += 1) {
      logs.appendLog({ model: `m${index}`, request: { method: 'POST', url: 'https://a.com', headers: {}, body: '{}' } })
    }
    check('超出上限后只留最近 30 条', logs.getLogs().length, logs.MAX_LOGS)
    check('被挤掉的是最旧的', logs.getLogs().some((entry) => entry.model === 'm1'), false)

    const entry = logs.appendLog({
      model: 'm-final',
      durationMs: 1234,
      request: {
        method: 'POST',
        url: 'https://a.com/v1/chat/completions',
        headers: { Authorization: `Bearer ${logs.maskSecret('sk-034d4d561a25412da6a5b22c0c15393b')}` },
        body: '{"model":"m-final"}',
      },
      response: { status: 200, statusText: 'OK', headers: {}, body: '{"choices":[]}' },
    })
    const text = logs.formatLog(entry)
    check('导出文本含请求行', text.includes('POST https://a.com/v1/chat/completions'), true)
    check('导出文本含响应状态', text.includes('HTTP 200 OK'), true)
    check('导出文本不含完整 Key', text.includes('4d561a25412da6a5b22c0c15393b'), false)

    logs.clearLogs()
    check('清空后回到 0 条', [logs.getLogs().length, store.has('er-guide:ai-logs')], [0, true])

    // 弹窗真的能把日志渲染出来，而不是只有一个按钮。
    // 注意必须用 vite 模块图里的 aiLog 实例：组件读的是它，不是上面原生 import 的那份。
    const viteLogs = await vite.ssrLoadModule('/src/utils/aiLog.js')
    viteLogs.clearLogs()
    viteLogs.appendLog({
      model: 'm-render',
      durationMs: 1500,
      request: {
        method: 'POST',
        url: 'https://a.com/v1/chat/completions',
        headers: { Authorization: 'Bearer sk-034…393b' },
        body: '{\n  "model": "m-render"\n}',
      },
      image: { mime: 'image/jpeg', bytes: 2048, width: 1600, height: 1067, shrunk: true },
      response: { status: 200, statusText: 'OK', headers: {}, body: '{"choices":[]}' },
    })
    const { default: AILogsDialog } = await vite.ssrLoadModule('/src/components/AILogsDialog.vue')
    const ctx = {}
    await renderToString(createSSRApp(AILogsDialog, { open: true }), ctx)
    const bodyHtml = ctx.teleports?.body || ''
    check('弹窗渲染出标题', bodyHtml.includes('请求日志'), true)
    check('弹窗渲染出选中条目的请求行', bodyHtml.includes('POST https://a.com/v1/chat/completions'), true)
    check('弹窗显示图片摘要而不是 base64', bodyHtml.includes('发送前已压缩'), true)
    check('弹窗显示响应状态', bodyHtml.includes('HTTP 200 OK'), true)

    const closedHtml = await renderToString(createSSRApp(AILogsDialog, { open: false }), {})
    check('未打开时不渲染内容', closedHtml.includes('请求日志'), false)

    viteLogs.clearLogs()

    delete globalThis.window
  }
}

await vite.close()

console.log(failed ? `\n${failed} 项未通过` : '\n全部通过')
process.exit(failed ? 1 : 0)
