/**
 * Frontend configuration. Reads from `NEXT_PUBLIC_*` env so values are
 * available in both server and client bundles.
 */
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  /** Where the storefront lives — used in auth links. */
  webUrl: process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000',
  /**
   * Publishable Stripe key. When absent the checkout falls back to the
   * mock-provider flow (no `Elements` mount, no client confirmation step) —
   * useful for local dev without Stripe credentials.
   */
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
} as const;
