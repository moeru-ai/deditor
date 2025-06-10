import type { PresetOrFactoryAwaitable } from 'unocss'

import { createExternalPackageIconLoader } from '@iconify/utils/lib/loader/external-pkg'
import { colorToString } from '@unocss/preset-mini/utils'
import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local'
import { defineConfig, mergeConfigs, presetAttributify, presetIcons, presetTypography, presetWebFonts, presetWind3, transformerDirectives, transformerVariantGroup } from 'unocss'
import presetAnimations from 'unocss-preset-animations'
import { presetScrollbar } from 'unocss-preset-scrollbar'
import { presetShadcn } from 'unocss-preset-shadcn'
import { parseColor } from 'unocss/preset-mini'

function createColorSchemeConfig(hueOffset = 0) {
  return {
    DEFAULT: `oklch(62% var(--theme-colors-chroma) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    50: `color-mix(in srgb, oklch(95% var(--theme-colors-chroma-50) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha) 30%, oklch(100% 0 360 / %alpha))`,
    100: `color-mix(in srgb, oklch(95% var(--theme-colors-chroma-100) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha) 80%, oklch(100% 0 360 / %alpha))`,
    200: `oklch(90% var(--theme-colors-chroma-200) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    300: `oklch(85% var(--theme-colors-chroma-300) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    400: `oklch(74% var(--theme-colors-chroma-400) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    500: `oklch(62% var(--theme-colors-chroma) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    600: `oklch(54% var(--theme-colors-chroma-600) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    700: `oklch(49% var(--theme-colors-chroma-700) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    800: `oklch(42% var(--theme-colors-chroma-800) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    900: `oklch(37% var(--theme-colors-chroma-900) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
    950: `oklch(29% var(--theme-colors-chroma-950) calc(var(--theme-colors-hue) + ${hueOffset}) / %alpha)`,
  }
}

export function presetStoryMockHover(): PresetOrFactoryAwaitable {
  return {
    name: 'story-mock-hover',
    variants: [
      (matcher) => {
        if (!matcher.includes('hover')) {
          return matcher
        }

        return {
          matcher,
          selector: (s) => {
            return `${s}, ${s.replace(/:hover$/, '')}._hover`
          },
        }
      },
    ],
  }
}

export function safelistAllPrimaryBackgrounds(): string[] {
  return [
    ...[undefined, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => {
      const prefix = shade ? `bg-primary-${shade}` : `bg-primary`
      return [
        prefix,
        ...[5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(opacity => `${prefix}/${opacity}`),
      ]
    }).flat(),
  ]
}

export function sharedUnoConfig() {
  return defineConfig({
    presets: [
      presetWind3(),
      presetAttributify(),
      presetTypography(),
      presetWebFonts({
        fonts: {
          sans: {
            name: 'DM Sans',
            weights: [
              100,
              200,
              300,
              400,
              500,
              600,
              700,
              800,
              900,
            ],
          },
          serif: 'DM Serif Display',
          mono: 'DM Mono',
          cute: 'Kiwi Maru',
          cuteen: 'Sniglet',
          jura: 'Jura',
          gugi: 'Gugi',
          quicksand: 'Quicksand',
          quanlai: {
            name: 'cjkfonts AllSeto',
            provider: 'none',
          },
          xiaolai: {
            name: 'Xiaolai SC',
            provider: 'none',
          },
        },
        timeouts: {
          warning: 5000,
          failure: 10000,
        },
        // This will download the fonts and serve them locally
        processors: createLocalFontProcessor({
          // Directory to cache the fonts
          cacheDir: 'node_modules/.cache/unocss/fonts',
          // Directory to save the fonts assets
          fontAssetsDir: 'src/renderer/public/assets/fonts',
          // Base URL to serve the fonts from the client
          fontServeBaseUrl: '/assets/fonts',
        }),
      }),
      presetIcons({
        scale: 1.2,
        collections: {
          ...createExternalPackageIconLoader('@deditor-app/deditor-icons'),
          ...createExternalPackageIconLoader('@deditor-app/drizzle-orm-icons'),
        },
      }),
      presetScrollbar(),
      presetAnimations(),
      presetShadcn(
        { color: 'neutral' },
        { componentLibrary: 'reka' },
      ),
    ],
    transformers: [
      transformerDirectives({
        applyVariable: ['--at-apply'],
      }),
      transformerVariantGroup(),
    ],
    safelist: [
      ...'prose prose-sm m-auto text-left'.split(' '),
    ],
    // hyoban/unocss-preset-shadcn: Use shadcn ui with UnoCSS
    // https://github.com/hyoban/unocss-preset-shadcn
    //
    // Thanks to
    // https://github.com/unovue/shadcn-vue/issues/34#issuecomment-2467318118
    //
    // By default, `.ts` and `.js` files are NOT extracted.
    // If you want to extract them, use the following configuration.
    // It's necessary to add the following configuration if you use shadcn-vue or shadcn-svelte.
    content: {
      pipeline: {
        include: [
        // the default
          /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
          // include js/ts files
          '(components|src)/**/*.{js,ts}',
        ],
      },
    },
    rules: [
      [/^mask-\[(.*)\]$/, ([, suffix]) => ({ '-webkit-mask-image': suffix.replace(/_/g, ' ') })],
      [/^bg-dotted-\[(.*)\]$/, ([, color], { theme }) => {
        const parsedColor = parseColor(color, theme)
        // Util usage: https://github.com/unocss/unocss/blob/f57ef6ae50006a92f444738e50f3601c0d1121f2/packages-presets/preset-mini/src/_utils/utilities.ts#L186
        return {
          'background-image': `radial-gradient(circle at 1px 1px, ${colorToString(parsedColor?.cssColor ?? parsedColor?.color ?? color, 'var(--un-background-opacity)')} 1px, transparent 0)`,
          '--un-background-opacity': parsedColor?.cssColor?.alpha ?? parsedColor?.alpha ?? 1,
        }
      }],
    ],
    theme: {
      colors: {
        primary: createColorSchemeConfig(),
        complementary: createColorSchemeConfig(180),
      },
      /**
       * https://github.com/unocss/unocss/blob/1031312057a3bea1082b7d938eb2ad640f57613a/packages-presets/preset-wind4/src/theme/animate.ts
       * https://unocss.dev/presets/wind4#transformdirectives
       */
      animation: {
        keyframes: {
          slideUpAndFade: '{from{opacity:0;transform:translateY(2px)}to{opacity:1;transform:translateY(0)}}',
          slideRightAndFade: '{from{opacity:0;transform:translateX(-2px)}to{opacity:1;transform:translateX(0)}}',
          slideDownAndFade: '{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}',
          slideLeftAndFade: '{from{opacity:0;transform:translateX(2px)}to{opacity:1;transform:translateX(0)}}',
        },
        durations: {
          slideUpAndFade: '400ms',
          slideRightAndFade: '400ms',
          slideDownAndFade: '400ms',
          slideLeftAndFade: '400ms',
        },
        timingFns: {
          slideUpAndFade: 'cubic-bezier(0.16, 1, 0.3, 1)',
          slideRightAndFade: 'cubic-bezier(0.16, 1, 0.3, 1)',
          slideDownAndFade: 'cubic-bezier(0.16, 1, 0.3, 1)',
          slideLeftAndFade: 'cubic-bezier(0.16, 1, 0.3, 1)',
        },
      },
    },
  })
}

export default mergeConfigs([
  sharedUnoConfig(),
])
