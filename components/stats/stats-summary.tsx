/**
 * @file stats-summary.tsx
 * @description 통계 요약 카드 컴포넌트
 *
 * 이 컴포넌트는 통계 대시보드 페이지에서 전체 관광지 수, Top 3 지역, Top 3 타입,
 * 마지막 업데이트 시간을 카드 형태로 표시합니다.
 *
 * 주요 기능:
 * 1. 전체 관광지 수 카드 (큰 숫자, 아이콘)
 * 2. Top 3 지역 카드 (순위, 지역명, 개수)
 * 3. Top 3 타입 카드 (순위, 타입명, 개수)
 * 4. 마지막 업데이트 시간 카드
 *
 * 핵심 구현 로직:
 * - Server Component로 구현 (데이터 로딩은 상위에서 처리)
 * - 반응형 그리드 레이아웃 (모바일 1열, 태블릿 2열, 데스크톱 4열)
 * - shadcn/ui Card 컴포넌트 사용
 * - lucide-react 아이콘 사용
 *
 * @dependencies
 * - components/ui/card: Card, CardHeader, CardTitle, CardContent
 * - components/ui/skeleton: Skeleton
 * - lib/types/stats: StatsSummary 타입
 * - lucide-react: MapPin, BarChart3, Clock, Trophy 아이콘
 *
 * @see {@link /docs/PRD.MD} - 통계 대시보드 요구사항 참고
 */

import { MapPin, BarChart3, Clock, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatsSummary } from "@/lib/types/stats";

// =====================================================
// 날짜 포맷팅 유틸리티
// =====================================================

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param date - 포맷팅할 날짜
 * @returns 한국어 형식의 날짜 문자열 (예: "2025년 1월 15일 14:30")
 */
function formatDateKorean(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// =====================================================
// StatsSummary 컴포넌트
// =====================================================

interface StatsSummaryProps {
  /**
   * 통계 요약 정보
   */
  data: StatsSummary;
}

/**
 * 통계 요약 카드 컴포넌트
 * 전체 관광지 수, Top 3 지역, Top 3 타입, 마지막 업데이트 시간을 표시합니다.
 */
export function StatsSummary({ data }: StatsSummaryProps) {
  const { totalCount, topRegions, topTypes, lastUpdated } = data;

  return (
    <section
      className="space-y-4 sm:space-y-6"
      aria-label="통계 요약"
    >
      {/* 반응형 그리드 레이아웃: 모바일 1열, 태블릿 2열, 데스크톱 4열 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* 전체 관광지 수 카드 */}
        <Card role="article" aria-label={`전체 관광지 ${totalCount.toLocaleString()}개`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                전체 관광지
              </CardTitle>
              <MapPin className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl sm:text-4xl font-bold">
              {totalCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">개</p>
          </CardContent>
        </Card>

        {/* Top 3 지역 카드 */}
        <Card role="article" aria-label="상위 3개 지역">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top 3 지역
              </CardTitle>
              <Trophy className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRegions.length > 0 ? (
                topRegions.map((region, index) => (
                  <div
                    key={region.areaCode}
                    className="flex items-center justify-between"
                    aria-label={`${index + 1}위: ${region.name} ${region.count.toLocaleString()}개`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {index + 1}
                      </span>
                      <span className="text-base font-semibold">{region.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {region.count.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">데이터 없음</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top 3 타입 카드 */}
        <Card role="article" aria-label="상위 3개 타입">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top 3 타입
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTypes.length > 0 ? (
                topTypes.map((type, index) => (
                  <div
                    key={type.contentTypeId}
                    className="flex items-center justify-between"
                    aria-label={`${index + 1}위: ${type.name} ${type.count.toLocaleString()}개`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {index + 1}
                      </span>
                      <span className="text-base font-semibold">{type.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {type.count.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">데이터 없음</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 마지막 업데이트 시간 카드 */}
        <Card role="article" aria-label={`마지막 업데이트: ${formatDateKorean(lastUpdated)}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                마지막 업데이트
              </CardTitle>
              <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-base font-semibold">
              {formatDateKorean(lastUpdated)}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// =====================================================
// StatsSummarySkeleton 컴포넌트
// =====================================================

/**
 * 통계 요약 카드 스켈레톤 컴포넌트
 * 로딩 중 4개 카드의 플레이스홀더를 표시합니다.
 */
export function StatsSummarySkeleton() {
  return (
    <section
      className="space-y-4 sm:space-y-6"
      aria-label="통계 요약 로딩 중"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* 전체 관광지 수 카드 스켈레톤 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-3 w-8" />
          </CardContent>
        </Card>

        {/* Top 3 지역 카드 스켈레톤 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-5 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 3 타입 카드 스켈레톤 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-5 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 마지막 업데이트 시간 카드 스켈레톤 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-5 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-40" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

