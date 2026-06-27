// Shared ESLint preset for apps and packages. The root config already contains
// repo-wide rules; this file is the per-package entry that re-exports them so
// individual packages can extend with additional rules.
export { default } from '../../../eslint.config.mjs';
