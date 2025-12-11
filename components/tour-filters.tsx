/**
 * @file tour-filters.tsx
 * @description 관광지 필터 컴포넌트
 *
 * 이 컴포넌트는 관광지 목록을 필터링하는 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 지역 필터 (시/도 선택)
 * 2. 관광 타입 필터 (다중 선택)
 * 3. 정렬 옵션 (최신순, 이름순)
 * 4. URL 쿼리 파라미터로 상태 관리
 *
 * @dependencies
 * - lib/api/tour-api.ts: getAreaCode 함수
 * - lib/types/tour.ts: AreaCode, CONTENT_TYPE 타입
 * - components/ui/button.tsx: Button 컴포넌트
 * - lucide-react: ChevronDown, X 아이콘
 *
 * @see {@link /docs/PRD.MD} - 필터 기능 요구사항 참고
 */

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAreaCode } from "@/lib/api/tour-api";
import { CONTENT_TYPE } from "@/lib/types/tour";
import type { AreaCode } from "@/lib/types/tour";
import { cn } from "@/lib/utils";

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
 * 정렬 옵션
 */
const SORT_OPTIONS = {
  LATEST: "latest", // 최신순 (modifiedtime)
  NAME: "name", // 이름순 (가나다)
} as const;

type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS];

interface TourFiltersProps {
  /**
   * 추가 클래스명
   */
  className?: string;
}

/**
 * 관광지 필터 컴포넌트
 */
