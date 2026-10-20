# 艾尔登法环 · 攻略站

基于 Vue 3 + Element Plus + Vite 的《艾尔登法环》中文攻略站，目前完成**武器图鉴**与**支线任务**模块。

## 功能

### 支线任务

- **收录 51 条 NPC 支线**：本体 37 条 + DLC「黄金树幽影」14 条，标注 36 条易错过节点
- **全部完成全流程整理**：51 条均含分步流程、前置条件、奖励与分支对照，共 300+ 个步骤、160+ 条分支说明
- **多维筛选**：关键词搜索（NPC / 区域 / 奖励 / 步骤文本）、区域筛选、本体/DLC 切换、仅看易错过、按完成状态过滤
- **流程详情**：分步时间轴、每步地点与注意事项、分支与结局对照、前置条件、奖励、关联支线、同区域支线、上下条翻页
- **本地进度**：`localStorage` 记录已完成支线，列表页显示「我的进度」

### 武器图鉴

- **武器图鉴**：收录 116 件武器，覆盖本体 32 类与 DLC「黄金树幽影」新增 8 类，共 40 个武器类型
- **多维筛选**：关键词搜索（名称/战技/玩法/异常状态）、类型分组筛选、补正属性、异常状态（出血/冻伤/黑焰）、DLC / 收藏夹开关
- **双视图**：卡片视图与表格视图切换，支持按名称、物理面板、补正总和、重量排序
- **武器详情**：面板速览、攻击力条形图、补正与需求对照、战技说明、玩法要点、推荐配装、获取位置、同类武器速跳与上下翻页
- **本地收藏**：`localStorage` 持久化，列表页与详情页共享状态

## 技术栈

| 依赖 | 版本 |
| --- | --- |
| Vue | 3.4 |
| Vue Router | 4 |
| Element Plus | 2.x |
| Vite | 5.x |

## 开发

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 产物输出到 dist/
npm run preview  # 预览构建产物
```

## 部署到 GitHub Pages

本项目是 SPA 且使用 history 路由，部署到子路径时需要指定 base：

```bash
BASE_PATH=/static-site-demo/ npm run build
```

`vite.config.js` 会读取 `BASE_PATH` 环境变量作为 `base`，路由同步使用 `import.meta.env.BASE_URL`。
注意：history 路由在 Pages 上直接访问 `/weapons` 这类深链接会 404，需要用 404.html 重写或改用 hash 路由。

## 构建与性能

页面与数据量增长后，单文件 bundle 会一路膨胀（曾达到 1.4MB），因此做了三层拆分：

1. **路由级懒加载**：`router/index.js` 全部使用 `() => import(...)`，各页面与它依赖的数据文件被拆成独立 chunk，首屏只加载首页需要的代码。
2. **Element Plus 按需引入**：`unplugin-vue-components` + `ElementPlusResolver` 只打包模板里实际用到的 `el-*` 组件（配合 `el-config-provider` 注入中文语言包）；图标改为在组件内显式 `import`，不再整包注册。
3. **首页统计与数据解耦**：首页只需要几个数字，改由 `scripts/gen-summary.mjs` 在 `predev` / `prebuild` 阶段从数据文件生成 `src/data/summary.js`，首页不再把整份武器 / 支线数据拉进首屏。

效果（未压缩 / gzip）：

| 指标 | 优化前 | 优化后 |
| --- | --- | --- |
| 最大单文件 | 1424 KB | 166 KB |
| 首屏 JS | 1424 KB / ~380 KB | 316 KB / 117 KB |

> 修改 `src/data/weapons.js` 或 `quests.js` 后，`npm run dev` / `npm run build` 会自动重新生成 `summary.js`；单独跑 `node scripts/gen-summary.mjs` 也可以。

## 目录结构

```
scripts/             # 构建期脚本（生成首页统计）
src/
├── composables/     # 组合式函数（收藏夹、支线进度等）
├── data/            # 静态数据（武器图鉴、支线、自动生成的统计）
├── router/          # 路由配置（懒加载）
├── utils/           # 通用工具（补正换算、筛选匹配等）
├── views/           # 页面视图
└── assets/          # 全局样式
```

## 说明

武器面板数值均为游戏内未强化基础值，整理自公开攻略资料，仅供配装参考；盾牌不计攻击力。
