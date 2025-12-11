/**
 * @file tour-card.tsx
 * @description 관광지 카드 컴포넌트
 *
 * 이 컴포넌트는 관광지 목록에서 각 관광지를 카드 형태로 표시합니다.
 *
 * 주요 기능:
 * 1. 썸네일 이미지 표시 (기본 이미지 fallback)
 * 2. 관광지명, 주소, 타입 뱃지 표시
 * 3. 간단한 개요 표시 (1-2줄)
 * 4. 호버 효과 (scale, shadow)
 * 5. 클릭 시 상세페이지 이동
 *
 * @dependencies
 * - next/image: 이미지 최적화
 * - next/link: 클라이언트 사이드 네비게이션
 * - lib/types/tour.ts: TourItem 타입, CONTENT_TYPE 상수
 * - lib/utils/image.ts: 이미지 유틸리티 함수
 *
 * @see {@link /docs/PRD.MD} - 관광지 목록 요구사항 참고
 */

"use client";

import { useState, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { CONTENT_TYPE } from "@/lib/types/tour";
import type { TourItem } from "@/lib/types/tour";
import { cn } from "@/lib/utils";
import {
  normalizeImageUrl,
  isHttpImage,
  getImageSizes,
  DEFAULT_PLACEHOLDER_IMAGE,
} from "@/lib/utils/image";

interface TourCardProps {
  /**
   * 관광지 정보
   */
  tour: TourItem;
  /**
   * 추가 클래스명
   */
  className?: string;
  /**
   * 관광지 호버 핸들러 (선택 사항)
   * 호버 시작 시 호출: (tourId) => void
   * 호버 종료 시 호출: () => void
   */
  onTourHover?: (tourId: string | null) => void;
  /**
   * 이미지 priority 설정 (above-the-fold 이미지에만 사용)
   * 홈페이지 첫 화면에 표시되는 카드에만 true로 설정
   */
  priority?: boolean;
}

/**
 * 관광 타입명 매핑
 */
const contentTypeNames: Record<string, string> = {
  [CONTENT_TYPE.TOURIST_SPOT]: "관광지",
  [CONTENT_TYPE.CULTURAL_FACILITY]: "문화시설",
  [CONTENT_TYPE.FESTIVAL]: "축제/행사",
  [CONTENT_TYPE.TOUR_COURSE]: "여행코스",
  [CONTENT_TYPE.LEISURE_SPORTS]: "레포츠",
  [CONTENT_TYPE.ACCOMMODATION]: "숙박",
  [CONTENT_TYPE.SHOPPING]: "쇼핑",
  [CONTENT_TYPE.RESTAURANT]: "음식점",
};

/**
 * 관광지 카드 컴포넌트
 * React.memo로 최적화하여 불필요한 리렌더링 방지
 */
function TourCardComponent({
  tour,
  className,
  onTourHover,
  priority = false,
}: TourCardProps) {
  // 이미지 URL 정규화 (공통 유틸리티 함수 사용)
  const imageUrl = normalizeImageUrl(
    tour.firstimage || tour.firstimage2,
    DEFAULT_PLACEHOLDER_IMAGE,
  ) || DEFAULT_PLACEHOLDER_IMAGE;
  
  const contentTypeName =
    contentTypeNames[tour.contenttypeid] || "기타";
  const address = tour.addr2
    ? `${tour.addr1} ${tour.addr2}`
    : tour.addr1;
  
  // 이미지 에러 상태 관리
  const [imageError, setImageError] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  
  // HTTP 이미지인지 확인 (공통 유틸리티 함수 사용)
  const httpImage = isHttpImage(currentImageUrl);
  
  // 이미지 sizes 속성 (공통 유틸리티 함수 사용)
  const imageSizes = getImageSizes("card");

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    // Enter 또는 Space 키로 클릭 동작
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // Link 컴포넌트가 자동으로 처리하므로 여기서는 preventDefault만 수행
    }
  };

  // 호버 시작 핸들러 (데스크톱에서만 동작)
  const handleMouseEnter = () => {
    if (onTourHover && window.matchMedia("(hover: hover)").matches) {
      onTourHover(tour.contentid);
    }
  };

  // 호버 종료 핸들러
  const handleMouseLeave = () => {
    if (onTourHover) {
      onTourHover(null);
    }
  };

  return (
    <Link
      href={`/places/${tour.contentid}`}
      className={cn(
        "group relative block rounded-lg border bg-card overflow-hidden",
        "transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "min-h-[200px] sm:min-h-[240px]",
        className
      )}
      aria-label={`${tour.title} 상세보기 - ${contentTypeName}, ${address}`}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="article"
    >
      {/* 썸네일 이미지 */}
      <div className="relative w-full h-48 sm:h-52 bg-muted overflow-hidden">
        {!imageError ? (
          <Image
            src={currentImageUrl}
            alt={`${tour.title} 썸네일 이미지`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes={imageSizes}
            priority={priority}
            unoptimized={httpImage}
            onError={() => {
              // 이미지 로드 실패 시 기본 이미지로 대체
              if (currentImageUrl !== DEFAULT_PLACEHOLDER_IMAGE) {
                setCurrentImageUrl(DEFAULT_PLACEHOLDER_IMAGE);
                setImageError(false);
              } else {
                setImageError(true);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <p className="text-muted-foreground text-sm">이미지 없음</p>
          </div>
        )}
        {/* 관광 타입 뱃지 */}
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center rounded-full bg-primary/90 text-primary-foreground px-2 py-1 text-xs font-medium backdrop-blur-sm">
            {contentTypeName}
          </span>
        </div>
      </div>

      {/* 카드 내용 */}
      <div className="p-4 sm:p-5 space-y-2">
        {/* 관광지명 */}
        <h3 className="font-semibold text-base sm:text-lg line-clamp-1 group-hover:text-primary transition-colors">
          {tour.title}
        </h3>

        {/* 주소 */}
        <p className="text-sm text-muted-foreground line-clamp-1">
          {address}
        </p>

        {/* 간단한 개요 (cat1, cat2, cat3 정보 활용) */}
        {(tour.cat1 || tour.cat2 || tour.cat3) && (
          <div className="flex flex-wrap gap-1">
            {tour.cat1 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {tour.cat1}
              </span>
            )}
            {tour.cat2 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {tour.cat2}
              </span>
            )}
            {tour.cat3 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {tour.cat3}
              </span>
            )}
          </div>
        )}

        {/* 전화번호 (있는 경우) */}
        {tour.tel && (
          <p className="text-xs text-muted-foreground">
            📞 {tour.tel}
          </p>
        )}
      </div>
    </Link>
  );
}

// React.memo로 최적화: props가 변경되지 않으면 리렌더링 방지
export const TourCard = memo(TourCardComponent, (prevProps, nextProps) => {
  // tour 객체의 참조가 같으면 리렌더링 방지
  if (prevProps.tour.contentid !== nextProps.tour.contentid) {
    return false; // 리렌더링 필요
  }
  if (prevProps.className !== nextProps.className) {
    return false; // 리렌더링 필요
  }
  if (prevProps.priority !== nextProps.priority) {
    return false; // 리렌더링 필요
  }
  if (prevProps.onTourHover !== nextProps.onTourHover) {
    return false; // 리렌더링 필요
  }
  return true; // 리렌더링 불필요
});

