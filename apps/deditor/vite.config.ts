import Vue from '@vitejs/plugin-vue'
import { join, resolve } from 'node:path'
import UnoCSS from 'unocss/vite'
import VueMacros from 'unplugin-vue-macros/vite'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'
// import DevTools from 'vite-plugin-vue-devtools'
import Layouts from 'vite-plugin-vue-layouts'

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  root: resolve(join('src', 'renderer')),
  optimizeDeps: {
    exclude: [
      '@proj-airi/ui',
      '@proj-airi/duckdb-wasm',
      '@proj-airi/drizzle-duckdb-wasm',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(join('src', 'renderer', 'src')),
    },
  },
  plugins: [
    VueMacros({
      betterDefine: false,
      plugins: {
        vue: Vue({
          include: [/\.vue$/],
        }),
        vueJsx: false,
      },
    }),
    // https://github.com/posva/unplugin-vue-router
    VueRouter({
      routesFolder: resolve(import.meta.dirname, join('src', 'renderer', 'src', 'pages')),
      extensions: ['.vue'],
      dts: resolve(import.meta.dirname, join('src', 'renderer', 'src', 'typed-router.d.ts')),
    }),
    // DevTools(),
    // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
    Layouts(),
    UnoCSS(),
  ],
}))
