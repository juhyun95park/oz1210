import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "images.unsplash.com" },
      { hostname: "tong.visitkorea.or.kr" },
    ],
  },
};

export default nextConfig;
