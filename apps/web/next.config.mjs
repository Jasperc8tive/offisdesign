/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@offisdesign/ui', '@offisdesign/utils'],
  experimental: {
    typedRoutes: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],
    remotePatterns: [
      // Allow CDN-served product media. Override at deploy time via
      // NEXT_PUBLIC_MEDIA_HOSTNAME if you switch providers.
      ...(process.env.NEXT_PUBLIC_MEDIA_HOSTNAME
        ? [{ protocol: 'https', hostname: process.env.NEXT_PUBLIC_MEDIA_HOSTNAME }]
        : []),
      { protocol: 'https', hostname: '**.offisdesign.com' },
      // Royalty-free editorial stock photography (Brand Bible §28), used until
      // original OFFISDESIGN photography is available. See lib/media/stock.ts.
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // Configured for the storefront's runtime deps:
  //   • Stripe Elements iframes (js.stripe.com, m.stripe.network)
  //   • API host (configurable via NEXT_PUBLIC_API_URL at build time)
  //   • Next.js itself (inline scripts for hydration are unsafe-inline in dev only)
  async headers() {
    const apiHost = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const isProd = process.env.NODE_ENV === 'production';
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      ...(isProd ? [] : ["'unsafe-eval'"]),
      'https://js.stripe.com',
    ].join(' ');
    const csp = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self' ${apiHost} https://api.stripe.com`,
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(isProd ? ['upgrade-insecure-requests'] : []),
    ].join('; ');
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
