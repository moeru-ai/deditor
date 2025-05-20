import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

import viteConfig from './vite.config'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: viteConfig,
})
