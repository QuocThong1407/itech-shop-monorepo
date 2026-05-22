import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/customer',
        destination: 'http://localhost:3001/customer',
      },
      {
        source: '/customer/:path*',
        destination: 'http://localhost:3001/customer/:path*',
      },
      {
        source: '/seller',
        destination: 'http://localhost:3002/seller',
      },
      {
        source: '/seller/:path*',
        destination: 'http://localhost:3002/seller/:path*',
      },
      {
        source: '/admin',
        destination: 'http://localhost:3003/admin',
      },
      {
        source: '/admin/:path*',
        destination: 'http://localhost:3003/admin/:path*',
      },
    ];
  },
};

export default nextConfig;