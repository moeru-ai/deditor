import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd } from 'node:process'

import { importDirectory } from '@iconify/tools'
import { defineConfig } from 'tsdown'

import packageJSON from './package.json' with { type: 'json' }

function json(any: any) {
  return JSON.stringify(any, null, 2)
}

export default defineConfig({
  entry: ['./src/index.ts'],
  external: [
    './metadata.json',
    './icons.json',
    './chars.json',
    './info.json',
  ],
  sourcemap: false,
  dts: true,
  unused: true,
  fixedExtension: true,
  hooks: {
    'build:done': async () => {
      const iconSetData = await importDirectory(join(cwd(), 'src', 'icons'), { prefix: 'drizzle-orm-icons', ignoreImportErrors: 'warn' })
      const iconJSONData = iconSetData.export()

      await writeFile(join('dist', 'metadata.json'), json({ categories: iconSetData.categories }), { encoding: 'utf8' })
      await writeFile(join('dist', 'icons.json'), json(iconJSONData), { encoding: 'utf8' })
      await writeFile(join('dist', 'chars.json'), json({}), { encoding: 'utf8' })
      await writeFile(join('dist', 'info.json'), json({
        prefix: 'drizzle-orm-icons',
        name: '@drizzle-orm supported Icons',
        total: Object.keys(iconJSONData.icons).length,
        version: packageJSON.version,
        author: {
          name: packageJSON.author.name,
          url: packageJSON.author.url,
        },
        license: {
          title: 'MIT',
          spdx: 'MIT',
        },
        samples: [
          'postgresql',
          'mysql',
          'pglite',
          'sqlite',
        ],
        height: 20,
        displayHeight: 20,
        category: 'Logos 20px',
        tags: [
          'Database',
          'SQL',
        ],
        palette: false,
      }), { encoding: 'utf8' })
    },
  },
})
