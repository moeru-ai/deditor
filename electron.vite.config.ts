import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

import viteConfig from './vite.config'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({
      include: [
        'drizzle-orm',
        'drizzle-orm/postgres-js',
        'drizzle-orm/mysql2',
        'postgres',
        'mysql2',
      ],
    })],
  },
  preload: {
    plugins: [externalizeDepsPlugin({
      include: [
        'drizzle-orm',
        'drizzle-orm/postgres-js',
        'drizzle-orm/mysql2',
        'postgres',
        'mysql2',
      ],
    })],
  },
  renderer: viteConfig,
})
