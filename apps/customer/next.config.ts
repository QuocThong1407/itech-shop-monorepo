import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/customer',
  reactStrictMode: true,
  transpilePackages: ["@itech/shared"],
};

export default nextConfig;
