/**
 * @file page.tsx
 * @description 통계 대시보드 페이지
 *
 * 이 페이지는 전국 관광지 데이터를 차트로 시각화하여 통계를 제공합니다.
 *
 * 주요 기능:
 * 1. 통계 요약 카드 (전체 관광지 수, Top 3 지역, Top 3 타입)
 * 2. 지역별 관광지 분포 차트 (Bar Chart)
 * 3. 타입별 관광지 분포 차트 (Donut Chart)
 *
 * 핵심 구현 로직:
 * - Server Component로 구현하여 SEO 최적화
 * - Suspense를 사용한 로딩 상태 처리
 * - 반응형 레이아웃 (모바일 우선)
 *
 * @dependencies
 * - lib/api/stats-api.ts: getStatsSummary 통계 데이터 집계 함수
 * - components/stats/stats-summary.tsx: StatsSummary, StatsSummarySkeleton 컴포넌트
 * - components/ui/error.tsx: Error 컴포넌트
 *
 * @see {@link /docs/PRD.MD} - 통계 대시보드 요구사항 참고
 */

import { Suspense } from "react";
import { getStatsSummary } from "@/lib/api/stats-api";
import { StatsSummary, StatsSummarySkeleton } from "@/components/stats/stats-summary";
import { RegionChartContent } from "@/components/stats/region-chart-content";
import { RegionChartSkeleton } from "@/components/stats/region-chart";
import { TypeChartContent } from "@/components/stats/type-chart-content";
import { TypeChartSkeleton } from "@/components/stats/type-chart";

/**
 * 통계 요약 카드 데이터 로딩 컴포넌트
 * Server Component로 getStatsSummary() API를 호출하여 데이터를 로드합니다.
 * 에러 발생 시 Next.js error.tsx에서 처리됩니다.
 */
async function StatsSummaryContent() {
  const data = await getStatsSummary();
  return <StatsSummary data={data} />;
}

export default async function StatsPage() {
  return (
    <main
      className="min-h-[calc(100vh-4rem)] container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      role="main"
      aria-label="통계 대시보드"
    >
      {/* 페이지 제목 섹션 */}
      <section
        className="mb-6 sm:mb-8"
        aria-label="페이지 제목"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          통계 대시보드
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          전국 관광지 데이터를 차트로 시각화하여 한눈에 파악할 수 있습니다.
        </p>
      </section>

      {/* 통계 컴포넌트 영역 */}
      <section
        className="space-y-8 sm:space-y-12"
        aria-label="통계 데이터"
      >
        {/* 통계 요약 카드 영역 */}
        <Suspense fallback={<StatsSummarySkeleton />}>
          <StatsSummaryContent />
        </Suspense>

        {/* 지역별 분포 차트 영역 */}
        <Suspense fallback={<RegionChartSkeleton />}>
          <RegionChartContent />
        </Suspense>

        {/* 타입별 분포 차트 영역 */}
        <Suspense fallback={<TypeChartSkeleton />}>
          <TypeChartContent />
        </Suspense>
      </section>
    </main>
  );
}

