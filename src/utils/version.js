// 构建信息：版本号、提交号、构建时间。
//
// 由 vite.config.js 通过 define 注入。这里必须走 import.meta.env.*，
// 不能用自定义全局变量（例如 __APP_VERSION__）：Vite 在 dev 下只会把
// import.meta.env 赋成一个对象，自定义标识符原样保留，运行时就是 undefined。
//
// Node 环境（回归脚本）里 import.meta.env 不存在，所以统一兜底，保证 import 不报错。

const ENV = import.meta.env || {}

export const APP_VERSION = ENV.APP_VERSION || '0.0.0'
export const APP_COMMIT = ENV.APP_COMMIT || ''
export const APP_BUILD_TIME = ENV.APP_BUILD_TIME || ''
export const IS_DEV_BUILD = Boolean(ENV.APP_DEV)

// 页脚那一行：v0.1.0 · 65f03d1 · 2026-10-28 05:21 UTC
export const APP_LABEL = IS_DEV_BUILD
  ? `v${APP_VERSION} · 开发版`
  : [`v${APP_VERSION}`, APP_COMMIT, APP_BUILD_TIME].filter(Boolean).join(' · ')

// 悬停提示：拆分说明每个值的含义，部署对不上时先看这里
export const APP_TITLE = IS_DEV_BUILD
  ? `版本 ${APP_VERSION}\n本地开发模式，不是部署构建`
  : [
      `版本 ${APP_VERSION}`,
      APP_COMMIT && `提交 ${APP_COMMIT}`,
      APP_BUILD_TIME && `构建于 ${APP_BUILD_TIME}`,
    ]
      .filter(Boolean)
      .join('\n')
