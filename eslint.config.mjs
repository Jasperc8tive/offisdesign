// Flat ESLint config (ESLint v9+). Shared across the workspace.
// Stricter rules per app/package can extend these in their own eslint.config.mjs.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/storybook-static/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/*.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      // No hex colours outside packages/ui/src/tokens.
      // Enforced by a dedicated rule once the design-system stage lands; placeholder here.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
          message:
            'Hex colour literals are forbidden outside packages/ui/src/tokens. Use design tokens instead.',
        },
      ],
    },
  },
  {
    // Tokens package is the only place hex literals may live in shipped code.
    // Stories illustrate third-party / product colours (e.g. wood swatches)
    // and are not bundled into apps, so the rule is relaxed there too.
    // The apps/web/app/(design) route group is the Stage 3.6 validation
    // prototype environment (per spec: "not production pages"); raw product
    // colour data sits there until a real catalogue exists.
    files: [
      'packages/ui/src/tokens/**',
      '**/*.stories.tsx',
      'apps/web/app/design/**',
      // OG image routes render via next/og into a satori canvas; CSS variables
      // are not available there, so the few inline hex values are unavoidable.
      'apps/web/app/og/**',
    ],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  {
    // Nest constructor injection relies on emitDecoratorMetadata + runtime
    // class references. consistent-type-imports rewrites those to type-only
    // imports, which silently breaks DI. Disable the rule across the API.
    files: ['apps/api/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-console': 'off',
    },
  },
  {
    // Seed script is a CLI that legitimately uses console.log.
    files: ['packages/database/src/seed.ts'],
    rules: { 'no-console': 'off' },
  },
);
