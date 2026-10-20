import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
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
  build: {
    // 拆分后单个 chunk 超过 500KB 时给出提示，阈值放宽到 600KB
    chunkSizeWarningLimit: 600,
  },
})
