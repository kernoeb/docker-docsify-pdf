const { default: antfu } = require('@antfu/eslint-config')

module.exports = antfu(
  {
    stylistic: true,
    rules: {
      'no-console': 'off',
      'antfu/if-newline': 'off',
      'nonblock-statement-body-position': 'error',
      'curly': ['error', 'multi-line', 'consistent'],
      'style/brace-style': ['error', '1tbs', { allowSingleLine: false }],
      'unused-imports/no-unused-vars': 'warn',
      'unused-imports/no-unused-imports': 'warn',
      'jsonc/sort-keys': 'error',
      'node/prefer-global/process': 'off',
    },
    ignores: ['resources/', 'docs/'],
  },
)
