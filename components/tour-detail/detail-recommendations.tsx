/**
 * @file detail-recommendations.tsx
 * @description 추천 관광지 섹션 컴포넌트
 *
 * 이 컴포넌트는 현재 관광지와 유사한 다른 관광지를 추천하는 섹션입니다.
 *
 * 주요 기능:
 * 1. 추천 관광지 목록을 카드 형태로 표시
 * 2. TourCard 컴포넌트 재사용
 * 3. 반응형 그리드 레이아웃
 * 4. 최대 6개 표시
 * 5. 빈 상태 처리
 *
 * 핵심 구현 로직:
 * - Server Component로 구현 (데이터 로딩은 상세페이지에서 처리)
 * - TourItem[] 배열을 받아서 표시
 * - 반응형 그리드 (모바일 1열, 태블릿 2열, 데스크톱 3열)
 *
 * @dependencies
 * - components/tour-card.tsx: TourCard 컴포넌트
 * - lib/types/tour.ts: TourItem 타입
 *
 * @see {@link /docs/PRD.MD} - 추천 관광지 섹션 요구사항 참고
 */

import { TourCard } from "@/components/tour-card";
import type { TourItem } from "@/lib/types/tour";
import { cn } from "@/lib/utils";

interface DetailRecommendationsProps {
  /**
   * 추천 관광지 목록
   */
  recommendations: TourItem[];
  /**
   * 추가 클래스명
   */
  className?: string;
}

/**
 * 추천 관광지 섹션 컴포넌트
 */
export function DetailRecommendations({
  recommendations,
  className,
}: DetailRecommendationsProps) {
  // 추천 관광지가 없는 경우 null 반환
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t", className)}
      aria-label="추천 관광지"
    >
      {/* 섹션 제목 */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">이런 관광지는 어떠세요?</h2>
        <p className="text-sm text-muted-foreground mt-2">
          같은 지역 또는 유사한 타입의 관광지를 추천합니다.
        </p>
      </div>

      {/* 추천 관광지 그리드 */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4 md:gap-6"
        role="list"
        aria-label="추천 관광지 목록"
      >
        {recommendations.map((tour) => (
          <div key={tour.contentid} role="listitem">
            <TourCard tour={tour} />
          </div>
        ))}
      </div>
    </section>
  );
}

