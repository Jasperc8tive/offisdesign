/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:4000';

// Admin is internal — no third-party scripts, no embedded payments, no maps.
// CSP is therefore much tighter than the storefront's: no Stripe domains,
// no external img sources beyond the API host and self.
const csp = [
  `default-src 'self'`,
  // Next.js inlines a runtime bootstrap script with a hash, but the simplest
  // safe default is 'self' + 'unsafe-inline' in dev only. Drop 'unsafe-eval'
  // entirely in production.
  `script-src 'self'${isProd ? '' : " 'unsafe-inline' 'unsafe-eval'"}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: ${apiOrigin}`,
  `font-src 'self' data:`,
  `connect-src 'self' ${apiOrigin}`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@offisdesign/ui', '@offisdesign/utils'],
  experimental: {
    typedRoutes: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
