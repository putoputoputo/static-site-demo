import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

// 页脚的版本标签要能回答「线上跑的到底是哪一次构建」：版本号 + 提交号 + 构建时间。
// CI 里 GITHUB_SHA 一定有；本地构建退回 git；都取不到就留空，不编造。
function readCommit() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

const pad = (value) => String(value).padStart(2, '0')

// 统一用 UTC 并标注出来：CI 构建机是 UTC，访客可能在任意时区，
// 不带时区的时间戳对不上构建日志。
function buildStamp(date) {
  const day = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
  const clock = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  return `${day} ${clock} UTC`
}

export default defineConfig(({ command }) => {
  // dev 下没有「构建时间」可言，留空让页脚只显示「开发版」，避免把启动时间当成部署时间
  const isServe = command === 'serve'

  return {
    // 部署到 GitHub Pages 子路径时通过 BASE_PATH 指定，例如 BASE_PATH=/static-site-demo/
    base: process.env.BASE_PATH || '/',
    plugins: [
      vue(),
      // Element Plus 按需引入：只打包模板里实际用到的 el-* 组件
      // 样式仍由 main.js 统一引入整包 CSS，避免漏样式
      Components({
        resolvers: [ElementPlusResolver({ importStyle: false })],
        dts: false,
      }),
    ],
    define: {
      // 只注入 import.meta.env.*：dev 下 Vite 会把 import.meta.env 赋成对象，
      // 自定义全局标识符（__APP_VERSION__ 之类）不会被替换，取到的是 undefined。
      'import.meta.env.APP_VERSION': JSON.stringify(pkg.version),
      'import.meta.env.APP_COMMIT': JSON.stringify(readCommit()),
      'import.meta.env.APP_BUILD_TIME': JSON.stringify(isServe ? '' : buildStamp(new Date())),
      'import.meta.env.APP_DEV': JSON.stringify(isServe),
    },
    build: {
      // 拆分后单个 chunk 超过 500KB 时给出提示，阈值放宽到 600KB
      chunkSizeWarningLimit: 600,
    },
  }
})
