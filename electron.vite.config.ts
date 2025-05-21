import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

import viteConfig from './vite.config'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({
      include: [
        'drizzle-orm',
        'drizzle-orm/postgres-js',
        'postgres',
      ],
    })],
  },
  preload: {
    plugins: [externalizeDepsPlugin({
      include: [
        'drizzle-orm',
        'drizzle-orm/postgres-js',
        'postgres',
      ],
    })],
  },
  renderer: viteConfig,
})
