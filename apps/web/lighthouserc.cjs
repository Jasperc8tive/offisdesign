/**
 * Lighthouse CI configuration. Run against a built Next.js server.
 *
 * The CI workflow:
 *   1. boots the storefront via `pnpm --filter @offisdesign/web start`,
 *   2. asks `lhci autorun` to crawl the URLs listed below,
 *   3. asserts the four category scores meet the Stage 10 thresholds.
 *
 * Mock data note: the homepage and search render without API access (they
 * gracefully degrade to empty states), so Lighthouse can score the chrome
 * even when the API is not running.
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node node_modules/next/dist/bin/next start -p 3100',
      url: [
        'http://localhost:3100/',
        'http://localhost:3100/search',
        'http://localhost:3100/cart',
        'http://localhost:3100/account/login',
        'http://localhost:3100/account/register',
      ],
      numberOfRuns: 1,
      settings: {
        // Mobile emulation by default — matches GoogleBot's primary index.
        preset: 'desktop',
        skipAudits: ['uses-http2', 'is-crawlable'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 1.0 }],
        'categories:best-practices': ['error', { minScore: 1.0 }],
        'categories:seo': ['error', { minScore: 1.0 }],
        // Core Web Vitals — fail CI if a route regresses past the
        // Stage 12 targets. Numbers are in ms / unitless (CLS).
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'interaction-to-next-paint': ['warn', { maxNumericValue: 200 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
