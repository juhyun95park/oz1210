/**
 * @file pagination.tsx
 * @description 페이지네이션 컴포넌트
 *
 * 이 컴포넌트는 페이지 번호 선택 방식의 페이지네이션을 제공합니다.
 *
 * 주요 기능:
 * 1. 페이지 번호 선택
 * 2. 이전/다음 버튼
 * 3. 현재 페이지 하이라이트
 * 4. 반응형 디자인 (모바일에서는 간소화)
 * 5. 키보드 네비게이션 지원 (Tab, Enter, 화살표 키)
 * 6. ARIA 라벨 추가
 *
 * @dependencies
 * - components/ui/button.tsx: Button 컴포넌트
 * - lucide-react: ChevronLeft, ChevronRight 아이콘
 *
 * @see {@link /docs/PRD.MD} - 페이지네이션 요구사항 참고
 */

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  /**
   * 현재 페이지 번호 (1부터 시작)
   */
  currentPage: number;
  /**
   * 전체 페이지 수
   */
  totalPages: number;
  /**
   * 페이지 변경 핸들러
   */
  onPageChange: (page: number) => void;
  /**
   * 추가 클래스명
   */
  className?: string;
  /**
   * 페이지네이션 라벨 (접근성)
   * @default "페이지네이션"
   */
  ariaLabel?: string;
}

/**
 * 페이지네이션 컴포넌트
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  ariaLabel = "페이지네이션",
}: PaginationProps) {
  // 페이지가 1개 이하이면 표시하지 않음
  if (totalPages <= 1) {
    return null;
  }

  // 이전 페이지로 이동
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  // 다음 페이지로 이동
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // 특정 페이지로 이동
  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    page: number
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlePageClick(page);
    } else if (e.key === "ArrowLeft" && page === currentPage) {
      e.preventDefault();
      handlePrevious();
    } else if (e.key === "ArrowRight" && page === currentPage) {
      e.preventDefault();
      handleNext();
    }
  };

  // 표시할 페이지 번호 계산
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // 최대 표시할 페이지 수

    if (totalPages <= maxVisible) {
      // 전체 페이지가 적으면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지 주변 페이지 계산
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      // 시작 부분 조정
      if (endPage - startPage < maxVisible - 1) {
        if (startPage === 1) {
          endPage = Math.min(totalPages, startPage + maxVisible - 1);
        } else {
          startPage = Math.max(1, endPage - maxVisible + 1);
        }
      }

      // 첫 페이지
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push("ellipsis-start");
        }
      }

      // 중간 페이지들
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // 마지막 페이지
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push("ellipsis-end");
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={cn("flex items-center justify-center gap-1", className)}
      aria-label={ariaLabel}
      role="navigation"
    >
      {/* 이전 버튼 */}
      <Button
        variant="outline"
        size="default"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        aria-label="이전 페이지"
        className="min-h-[44px] min-w-[44px] px-3 sm:px-4"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only sm:ml-1">이전</span>
      </Button>

      {/* 페이지 번호 버튼들 */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === "ellipsis-start" || page === "ellipsis-end") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-2 text-muted-foreground"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isCurrentPage = pageNum === currentPage;

          return (
            <Button
              key={pageNum}
              variant={isCurrentPage ? "default" : "outline"}
              size="default"
              onClick={() => handlePageClick(pageNum)}
              onKeyDown={(e) => handleKeyDown(e, pageNum)}
              aria-label={`${pageNum}페이지로 이동`}
              aria-current={isCurrentPage ? "page" : undefined}
              className={cn(
                "min-h-[44px] min-w-[44px]",
                // 모바일에서는 현재 페이지와 인접 페이지만 표시
                "hidden sm:inline-flex",
                // 현재 페이지는 항상 표시
                isCurrentPage && "inline-flex",
                // 인접 페이지도 표시 (현재 페이지 ±1)
                Math.abs(pageNum - currentPage) <= 1 && "inline-flex"
              )}
            >
              {pageNum}
            </Button>
          );
        })}
      </div>

      {/* 다음 버튼 */}
      <Button
        variant="outline"
        size="default"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        aria-label="다음 페이지"
        className="min-h-[44px] min-w-[44px] px-3 sm:px-4"
      >
        <span className="sr-only sm:not-sr-only sm:mr-1">다음</span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}

