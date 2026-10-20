import { createApp } from 'vue'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
// 组件由 unplugin-vue-components 按需引入（见 vite.config.js），这里不再整包注册 ElementPlus
import App from './App.vue'
import router from './router'
import './assets/style.css'

createApp(App).use(router).mount('#app')
