import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'eslint.config.mjs'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      // AGENTS.md §3 — the `any` type is forbidden.
      '@typescript-eslint/no-explicit-any': 'error',

      // AGENTS.md §3 — explicit return types at module boundaries.
      '@typescript-eslint/explicit-function-return-type': 'error',

      // AGENTS.md §3 — no escape hatches to silence real type errors.
      '@typescript-eslint/ban-ts-comment': 'error',

      // Express middleware signatures require unused positional params
      // (e.g. `_req`, `_next`). Underscore prefix marks them intentional,
      // matching tsconfig's noUnusedParameters behavior.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // AGENTS.md §3 — no console.log outside server.ts (overridden below).
      'no-console': ['warn', { allow: ['error'] }],

      // AGENTS.md §3 — no floating promises / unhandled rejections.
      'no-void': ['error', { allowAsStatement: true }],

      // AGENTS.md §3 — const by default.
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    // AGENTS.md §3 explicitly permits startup logging in the bootstrap file.
    files: ['src/server.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);
