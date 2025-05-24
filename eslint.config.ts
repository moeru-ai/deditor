import antfu from '@antfu/eslint-config'

export default await antfu(
  {
    unocss: true,
    vue: true,
    toml: false,
    ignores: [
      'build/**',
    ],
    rules: {
      'import/order': 'off',
      'perfectionist/sort-imports': [
        'error',
        {
          groups: [
            ['type'],
            ['builtin', 'external'],
            ['internal', 'parent', 'sibling', 'index'],
            ['style'],
          ],
          newlinesBetween: 'always',
        },
      ],
    },
  },
  {
    files: ['**/tsconfig.json'],
    rules: {
      'jsonc/sort-keys': 'off',
    },
  },
)
