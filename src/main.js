import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/variables.css'
import './style.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const app = createApp(App)
const pinia = createPinia()

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 全局配置 Element Plus 的中文语言包
app.use(ElementPlus, {
  locale: zhCn
})

app.use(pinia)
app.use(router)

app.mount('#app')
