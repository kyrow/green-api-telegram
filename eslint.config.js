import js from '@eslint/js'
import boundaries from 'eslint-plugin-boundaries'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Уровни Atomic Design: каждый может импортировать только уровни ниже себя.
const LEVELS = ['ui', 'atoms', 'molecules', 'organisms', 'templates', 'pages']
// Barrel-файл уровня (`atoms/index.ts`) — отдельный тип `atoms:index`: он реэкспортирует компоненты
// своего уровня, а остальные уровни импортируют компоненты только через него.
const barrel = (level) => (level === 'ui' ? 'ui' : `${level}:index`)
const below = (level) => LEVELS.slice(0, LEVELS.indexOf(level)).flatMap((l) => [l, barrel(l)])
const allowTo = (...types) => ({ to: { element: { types: { anyOf: types } } } })

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
  },
  {
    // Сгенерированные shadcn-компоненты экспортируют и компоненты, и варианты (cva).
    files: ['src/components/ui/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.app.json' },
      },
      // Паттерны сопоставляются с папками от корня проекта; побеждает первый подходящий.
      'boundaries/elements': [
        { type: 'ui', pattern: 'src/components/ui' },
        // Каждый компонент уровня — отдельный элемент, поэтому импорт соседа по уровню запрещён.
        ...LEVELS.slice(1, 5).map((level) => ({
          type: level,
          pattern: `src/components/${level}/*`,
          capture: ['component'],
        })),
        { type: 'pages', pattern: 'src/pages/*', capture: ['component'] },
        // Файлы прямо в папке уровня — это barrel (index.ts).
        ...LEVELS.slice(1, 5).map((level) => ({ type: barrel(level), pattern: `src/components/${level}` })),
        { type: barrel('pages'), pattern: 'src/pages' },
        { type: 'api', pattern: 'src/api' },
        { type: 'store', pattern: 'src/store' },
        { type: 'hooks', pattern: 'src/hooks' },
        { type: 'lib', pattern: 'src/lib' },
        { type: 'app', pattern: 'src' },
      ].map((descriptor) => ({ ...descriptor, partialMatch: false })),
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            ...LEVELS.slice(1).map((level) => ({ from: { element: { type: barrel(level) } }, allow: allowTo(level) })),
            { from: { element: { type: 'ui' } }, allow: allowTo('lib') },
            { from: { element: { type: 'atoms' } }, allow: allowTo(...below('atoms'), 'lib') },
            { from: { element: { type: 'molecules' } }, allow: allowTo(...below('molecules'), 'lib') },
            { from: { element: { type: 'organisms' } }, allow: allowTo(...below('organisms'), 'lib') },
            { from: { element: { type: 'templates' } }, allow: allowTo(...below('templates'), 'lib') },
            {
              from: { element: { type: 'pages' } },
              allow: allowTo(...below('pages'), 'api', 'store', 'hooks', 'lib'),
            },
            { from: { element: { type: 'app' } }, allow: allowTo('app', 'pages', barrel('pages'), 'store', 'ui', 'lib') },
            { from: { element: { type: 'hooks' } }, allow: allowTo('api', 'lib') },
            { from: { element: { type: 'store' } }, allow: allowTo('api', 'lib') },
            { from: { element: { type: 'api' } }, allow: allowTo('lib') },
            // lib зависит от api только ради типов уведомлений.
            { from: { element: { type: 'lib' } }, allow: allowTo('api') },
          ],
        },
      ],
    },
  },
])
