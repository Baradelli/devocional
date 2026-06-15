// eslint.config.mjs — raiz do monorepo (ESLint 9 flat config)
// Papéis separados: ESLint faz LINT, Prettier faz FORMAT.
// eslint-config-prettier desliga as regras de estilo do ESLint (sem eslint-plugin-prettier).
//
// Pacotes (devDependencies na raiz):
//   eslint typescript-eslint @eslint/js eslint-config-prettier
//   eslint-plugin-simple-import-sort eslint-plugin-import globals

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/', '**/build/', '**/coverage/', '**/node_modules/', '**/*.d.ts'] },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      import: importPlugin,
    },
    rules: {
      // Import sort — auto-fixável (roda no save)
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',

      // Higiene comum
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Backend (Node) — globals de Node
  {
    files: ['packages/api/**/*.ts', 'packages/shared/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },

  // Frontends (browser) — globals de browser
  {
    files: ['packages/pwa/**/*.{ts,tsx}', 'packages/admin/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
  },

  // Arquivos JS de config — sem type-checking
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // SEMPRE por último: desliga regras de estilo que conflitam com o Prettier
  prettier,
);
