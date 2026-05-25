import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/seller',
  reactStrictMode: true,
  transpilePackages: ["@itech/shared"],
};

export default nextConfig;
