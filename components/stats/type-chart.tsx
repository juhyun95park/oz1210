/**
 * @file type-chart.tsx
 * @description 타입별 관광지 분포 차트 컴포넌트
 *
 * 이 컴포넌트는 통계 대시보드 페이지에서 타입별 관광지 개수를 Donut Chart로 시각화합니다.
 *
 * 주요 기능:
 * 1. 8개 타입별 비율을 Donut Chart로 표시
 * 2. 섹션 클릭 시 해당 타입 목록 페이지로 이동
 * 3. 호버 시 Tooltip으로 타입명, 개수, 비율 표시
 *
 * 핵심 구현 로직:
 * - Client Component로 차트 렌더링
 * - recharts 기반 PieChart 구현 (innerRadius로 Donut 형태)
 * - 다크/라이트 모드 자동 지원
 *
 * @dependencies
 * - lib/types/stats.ts: TypeStats 타입
 * - components/ui/chart.tsx: ChartContainer, ChartTooltip, ChartTooltipContent
 * - components/ui/card.tsx: Card, CardHeader, CardTitle, CardContent
 * - components/ui/skeleton.tsx: Skeleton
 * - recharts: PieChart, Pie, Cell, ResponsiveContainer
 *
 * @see {@link /docs/PRD.MD} - 통계 대시보드 요구사항 참고
 */

"use client";

import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { TypeStats } from "@/lib/types/stats";

// =====================================================
// Chart Config & Colors
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

/**
 * 타입별 색상 매핑 (8개 타입)
 * HSL 색상으로 구성하여 다크/라이트 모드에서 자동 조정
 */
const TYPE_COLORS = [
  "hsl(210, 100%, 50%)", // 관광지 - 파란색
  "hsl(280, 100%, 50%)", // 문화시설 - 보라색
  "hsl(340, 100%, 50%)", // 축제/행사 - 분홍색
  "hsl(160, 100%, 40%)", // 여행코스 - 청록색
  "hsl(30, 100%, 50%)", // 레포츠 - 주황색
  "hsl(200, 100%, 40%)", // 숙박 - 하늘색
  "hsl(0, 100%, 50%)", // 쇼핑 - 빨간색
  "hsl(50, 100%, 50%)", // 음식점 - 노란색
];

// =====================================================
// TypeChart 컴포넌트
// =====================================================

interface TypeChartProps {
  /**
   * 타입별 통계 데이터
   */
  data: TypeStats[];
}

/**
 * 타입별 관광지 분포 Donut Chart 컴포넌트
 * 8개 타입의 비율을 Donut Chart로 표시합니다.
 */
export function TypeChart({ data }: TypeChartProps) {
  const router = useRouter();

  // 빈 데이터 처리
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl font-bold">
              타입별 관광지 분포
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
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

  // 차트 데이터 준비 (count 기준 내림차순 정렬)
  const chartData = [...data]
    .sort((a, b) => b.count - a.count)
    .map((type, index) => ({
      name: type.name,
      value: type.count,
      percentage: type.percentage,
      contentTypeId: type.contentTypeId,
      fill: TYPE_COLORS[index % TYPE_COLORS.length],
    }));

  // 섹션 클릭 핸들러 (해당 타입 목록 페이지로 이동)
  const handlePieClick = (data: { contentTypeId: string } | undefined) => {
    if (!data?.contentTypeId) return;
    router.push(`/?contentTypeId=${data.contentTypeId}`);
  };

  return (
    <Card role="article" aria-label="타입별 관광지 분포 차트">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl sm:text-2xl font-bold">
            타입별 관광지 분포
          </CardTitle>
          <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          8개 관광 타입별 비율을 표시합니다.
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] sm:h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart role="img" aria-label="타입별 관광지 분포 차트">
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => {
                  // 비율이 5% 이상인 경우에만 레이블 표시 (겹침 방지)
                  if (percentage >= 5) {
                    return `${name}\n${percentage.toFixed(1)}%`;
                  }
                  return "";
                }}
                outerRadius={120}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                onClick={handlePieClick}
                style={{ cursor: "pointer" }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
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
                        `${value?.toLocaleString()}개 (${data.percentage.toFixed(2)}%)`,
                        "관광지 개수",
                      ]}
                    />
                  );
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => {
                  const data = entry.payload as (typeof chartData[0]) | undefined;
                  if (data) {
                    return `${value} (${data.percentage.toFixed(1)}%)`;
                  }
                  return value;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* 접근성을 위한 데이터 테이블 (스크린 리더용) */}
        <div className="sr-only" role="table" aria-label="타입별 관광지 개수 데이터">
          <div role="row">
            <div role="columnheader">타입명</div>
            <div role="columnheader">관광지 개수</div>
            <div role="columnheader">비율</div>
          </div>
          {chartData.map((item) => (
            <div key={item.contentTypeId} role="row">
              <div role="cell">{item.name}</div>
              <div role="cell">{item.value.toLocaleString()}개</div>
              <div role="cell">{item.percentage.toFixed(2)}%</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// TypeChartSkeleton 컴포넌트
// =====================================================

/**
 * 타입별 분포 차트 스켈레톤 컴포넌트
 * 로딩 중 차트 영역의 플레이스홀더를 표시합니다.
 */
export function TypeChartSkeleton() {
  return (
    <Card role="article" aria-label="타입별 관광지 분포 차트 로딩 중">
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

