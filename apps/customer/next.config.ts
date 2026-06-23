import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/customer',
  reactStrictMode: true,
  transpilePackages: ["@itech/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gekzkbhdnuusmiqapwqt.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default nextConfig;