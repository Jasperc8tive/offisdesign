# Lighthouse CI

Stage 10 introduces the automated Lighthouse pipeline that was identified
at the end of Stage 9. A new `lighthouse` job in
`.github/workflows/ci.yml` boots the storefront, crawls a representative
set of URLs, and fails the build if any of the four category scores drop
below threshold.

## Configuration

`apps/web/lighthouserc.cjs`:

```js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node node_modules/next/dist/bin/next start -p 3100',
      url: [
        'http://localhost:3100/',
        'http://localhost:3100/search',
        'http://localhost:3100/account/login',
      ],
      numberOfRuns: 1,
      settings: { preset: 'desktop', skipAudits: ['uses-http2', 'is-crawlable'] },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 1.0 }],
        'categories:best-practices': ['error', { minScore: 1.0 }],
        'categories:seo': ['error', { minScore: 1.0 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
```

### URL set

We pick three URLs to keep the run fast and representative:

- `/` — homepage; covers the marketing surface (announcement bar,
  CMS-driven sections, hero, newsletter).
- `/search` — discovery surface; covers the filter sidebar, grid, and
  facet clicks.
- `/account/login` — a representative form page; covers the typography
  - input components and the auth provider's static state.

PDP and collection pages are intentionally **not** in the gated set yet.
They depend on live API data that the CI environment doesn't have running
in the Lighthouse job. They are tracked in the "Remaining work" list and
will join the gate once we add a fixtures/mock backend for CI.

### Skipped audits

- `uses-http2` — local Next start server doesn't enable HTTP/2; the audit
  fails on every run. Production deploys do, so this is a local artefact.
- `is-crawlable` — the CI environment isn't reachable from external
  crawlers; the audit's heuristic confuses local dev with a blocked site.

## Why the thresholds

| Category       | Target | Reasoning                                                                                                    |
| -------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| Performance    | ≥ 0.95 | Achievable for static-prerendered routes; gives headroom for the third-party scripts a future stage may add. |
| Accessibility  | 1.00   | Anything below indicates a real defect (missing label, contrast fail, etc).                                  |
| Best Practices | 1.00   | No insecure JS, no console errors, no deprecated APIs.                                                       |
| SEO            | 1.00   | Per-page metadata is wired; structured data emitted. Anything below indicates a missing tag.                 |

## Running locally

```bash
pnpm --filter @offisdesign/web build
cd apps/web
npx @lhci/cli@0.14 autorun --config=./lighthouserc.cjs
```

The dev server is **not** what Lighthouse should measure — `next dev`
ships React DevTools, HMR, and source maps. Always run against
`next start`.

## Failure protocol

A failed Lighthouse run blocks merge. To investigate:

1. The CI summary links to the temporary public storage report.
2. Reproduce locally with the command above. The HTML report is at
   `apps/web/.lighthouseci/`.
3. The most common failures (and fixes):
   - **Performance drop on the homepage** — usually a new third-party
     script or an image without `width`/`height`. Audit the network
     tab first.
   - **A11y < 1.00** — missing landmark, low contrast, or unlabelled
     form control. The audit names the offending node.
   - **Best Practices < 1.00** — usually a console error logged during
     SSR or hydration. Server-side logs surface in the Lighthouse trace.
   - **SEO < 1.00** — usually a missing `description` meta on a new
     route. Check `generateMetadata` exists.

## Future work

- Add `/products/[slug]` and `/collections/[slug]` once the CI job has a
  fixtures-backed API instance.
- Capture mobile preset runs in addition to desktop.
- Track scores over time (LHCI server) so regressions surface before they
  reach the threshold.
- Tie a status check to PR merge gates so Lighthouse failures block in
  the GitHub UI alongside lint / test / build.
