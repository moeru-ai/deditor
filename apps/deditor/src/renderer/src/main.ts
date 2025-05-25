import { MotionPlugin } from '@vueuse/motion'
import { createPinia } from 'pinia'
import { setupLayouts } from 'virtual:generated-layouts'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

import App from './App.vue'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'
import 'splitpanes/dist/splitpanes.css'

const pinia = createPinia()
const routeRecords = setupLayouts(routes)
const router = createRouter({ routes: routeRecords, history: createWebHistory() })

createApp(App)
  .use(pinia)
  .use(router)
  .use(MotionPlugin)
  .mount('#app')