export function TourFilters({ className }: TourFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [areaCodes, setAreaCodes] = useState<AreaCode[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  // 현재 필터 값
  const currentAreaCode = searchParams.get("areaCode") || "";
  const currentContentTypeIds = searchParams
    .getAll("contentTypeId")
    .filter(Boolean);
  const currentSort = (searchParams.get("sort") || SORT_OPTIONS.LATEST) as SortOption;

  // 지역 목록 로드
  useEffect(() => {
    async function loadAreaCodes() {
      try {
        setIsLoadingAreas(true);
        const codes = await getAreaCode({ numOfRows: 20 });
        setAreaCodes(codes);
      } catch (error) {
        console.error("지역코드 로드 실패:", error);
      } finally {
        setIsLoadingAreas(false);
      }
    }
    loadAreaCodes();
  }, []);

  // 필터 업데이트 함수 (useCallback으로 최적화)
  const updateFilters = useCallback((
    updates: {
      areaCode?: string;
      contentTypeId?: string[];
      sort?: SortOption;
      resetPage?: boolean;
    }
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    // areaCode 업데이트
    if (updates.areaCode !== undefined) {
      if (updates.areaCode) {
        params.set("areaCode", updates.areaCode);
      } else {
        params.delete("areaCode");
      }
    }

    // contentTypeId 업데이트
    if (updates.contentTypeId !== undefined) {
      params.delete("contentTypeId");
      updates.contentTypeId.forEach((id) => {
        params.append("contentTypeId", id);
      });
    }

    // sort 업데이트
    if (updates.sort !== undefined) {
      if (updates.sort === SORT_OPTIONS.LATEST) {
        params.delete("sort");
      } else {
        params.set("sort", updates.sort);
      }
    }

    // 페이지 리셋
    if (updates.resetPage !== false) {
      params.delete("page");
    }

    router.push(`/?${params.toString()}`);
  }, [searchParams, router]);

  // 지역 필터 변경 (useCallback으로 최적화)
  const handleAreaChange = useCallback((code: string) => {
    updateFilters({ areaCode: code === "all" ? "" : code });
    setIsAreaDropdownOpen(false);
  }, [updateFilters]);

  // 관광 타입 필터 토글 (useCallback으로 최적화)
  const handleTypeToggle = useCallback((typeId: string) => {
    const newTypes = currentContentTypeIds.includes(typeId)
      ? currentContentTypeIds.filter((id) => id !== typeId)
      : [...currentContentTypeIds, typeId];

    updateFilters({ contentTypeId: newTypes });
  }, [currentContentTypeIds, updateFilters]);

  // 관광 타입 필터 전체 해제 (useCallback으로 최적화)
  const handleTypeClear = useCallback(() => {
    updateFilters({ contentTypeId: [] });
    setIsTypeDropdownOpen(false);
  }, [updateFilters]);

  // 정렬 옵션 변경 (useCallback으로 최적화)
  const handleSortChange = useCallback((sort: SortOption) => {
    updateFilters({ sort });
  }, [updateFilters]);

  // 선택된 지역명 (useMemo로 최적화)
  const selectedAreaName = useMemo(() => {
    return currentAreaCode && areaCodes.length > 0
      ? areaCodes.find((area) => area.code === currentAreaCode)?.name || "전체"
      : "전체";
  }, [currentAreaCode, areaCodes]);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 bg-muted/50 rounded-lg",
        className
      )}
      role="group"
      aria-label="관광지 필터"
    >
      {/* 지역 필터 */}
      <div className="relative flex-1 min-w-0">
        <label
          htmlFor="area-filter"
          className="block text-sm font-medium mb-2"
        >
          지역
        </label>
        <div className="relative">
          <Button
            id="area-filter"
            variant="outline"
            className="w-full justify-between min-h-[44px]"
            onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
            aria-expanded={isAreaDropdownOpen}
            aria-haspopup="listbox"
          >
            <span className="truncate">
              {isLoadingAreas ? "로딩 중..." : selectedAreaName}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isAreaDropdownOpen && "rotate-180"
              )}
              aria-hidden="true"
            />
          </Button>
          {isAreaDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsAreaDropdownOpen(false)}
                aria-hidden="true"
              />
              <div
                className="absolute z-20 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto"
                role="listbox"
              >
                <button
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors min-h-[44px]",
                    !currentAreaCode && "bg-accent font-medium"
                  )}
                  onClick={() => handleAreaChange("all")}
                  role="option"
                  aria-selected={!currentAreaCode}
                >
                  전체
                </button>
                {areaCodes.map((area) => (
                  <button
                    key={area.code}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors min-h-[44px]",
                      currentAreaCode === area.code && "bg-accent font-medium"
                    )}
                    onClick={() => handleAreaChange(area.code)}
                    role="option"
                    aria-selected={currentAreaCode === area.code}
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 관광 타입 필터 */}
      <div className="relative flex-1 min-w-0">
        <label
          htmlFor="type-filter"
          className="block text-sm font-medium mb-2"
        >
          관광 타입
        </label>
        <div className="relative">
          <Button
            id="type-filter"
            variant="outline"
            className="w-full justify-between min-h-[44px]"
            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
            aria-expanded={isTypeDropdownOpen}
            aria-haspopup="listbox"
          >
            <span className="truncate">
              {currentContentTypeIds.length === 0
                ? "전체"
                : currentContentTypeIds.length === 1
                  ? contentTypeNames[currentContentTypeIds[0]] || "선택됨"
                  : `${currentContentTypeIds.length}개 선택`}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isTypeDropdownOpen && "rotate-180"
              )}
              aria-hidden="true"
            />
          </Button>
          {isTypeDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsTypeDropdownOpen(false)}
                aria-hidden="true"
              />
              <div
                className="absolute z-20 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto"
                role="listbox"
              >
                {currentContentTypeIds.length > 0 && (
                  <div className="sticky top-0 bg-background border-b px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {currentContentTypeIds.length}개 선택됨
                    </span>
                    <button
                      onClick={handleTypeClear}
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 min-h-[44px] px-2"
                      aria-label="모든 타입 선택 해제"
                    >
                      <X className="h-4 w-4" />
                      전체 해제
                    </button>
                  </div>
                )}
                {Object.entries(CONTENT_TYPE).map(([, value]) => (
                  <button
                    key={value}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors min-h-[44px] flex items-center gap-2",
                      currentContentTypeIds.includes(value) &&
                        "bg-accent font-medium"
                    )}
                    onClick={() => handleTypeToggle(value)}
                    role="option"
                    aria-selected={currentContentTypeIds.includes(value)}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 border rounded flex items-center justify-center",
                        currentContentTypeIds.includes(value) &&
                          "bg-primary border-primary"
                      )}
                    >
                      {currentContentTypeIds.includes(value) && (
                        <span className="text-primary-foreground text-xs">✓</span>
                      )}
                    </span>
                    {contentTypeNames[value]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 정렬 옵션 */}
      <div className="flex-1 min-w-0">
        <label
          htmlFor="sort-filter"
          className="block text-sm font-medium mb-2"
        >
          정렬
        </label>
        <div className="flex gap-2">
          <Button
            id="sort-filter"
            variant={currentSort === SORT_OPTIONS.LATEST ? "default" : "outline"}
            className="flex-1 min-h-[44px]"
            onClick={() => handleSortChange(SORT_OPTIONS.LATEST)}
            aria-pressed={currentSort === SORT_OPTIONS.LATEST}
          >
            최신순
          </Button>
          <Button
            variant={currentSort === SORT_OPTIONS.NAME ? "default" : "outline"}
            className="flex-1 min-h-[44px]"
            onClick={() => handleSortChange(SORT_OPTIONS.NAME)}
            aria-pressed={currentSort === SORT_OPTIONS.NAME}
          >
            이름순
          </Button>
        </div>
      </div>
    </div>
  );
}

