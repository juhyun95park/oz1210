/**
 * @file tour-list.tsx
 * @description 관광지 목록 컴포넌트
 *
 * 이 컴포넌트는 관광지 목록을 그리드 레이아웃으로 표시합니다.
 *
 * 주요 기능:
 * 1. 그리드 레이아웃 (반응형)
 * 2. 카드 목록 표시
 * 3. 로딩 상태 (Skeleton UI)
 * 4. 빈 상태 처리
 * 5. 페이지네이션/무한 스크롤 모드 지원
 *
 * @dependencies
 * - components/tour-card.tsx: TourCard 컴포넌트
 * - components/ui/skeleton.tsx: CardSkeleton 컴포넌트
 * - components/ui/pagination.tsx: Pagination 컴포넌트
 * - components/ui/loading.tsx: Loading 컴포넌트
 * - hooks/use-infinite-scroll.ts: useInfiniteScroll 훅
 * - lib/types/tour.ts: TourItem, TourListResponse 타입
 *
 * @see {@link /docs/PRD.MD} - 관광지 목록 요구사항 참고
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TourCard } from "@/components/tour-card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Loading } from "@/components/ui/loading";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import type { TourItem, TourListResponse } from "@/lib/types/tour";
import { cn } from "@/lib/utils";

interface TourListProps {
  /**
   * 관광지 목록 데이터
   */
  data?: TourListResponse;
  /**
   * 로딩 상태
   */
  isLoading?: boolean;
  /**
   * 추가 로딩 상태 (무한 스크롤용)
   */
  isLoadingMore?: boolean;
  /**
   * 에러 상태
   */
  error?: Error | null;
  /**
   * 다음 페이지 로드 함수 (무한 스크롤용)
   */
  onLoadMore?: () => void | Promise<void>;
  /**
   * 페이지 변경 핸들러 (페이지네이션용)
   */
  onPageChange?: (page: number) => void;
  /**
   * 표시 모드 ('pagination' | 'infinite')
   * @default 'pagination'
   */
  mode?: "pagination" | "infinite";
  /**
   * 추가 클래스명
   */
  className?: string;
}

/**
 * 관광지 목록 컴포넌트
 */
export function TourList({
  data,
  isLoading = false,
  isLoadingMore = false,
  error,
  onLoadMore,
  onPageChange,
  mode = "pagination",
  className,
}: TourListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 페이지 변경 핸들러 (URL 쿼리 파라미터 업데이트)
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/?${params.toString()}`);
  };

  // 무한 스크롤 훅
  const { sentinelRef, loadMore } = useInfiniteScroll({
    onLoadMore: onLoadMore || (() => {}),
    isLoading: isLoadingMore,
    hasMore: data ? data.items.length < data.totalCount : false,
    error,
    enabled: mode === "infinite" && !!onLoadMore,
  });

  // 현재 페이지 계산 (페이지네이션용)
  const currentPage = data?.pageNo || 1;
  const totalPages = data
    ? Math.ceil(data.totalCount / (data.numOfRows || 10))
    : 1;

  // 로딩 상태
  if (isLoading) {
    return (
      <div
        className={cn("space-y-4", className)}
        role="status"
        aria-label="관광지 목록 로딩 중"
      >
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!data || data.items.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12 text-center",
          className
        )}
        role="status"
        aria-label="관광지 없음"
      >
        <p className="text-muted-foreground mb-2">
          관광지가 없습니다.
        </p>
        <p className="text-sm text-muted-foreground">
          필터를 조정하거나 다른 검색어를 시도해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 결과 개수 및 모드 전환 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          총 <span className="font-semibold text-foreground">
            {data.totalCount.toLocaleString()}
          </span>
          개의 관광지가 있습니다.
        </p>
      </div>

      {/* 카드 그리드 - 반응형 및 터치 친화적 간격 */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4 md:gap-6"
        role="list"
        aria-label="관광지 목록"
      >
        {data.items.map((tour: TourItem) => (
          <div key={tour.contentid} role="listitem">
            <TourCard tour={tour} />
          </div>
        ))}
      </div>

      {/* 무한 스크롤 모드: 하단 로딩 인디케이터 */}
      {mode === "infinite" && (
        <>
          {isLoadingMore && (
            <div
              className="flex justify-center py-8"
              role="status"
              aria-label="추가 관광지 로딩 중"
            >
              <Loading size="md" message="더 많은 관광지를 불러오는 중..." />
            </div>
          )}
          <div
            ref={sentinelRef}
            className="h-4"
            aria-hidden="true"
          />
        </>
      )}

      {/* 페이지네이션 모드: 페이지네이션 컴포넌트 */}
      {mode === "pagination" && totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            ariaLabel="관광지 목록 페이지네이션"
          />
        </div>
      )}
    </div>
  );
}

