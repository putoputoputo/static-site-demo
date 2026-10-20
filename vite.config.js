import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 部署到 GitHub Pages 子路径时通过 BASE_PATH 指定，例如 BASE_PATH=/static-site-demo/
  base: process.env.BASE_PATH || '/',
  plugins: [vue()],
})
