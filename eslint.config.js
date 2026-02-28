import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Project-specific overrides
  {
    rules: {
      // Allow explicit `any` sparingly — tighten later if desired
      '@typescript-eslint/no-explicit-any': 'warn',
      // Unused vars: error for real vars, warn for _ prefixed (intentionally ignored)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // No console.log in production (per CLAUDE.md)
      'no-console': 'error',
    },
  },

  // MUST be last: disables all ESLint rules that Prettier handles (formatting)
  prettierConfig,
);
