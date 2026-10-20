import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'
import weapons from './src/data/weapons.js'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })

const dlc = weapons.filter((w) => w.dlc).length
const base = weapons.length - dlc

async function render(path, file) {
  const mod = await server.ssrLoadModule(file)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/weapons', component: { template: '<div/>' } },
      { path: '/weapons/:id', component: { template: '<div/>' } },
    ],
  })
  router.push(path)
  await router.isReady()
  const app = createSSRApp(mod.default)
  app.use(router)
  const html = await renderToString(app)
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
  return { html, text }
}

const must = (cond, msg) => { if (!cond) throw new Error(msg) }
try {
  const list = await render('/weapons', '/src/views/WeaponsView.vue')
  must(list.text.includes('版本'), '缺少「版本」筛选行')
  must(list.text.includes('全部'), '缺少「全部」选项')
  must(list.text.includes('本体'), '缺少「本体」选项')
  must(list.text.includes('DLC'), '缺少「DLC」选项')
  must(list.text.includes(String(base)), `本体计数 ${base} 未出现`)
  must(list.text.includes(String(dlc)), `DLC 计数 ${dlc} 未出现`)
  const dlcButtons = (list.html.match(/class="[^"]*chip[^"]*"[^>]*>\s*DLC/g) || []).length
  console.log('total', weapons.length, '| base', base, '| dlc', dlc)
  console.log('has version row:', list.text.includes('版本'))
  console.log('chip DLC buttons found:', dlcButtons)
  console.log('chars', list.html.length)
  console.log('ASSERT PASS')
} catch (err) {
  console.error('FAIL:', err.message)
  process.exitCode = 1
} finally {
  await server.close()
}
