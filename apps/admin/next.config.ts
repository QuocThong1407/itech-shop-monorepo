import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/admin',
  reactStrictMode: true,
  transpilePackages: ["@itech/shared"],
};

export default nextConfig;
