/**
 * @file page.tsx
 * @description My Trip 홈페이지 - 관광지 목록
 *
 * 이 페이지는 전국 관광지 목록을 표시하는 홈페이지입니다.
 *
 * 주요 기능:
 * 1. 관광지 목록 표시 (필터링, 검색 지원)
 * 2. 네이버 지도 연동 (Phase 2.2에서 구현)
 * 3. 필터 기능 (Phase 2.3에서 구현)
 * 4. 검색 기능 (Phase 2.3에서 구현)
 *
 * 핵심 구현 로직:
 * - Server Component로 구현하여 SEO 최적화
 * - searchParams를 통한 필터 상태 관리
 * - 초기 데이터 로딩 (getAreaBasedList API)
 * - 반응형 레이아웃 (모바일 우선)
 *
 * @dependencies
 * - lib/api/tour-api.ts: getAreaBasedList 함수
 * - lib/types/tour.ts: TourItem, TourListResponse 타입
 * - components/ui/skeleton.tsx: 로딩 상태 UI
 * - components/ui/error.tsx: 에러 상태 UI
 *
 * @see {@link /docs/PRD.MD} - 홈페이지 요구사항 참고
 */

import { Suspense } from "react";
import { getAreaBasedList, searchKeyword } from "@/lib/api/tour-api";
import { TourAPIError } from "@/lib/api/tour-api";
import { Error } from "@/components/ui/error";
import { TourList } from "@/components/tour-list";
import { TourFilters } from "@/components/tour-filters";
import { TourSearch } from "@/components/tour-search";
import { NaverMap } from "@/components/naver-map";
import type { TourListResponse } from "@/lib/types/tour";

interface HomePageProps {
  searchParams: Promise<{
    areaCode?: string;
    contentTypeId?: string | string[];
    keyword?: string;
    page?: string;
    mode?: string;
    sort?: string;
  }>;
}

/**
 * 지도 컴포넌트용 데이터 로딩
 */
async function MapContent({
  areaCode,
  contentTypeId,
  keyword,
  page,
  mode,
}: {
  areaCode?: string;
  contentTypeId?: string | string[];
  keyword?: string;
  page?: string;
  mode?: string;
}) {
  try {
    const pageNo = Math.max(1, parseInt(page || "1", 10));
    const numOfRows = 12;

    const contentTypeIds = Array.isArray(contentTypeId)
      ? contentTypeId
      : contentTypeId
        ? [contentTypeId]
        : undefined;

    const singleContentTypeId = contentTypeIds?.[0];

    let data: TourListResponse;

    if (keyword && keyword.trim()) {
      data = await searchKeyword({
        keyword: keyword.trim(),
        areaCode,
        contentTypeId: singleContentTypeId,
        numOfRows,
        pageNo,
      });
    } else {
      data = await getAreaBasedList({
        areaCode,
        contentTypeId: singleContentTypeId,
        numOfRows,
        pageNo,
      });
    }

    if (data.items.length === 0) {
      return (
        <div className="h-full bg-muted rounded-lg flex items-center justify-center">
          <p className="text-sm text-muted-foreground">표시할 관광지가 없습니다.</p>
        </div>
      );
    }

    return <NaverMap tours={data.items} />;
  } catch (error) {
    return (
      <div className="h-full bg-muted rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">지도를 불러올 수 없습니다.</p>
      </div>
    );
  }
}

/**
 * 관광지 목록 컴포넌트
 * Server Component로 데이터 로딩
 */
async function TourListContent({
  areaCode,
  contentTypeId,
  keyword,
  page,
  mode,
}: {
  areaCode?: string;
  contentTypeId?: string | string[];
  keyword?: string;
  page?: string;
  mode?: string;
}) {
  try {
    // 페이지 번호 파싱 (1부터 시작)
    const pageNo = Math.max(1, parseInt(page || "1", 10));
    const numOfRows = 12; // 페이지당 항목 수

    // contentTypeId 배열 처리
    const contentTypeIds = Array.isArray(contentTypeId)
      ? contentTypeId
      : contentTypeId
        ? [contentTypeId]
        : undefined;

    // 첫 번째 contentTypeId만 사용 (API는 단일 값만 지원)
    const singleContentTypeId = contentTypeIds?.[0];

    let data: TourListResponse;

    // 키워드 검색이 있으면 searchKeyword 사용, 없으면 getAreaBasedList 사용
    if (keyword && keyword.trim()) {
      data = await searchKeyword({
        keyword: keyword.trim(),
        areaCode,
        contentTypeId: singleContentTypeId,
        numOfRows,
        pageNo,
      });
    } else {
      data = await getAreaBasedList({
        areaCode,
        contentTypeId: singleContentTypeId,
        numOfRows,
        pageNo,
      });
    }

    return (
      <TourList
        data={data}
        mode={mode === "infinite" ? "infinite" : "pagination"}
      />
    );
  } catch (error) {
    if (error instanceof TourAPIError) {
      return (
        <Error
          title="데이터를 불러올 수 없습니다"
          message={error.message}
        />
      );
    }
    return (
      <Error
        title="오류가 발생했습니다"
        message="관광지 목록을 불러오는 중 문제가 발생했습니다."
      />
    );
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // Next.js 15에서는 searchParams가 Promise이므로 await 필요
  const params = await searchParams;

  const { areaCode, contentTypeId, keyword, page, mode } = params;
  const displayMode = mode === "infinite" ? "infinite" : "pagination";

  return (
    <main
      className="min-h-[calc(100vh-4rem)] container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      role="main"
      aria-label="관광지 목록"
    >
      {/* 검색 영역 */}
      <section
        className="mb-6 sm:mb-8"
        aria-label="검색"
      >
        <TourSearch placement="main" />
      </section>

      {/* 필터 영역 */}
      <section
        className="mb-6 sm:mb-8"
        aria-label="필터"
      >
        <TourFilters />
      </section>

      {/* 목록 및 지도 영역 */}
      <section
        className="space-y-6"
        aria-label="관광지 목록 및 지도"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {keyword ? `"${keyword}" 검색 결과` : "전국 관광지"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {keyword
              ? "검색 결과를 확인하세요."
              : "한국관광공사에서 제공하는 전국 관광지 정보를 확인하세요."}
          </p>
        </div>

        {/* 데스크톱: 리스트 + 지도 분할 레이아웃 */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
          <div>
            <Suspense fallback={<TourList isLoading />}>
              <TourListContent
                areaCode={areaCode}
                contentTypeId={contentTypeId}
                keyword={keyword}
                page={page}
                mode={displayMode}
              />
            </Suspense>
          </div>
          <div className="sticky top-20 h-[calc(100vh-8rem)]">
            <Suspense fallback={<div className="h-full bg-muted rounded-lg animate-pulse" />}>
              <MapContent
                areaCode={areaCode}
                contentTypeId={contentTypeId}
                keyword={keyword}
                page={page}
                mode={displayMode}
              />
            </Suspense>
          </div>
        </div>

        {/* 모바일/태블릿: 리스트만 표시 (지도는 TourListContent 내부에서 표시) */}
        <div className="lg:hidden">
          <Suspense fallback={<TourList isLoading />}>
            <TourListContent
              areaCode={areaCode}
              contentTypeId={contentTypeId}
              keyword={keyword}
              page={page}
              mode={displayMode}
            />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
