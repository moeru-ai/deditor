<a name="readme-top"></a>

<div align="center">

<img src="./docs/public/drizzle.svg">

<h1><a href="https://orm.drizzle.team/">Drizzle ORM</a> supported icons in <a href="https://iconify.design/">Iconfiy</a></h1>

All Drizzle ORM supported databases' and service providers' brand SVG Logo and Icon Collection. See them all on one page at [https://github.com/drizzle-team/drizzle-orm-docs/tree/main/public/svg](https://github.com/drizzle-team/drizzle-orm-docs/tree/main/public/svg).

Contributions, corrections & requests can be made on their [GitHub repository](https://github.com/drizzle-team/drizzle-orm).

This enables you to use all the databases' and services providers' icons in UnoCSS or any Iconify compatible scenario.

</div>

## Installation

Pick the package manager of your choice:

```shell
ni @deditor-app/drizzle-orm-icons -D # from @antfu/ni, can be installed via `npm i -g @antfu/ni`
pnpm i @deditor-app/drizzle-orm-icons @iconify/utils -D
yarn i @deditor-app/drizzle-orm-icons @iconify/utils -D
npm i @deditor-app/drizzle-orm-icons @iconify/utils -D
```

### UnoCSS usage

```typescript
import { createExternalPackageIconLoader } from '@iconify/utils/lib/loader/external-pkg'
import { presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    // Other presets
    presetIcons({
      scale: 1.2,
      collections: {
        ...createExternalPackageIconLoader('@deditor-app/drizzle-orm-icons'),
      },
    }),
  ],
})
```

## License

- `jsonl` file icon comes from [`si:json-alt-1-fill`](https://icones.js.org/collection/all?s=json&icon=si:json-alt-1-fill)
