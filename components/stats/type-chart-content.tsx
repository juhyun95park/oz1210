/**
 * @file type-chart-content.tsx
 * @description 타입별 관광지 분포 차트 데이터 로딩 컴포넌트
 *
 * 이 파일은 Server Component로 타입별 통계 데이터를 로드합니다.
 *
 * @dependencies
 * - lib/api/stats-api.ts: getTypeStats 함수
 * - components/stats/type-chart.tsx: TypeChart 컴포넌트
 */

import dynamic from "next/dynamic";
import { getTypeStats } from "@/lib/api/stats-api";
import { TypeChartSkeleton } from "./type-chart";

// recharts는 클라이언트 사이드에서만 동작하므로 dynamic import로 lazy loading
const TypeChart = dynamic(() => import("./type-chart").then((mod) => ({ default: mod.TypeChart })), {
  loading: () => <TypeChartSkeleton />,
  ssr: false,
});

/**
 * 타입별 통계 데이터 로딩 컴포넌트
 * Server Component로 getTypeStats() API를 호출하여 데이터를 로드합니다.
 * 에러 발생 시 Next.js error.tsx에서 처리됩니다.
 */
export async function TypeChartContent() {
  const data = await getTypeStats();
  return <TypeChart data={data} />;
}

