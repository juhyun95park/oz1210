/**
 * @file detail-info.tsx
 * @description 관광지 기본 정보 섹션 컴포넌트
 *
 * 이 컴포넌트는 관광지의 기본 정보를 표시합니다.
 *
 * 주요 기능:
 * 1. 관광지명 표시
 * 2. 대표 이미지 표시
 * 3. 주소 표시 및 복사 기능
 * 4. 전화번호 표시 및 연결
 * 5. 홈페이지 링크
 * 6. 개요 표시
 * 7. 관광 타입 및 카테고리 뱃지
 * 8. 정보 없는 항목 숨김 처리
 *
 * @dependencies
 * - next/image: 이미지 최적화
 * - lib/types/tour.ts: TourDetail 타입, CONTENT_TYPE 상수
 * - components/ui/button.tsx: Button 컴포넌트
 * - components/providers/toast-provider.tsx: useToast hook
 * - lucide-react: Copy, Phone, ExternalLink 아이콘
 *
 * @see {@link /docs/PRD.MD} - 기본 정보 섹션 요구사항 참고
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Phone, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { CONTENT_TYPE } from "@/lib/types/tour";
import type { TourDetail } from "@/lib/types/tour";
import { cn } from "@/lib/utils";

interface DetailInfoProps {
  /**
   * 관광지 상세 정보
   */
  detail: TourDetail;
  /**
   * 추가 클래스명
   */
  className?: string;
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
 * 관광지 기본 정보 섹션 컴포넌트
 */
export function DetailInfo({ detail, className }: DetailInfoProps) {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 주소 조합
  const fullAddress = detail.addr2
    ? `${detail.addr1} ${detail.addr2}`
    : detail.addr1;

  // 주소 복사 기능
  const handleCopyAddress = async () => {
    if (!fullAddress) return;

    try {
      // HTTPS 환경 확인
      if (typeof window !== "undefined" && window.isSecureContext) {
        await navigator.clipboard.writeText(fullAddress);
        setCopied(true);
        success("주소가 복사되었습니다.");
        setTimeout(() => setCopied(false), 2000);
      } else {
        // HTTPS가 아닌 경우 fallback (거의 없지만)
        const textArea = document.createElement("textarea");
        textArea.value = fullAddress;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        success("주소가 복사되었습니다.");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("주소 복사 실패:", error);
    }
  };

  // 홈페이지 URL 유효성 검증 및 정규화
  const getHomepageUrl = (url?: string): string | null => {
    if (!url || url.trim() === "") return null;
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const homepageUrl = getHomepageUrl(detail.homepage);

  return (
    <section
      className={cn("space-y-6 sm:space-y-8", className)}
      aria-label="기본 정보"
    >
      {/* 관광지명 */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">{detail.title}</h1>

        {/* 관광 타입 뱃지 */}
        {detail.contenttypeid && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
              {contentTypeNames[detail.contenttypeid] || "기타"}
            </span>
          </div>
        )}
      </div>

      {/* 대표 이미지 */}
      {detail.firstimage && !imageError ? (
        <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden">
          <Image
            src={detail.firstimage}
            alt={detail.title}
            fill
            className="object-cover"
            priority
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
        </div>
      ) : (
        <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          <p className="text-muted-foreground">이미지 없음</p>
        </div>
      )}

      {/* 주소 */}
      {fullAddress && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              주소
            </p>
            <p className="text-base">{fullAddress}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAddress}
            className="min-h-[44px] min-w-[44px] sm:min-w-[100px]"
            aria-label="주소 복사"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">복사됨</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">복사</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* 전화번호 */}
      {detail.tel && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            전화번호
          </p>
          <a
            href={`tel:${detail.tel}`}
            className="inline-flex items-center gap-2 text-base hover:text-primary transition-colors min-h-[44px]"
            aria-label={`${detail.tel}로 전화하기`}
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span>{detail.tel}</span>
          </a>
        </div>
      )}

      {/* 홈페이지 */}
      {homepageUrl && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            홈페이지
          </p>
          <a
            href={homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-base hover:text-primary transition-colors break-all min-h-[44px]"
            aria-label={`${detail.title} 홈페이지 열기 (새 창)`}
          >
            <ExternalLink className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span className="break-all">{homepageUrl}</span>
          </a>
        </div>
      )}

      {/* 개요 */}
      {detail.overview && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            개요
          </p>
          <div className="prose prose-sm max-w-none">
            <p className="text-base text-muted-foreground whitespace-pre-line leading-relaxed">
              {detail.overview}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

