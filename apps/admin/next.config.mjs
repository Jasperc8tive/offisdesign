/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@offisdesign/ui', '@offisdesign/utils'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
