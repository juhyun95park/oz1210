/**
 * @file image.ts
 * @description 이미지 관련 유틸리티 함수
 *
 * 이 파일은 이미지 URL 정규화, placeholder 관리, 이미지 최적화 설정 등을 제공합니다.
 *
 * 주요 기능:
 * 1. 이미지 URL 정규화 및 검증
 * 2. placeholder 이미지 관리
 * 3. 이미지 최적화 설정 (priority, sizes 등)
 *
 * @dependencies
 * - next/image: Image 컴포넌트 props 타입
 */

import type { ImageProps } from "next/image";

// =====================================================
// 상수 정의
// =====================================================

/**
 * 기본 placeholder 이미지 URL
 * Unsplash의 한국 여행 관련 이미지 사용
 */
export const DEFAULT_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop";

/**
 * 한국관광공사 API 이미지 기본 도메인
 */
const VISITKOREA_IMAGE_DOMAIN = "tong.visitkorea.or.kr";

// =====================================================
// 이미지 URL 정규화
// =====================================================

/**
 * 이미지 URL 정규화 및 검증
 * 빈 문자열이나 잘못된 URL을 처리하고, 상대 경로를 절대 경로로 변환합니다.
 *
 * @param url - 정규화할 이미지 URL
 * @param fallback - URL이 유효하지 않을 때 사용할 fallback URL (기본값: DEFAULT_PLACEHOLDER_IMAGE)
 * @returns 정규화된 이미지 URL 또는 fallback URL
 */
export function normalizeImageUrl(
  url: string | undefined | null,
  fallback: string | null = DEFAULT_PLACEHOLDER_IMAGE,
): string | null {
  // null, undefined, 빈 문자열 체크
  if (!url || url.trim() === "" || url === "null" || url === "undefined") {
    return fallback;
  }

  const trimmed = url.trim();

  // 이미 전체 URL인 경우 (http:// 또는 https://로 시작)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // 상대 경로인 경우 절대 경로로 변환
  if (trimmed.startsWith("/")) {
    return `https://${VISITKOREA_IMAGE_DOMAIN}${trimmed}`;
  }

  // 그 외의 경우 fallback 반환
  return fallback;
}

/**
 * HTTP 이미지인지 확인
 * Next.js Image 컴포넌트는 HTTP 이미지를 최적화할 수 없으므로 unoptimized 속성이 필요합니다.
 *
 * @param url - 확인할 이미지 URL
 * @returns HTTP 이미지인지 여부
 */
export function isHttpImage(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith("http://");
}

// =====================================================
// 이미지 최적화 설정
// =====================================================

/**
 * 이미지 sizes 속성 생성
 * 반응형 레이아웃에 맞는 sizes 속성을 생성합니다.
 *
 * @param layout - 레이아웃 타입
 * @param customSizes - 커스텀 sizes 문자열 (선택 사항)
 * @returns sizes 속성 문자열
 */
export function getImageSizes(
  layout: "card" | "detail" | "gallery-main" | "gallery-thumbnail" | "gallery-modal" | "custom",
  customSizes?: string,
): string {
  if (layout === "custom" && customSizes) {
    return customSizes;
  }

  switch (layout) {
    case "card":
      // 모바일 1열, 태블릿 2열, 데스크톱 3열
      return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
    
    case "detail":
      // 상세페이지 대표 이미지
      return "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px";
    
    case "gallery-main":
      // 갤러리 대표 이미지
      return "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px";
    
    case "gallery-thumbnail":
      // 갤러리 썸네일 (모바일 2열, 태블릿 4열, 데스크톱 5열)
      return "(max-width: 640px) 50vw, (max-width: 768px) 25vw, 20vw";
    
    case "gallery-modal":
      // 갤러리 모달 (전체 화면)
      return "100vw";
    
    default:
      return "(max-width: 768px) 100vw, 1200px";
  }
}

/**
 * 이미지 최적화 props 생성
 * 이미지 URL과 레이아웃 정보를 기반으로 최적화된 Image 컴포넌트 props를 생성합니다.
 *
 * @param url - 이미지 URL
 * @param alt - 이미지 alt 텍스트
 * @param options - 추가 옵션
 * @returns Image 컴포넌트에 전달할 props
 */
export function getImageProps(
  url: string | undefined | null,
  alt: string,
  options: {
    layout?: "card" | "detail" | "gallery-main" | "gallery-thumbnail" | "gallery-modal" | "custom";
    customSizes?: string;
    priority?: boolean;
    fill?: boolean;
    width?: number;
    height?: number;
    fallback?: string | null;
  } = {},
): {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
} {
  const {
    layout = "card",
    customSizes,
    priority = false,
    fill = false,
    width,
    height,
    fallback = DEFAULT_PLACEHOLDER_IMAGE,
  } = options;

  const normalizedUrl = normalizeImageUrl(url, fallback);
  const httpImage = isHttpImage(normalizedUrl);
  const sizes = layout !== "custom" ? getImageSizes(layout) : customSizes;

  const props: {
    src: string;
    alt: string;
    sizes?: string;
    priority?: boolean;
    unoptimized?: boolean;
    fill?: boolean;
    width?: number;
    height?: number;
  } = {
    src: normalizedUrl || DEFAULT_PLACEHOLDER_IMAGE,
    alt,
  };

  if (sizes) {
    props.sizes = sizes;
  }

  if (priority) {
    props.priority = true;
  }

  if (httpImage) {
    props.unoptimized = true;
  }

  if (fill) {
    props.fill = true;
  } else if (width && height) {
    props.width = width;
    props.height = height;
  }

  return props;
}

