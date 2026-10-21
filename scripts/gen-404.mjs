/**
 * 生成 public/404.html。
 *
 * GitHub Pages 是静态托管，直接访问 /weapons/moonveil 这类深链接会拿到 404.html，
 * 而不是 index.html。这里的做法是：404.html 先把真实路径存进 sessionStorage，
 * 再跳回站点根；应用启动时（router 创建之前）把地址 replaceState 回去，
 * 用户感知不到中间的跳转，深链接也就"能用"了。
 *
 * base 必须在构建期注入，因为 404.html 无法从自身 URL 推导部署子路径。
 * 运行：node scripts/gen-404.mjs（已挂到 predev / prebuild）
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function normalizeBase(raw) {
  let base = (raw || '/').trim()

  // Git Bash 会把 BASE_PATH=/static-site-demo/ 当成路径做转换，
  // 变成 /D:/workbuddy/.../static-site-demo/。这里兜底取最后一段并给出警告，
  // 正确的做法是加 MSYS_NO_PATHCONV=1 前缀。
  if (/^\/[A-Za-z]:\//.test(base)) {
    const segments = base.split('/').filter(Boolean)
    base = `/${segments[segments.length - 1]}/`
    console.warn(`[gen-404] BASE_PATH 被 shell 路径转换污染，已回退为 ${base}；建议加 MSYS_NO_PATHCONV=1`)
  }

  if (!base.startsWith('/')) base = `/${base}`
  if (!base.endsWith('/')) base = `${base}/`
  return base
}

const base = normalizeBase(process.env.BASE_PATH)

const html = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>艾尔登法环攻略站</title>
    <meta name="robots" content="noindex" />
    <style>
      html,
      body {
        margin: 0;
        height: 100%;
        background: #121212;
        color: #8a8574;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
      }
      .wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        font-size: 13px;
        letter-spacing: 1px;
      }
    </style>
  </head>
  <body>
    <div class="wrap">正在前往交界地…</div>
    <script>
      ;(function () {
        var base = '${base}'
        var basePath = base.replace(/\\/$/, '')
        var path = location.pathname + location.search + location.hash

        // 去掉部署子路径前缀，得到应用内路径（/weapons/moonveil）
        if (basePath && path.indexOf(basePath) === 0) {
          path = path.slice(basePath.length) || '/'
        }
        if (path.charAt(0) !== '/') path = '/' + path

        try {
          sessionStorage.setItem('er-guide:spa-redirect', path)
        } catch (error) {
          // 隐私模式下 sessionStorage 可能不可用，此时退化为回首页
        }

        location.replace(base)
      })()
    </script>
  </body>
</html>
`

const output = resolve(root, 'public/404.html')
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, html, 'utf8')

console.log(`[gen-404] public/404.html（base=${base}）`)
