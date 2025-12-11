import type { NextConfig } from "next";

// Bundle Analyzer 설정
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Clerk 인증 이미지
      { hostname: "img.clerk.com" },
      // Unsplash placeholder 이미지
      { hostname: "images.unsplash.com" },
      // 한국관광공사 API 이미지 (HTTPS)
      { 
        hostname: "tong.visitkorea.or.kr",
        protocol: "https",
      },
      // 한국관광공사 API 이미지 (HTTP - 일부 이미지가 HTTP로 제공됨)
      { 
        hostname: "tong.visitkorea.or.kr",
        protocol: "http",
      },
      // 네이버 지도 관련 이미지 (필요 시 사용)
      { hostname: "map.naver.com" },
      { hostname: "naver.com" },
    ],
    // 이미지 최적화 설정
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // WebP 포맷 우선 지원 (자동으로 지원하는 브라우저에 제공)
    formats: ["image/webp", "image/avif"],
    // HTTP 이미지도 허용 (한국관광공사 API 일부 이미지가 HTTP)
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default withBundleAnalyzer(nextConfig);
