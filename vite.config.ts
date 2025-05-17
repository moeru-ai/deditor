import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import VueMacros from 'unplugin-vue-macros/vite'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'
import DevTools from 'vite-plugin-vue-devtools'
import Layouts from 'vite-plugin-vue-layouts'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  optimizeDeps: {
    exclude: [
      '@proj-airi/ui',
      '@proj-airi/duckdb-wasm',
      '@proj-airi/drizzle-duckdb-wasm',
    ],
  },
  plugins: [
    VueMacros({
      plugins: {
        vue: Vue({
          include: [/\.vue$/],
        }),
        vueJsx: false,
      },
    }),
    // https://github.com/posva/unplugin-vue-router
    VueRouter({
      extensions: ['.vue'],
      dts: resolve(import.meta.dirname, 'src/typed-router.d.ts'),
    }),
    DevTools(),
    // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
    Layouts(),
    UnoCSS(),
  ],
}))
