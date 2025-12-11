/**
 * @file web-vitals.tsx
 * @description Web Vitals 측정 컴포넌트
 *
 * 이 컴포넌트는 Core Web Vitals (LCP, FID, CLS)를 측정하고 로깅합니다.
 *
 * 주요 기능:
 * 1. Largest Contentful Paint (LCP) 측정
 * 2. First Input Delay (FID) 측정
 * 3. Cumulative Layout Shift (CLS) 측정
 * 4. 개발 환경에서 콘솔 로깅
 *
 * @dependencies
 * - next/script: Script 컴포넌트
 *
 * @see https://web.dev/vitals/
 */

"use client";

import { useEffect } from "react";
import Script from "next/script";

/**
 * Web Vitals 측정 컴포넌트
 * 개발 환경에서만 콘솔에 로깅합니다.
 */
export function WebVitals() {
  useEffect(() => {
    // Web Vitals 측정 함수 (클라이언트 사이드에서만 실행)
    if (typeof window === "undefined") return;

    // 개발 환경에서만 Web Vitals 측정
    if (process.env.NODE_ENV === "development") {
      // Web Vitals 라이브러리를 동적으로 로드
      import("web-vitals").then(({ onCLS, onFID, onLCP, onFCP, onTTFB }) => {
        onCLS((metric) => {
          console.log("📊 CLS (Cumulative Layout Shift):", metric);
        });

        onFID((metric) => {
          console.log("📊 FID (First Input Delay):", metric);
        });

        onLCP((metric) => {
          console.log("📊 LCP (Largest Contentful Paint):", metric);
        });

        onFCP((metric) => {
          console.log("📊 FCP (First Contentful Paint):", metric);
        });

        onTTFB((metric) => {
          console.log("📊 TTFB (Time to First Byte):", metric);
        });
      }).catch((error) => {
        console.warn("Web Vitals 측정 실패:", error);
      });
    }
  }, []);

  return null;
}

