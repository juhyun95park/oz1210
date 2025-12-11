/**
 * @file region-chart.tsx
 * @description 지역별 관광지 분포 차트 컴포넌트
 *
 * 이 컴포넌트는 통계 대시보드 페이지에서 지역별 관광지 개수를 Bar Chart로 시각화합니다.
 *
 * 주요 기능:
 * 1. 상위 10개 지역을 Bar Chart로 표시
 * 2. 바 클릭 시 해당 지역 목록 페이지로 이동
 * 3. 호버 시 Tooltip으로 정확한 개수 표시
 *
 * 핵심 구현 로직:
 * - Client Component로 차트 렌더링
 * - recharts 기반 Bar Chart 구현
 * - 다크/라이트 모드 자동 지원
 *
 * @dependencies
 * - lib/types/stats.ts: RegionStats 타입
 * - components/ui/chart.tsx: ChartContainer, ChartTooltip, ChartTooltipContent
 * - components/ui/card.tsx: Card, CardHeader, CardTitle, CardContent
 * - components/ui/skeleton.tsx: Skeleton
 * - recharts: BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
 *
 * @see {@link /docs/PRD.MD} - 통계 대시보드 요구사항 참고
 */

"use client";

import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { RegionStats } from "@/lib/types/stats";

// =====================================================
// Chart Config
// =====================================================

/**
 * 차트 설정 (색상, 라벨 등)
 */
const chartConfig = {
  count: {
    label: "관광지 개수",
    color: "hsl(var(--primary))",
  },
} satisfies {
  count: {
    label: string;
    color: string;
  };
};

// =====================================================
// RegionChart 컴포넌트
// =====================================================

interface RegionChartProps {
  /**
   * 지역별 통계 데이터
   */
  data: RegionStats[];
}

/**
 * 지역별 관광지 분포 Bar Chart 컴포넌트
 * 상위 10개 지역을 가로형 Bar Chart로 표시합니다.
 */
export function RegionChart({ data }: RegionChartProps) {
  const router = useRouter();

  // 상위 10개 지역 추출 (count 기준 내림차순 정렬)
  const topRegions = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((region) => ({
      name: region.name,
      count: region.count,
      areaCode: region.areaCode,
    }));

  // 빈 데이터 처리
  if (topRegions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl font-bold">
              지역별 관광지 분포
            </CardTitle>
            <MapPin className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            데이터가 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 바 클릭 핸들러 (해당 지역 목록 페이지로 이동)
  const handleBarClick = (data: { areaCode: string } | undefined) => {
    if (!data?.areaCode) return;
    router.push(`/?areaCode=${data.areaCode}`);
  };

  return (
    <Card role="article" aria-label="지역별 관광지 분포 차트">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl sm:text-2xl font-bold">
            지역별 관광지 분포
          </CardTitle>
          <MapPin className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          상위 10개 지역의 관광지 개수를 표시합니다.
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] sm:h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topRegions}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              role="img"
              aria-label="지역별 관광지 분포 차트"
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                tickFormatter={(value) => value.toLocaleString()}
                className="text-xs"
              />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <ChartTooltipContent
                      active={active}
                      payload={payload}
                      labelFormatter={() => data.name}
                      formatter={(value) => [
                        `${value?.toLocaleString()}개`,
                        "관광지 개수",
                      ]}
                    />
                  );
                }}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[0, 4, 4, 0]}
                onClick={(data) => handleBarClick(data)}
                style={{ cursor: "pointer" }}
                role="button"
                aria-label={(entry) =>
                  `${entry.name}: ${entry.count.toLocaleString()}개 관광지`
                }
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* 접근성을 위한 데이터 테이블 (스크린 리더용) */}
        <div className="sr-only" role="table" aria-label="지역별 관광지 개수 데이터">
          <div role="row">
            <div role="columnheader">지역명</div>
            <div role="columnheader">관광지 개수</div>
          </div>
          {topRegions.map((region) => (
            <div key={region.areaCode} role="row">
              <div role="cell">{region.name}</div>
              <div role="cell">{region.count.toLocaleString()}개</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// RegionChartSkeleton 컴포넌트
// =====================================================

/**
 * 지역별 분포 차트 스켈레톤 컴포넌트
 * 로딩 중 차트 영역의 플레이스홀더를 표시합니다.
 */
export function RegionChartSkeleton() {
  return (
    <Card role="article" aria-label="지역별 관광지 분포 차트 로딩 중">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[400px] sm:h-[500px] w-full" />
      </CardContent>
    </Card>
  );
}
