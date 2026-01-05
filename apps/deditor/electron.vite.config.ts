import { defineConfig } from 'electron-vite'

import viteConfig from './vite.config'

export default defineConfig({
  main: {
    build: {
      externalizeDeps: {
        include: [
          '@stdlib/string',
          'drizzle-orm',
          'drizzle-orm/postgres-js',
          'drizzle-orm/mysql2',
          'postgres',
          'mysql2',
        ],
      },
    },
  },
  preload: {
    build: {
      externalizeDeps: {
        include: [
          '@stdlib/string',
          'drizzle-orm',
          'drizzle-orm/postgres-js',
          'drizzle-orm/mysql2',
          'postgres',
          'mysql2',
        ],
      },
    },
  },
  renderer: viteConfig,
})
