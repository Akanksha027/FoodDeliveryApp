import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  images: {
    // Allow unoptimized local images from the public folder
    unoptimized: false,
    remotePatterns: [],
  },
};

export default nextConfig;
