# 艾尔登法环 · 攻略站

基于 Vue 3 + Element Plus + Vite 的《艾尔登法环》中文攻略站，目前完成**武器图鉴**模块。

## 功能

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

## 目录结构

```
src/
├── composables/     # 组合式函数（收藏夹等）
├── data/            # 静态数据（武器图鉴）
├── router/          # 路由配置
├── utils/           # 通用工具（补正换算、筛选匹配等）
├── views/           # 页面视图
└── assets/          # 全局样式
```

## 说明

武器面板数值均为游戏内未强化基础值，整理自公开攻略资料，仅供配装参考；盾牌不计攻击力。
