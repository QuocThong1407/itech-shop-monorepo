import type { NextConfig } from "next";

const customerOrigin = process.env.CUSTOMER_APP_URL ?? "http://localhost:3001";
const sellerOrigin = process.env.SELLER_APP_URL ?? "http://localhost:3002";
const adminOrigin = process.env.ADMIN_APP_URL ?? "http://localhost:3003";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@itech/shared"],
  async rewrites() {
    return [
      {
        source: '/customer',
        destination: `${customerOrigin}/customer`,
      },
      {
        source: '/customer/:path*',
        destination: `${customerOrigin}/customer/:path*`,
      },
      {
        source: '/seller',
        destination: `${sellerOrigin}/seller`,
      },
      {
        source: '/seller/:path*',
        destination: `${sellerOrigin}/seller/:path*`,
      },
      {
        source: '/admin',
        destination: `${adminOrigin}/admin`,
      },
      {
        source: '/admin/:path*',
        destination: `${adminOrigin}/admin/:path*`,
      },
    ];
  },
};

export default nextConfig;
