/**
 * @file region-chart-content.tsx
 * @description 지역별 관광지 분포 차트 데이터 로딩 컴포넌트
 *
 * 이 파일은 Server Component로 지역별 통계 데이터를 로드합니다.
 *
 * @dependencies
 * - lib/api/stats-api.ts: getRegionStats 함수
 * - components/stats/region-chart.tsx: RegionChart 컴포넌트
 */

import dynamic from "next/dynamic";
import { getRegionStats } from "@/lib/api/stats-api";
import { RegionChartSkeleton } from "./region-chart";

// recharts는 클라이언트 사이드에서만 동작하므로 dynamic import로 lazy loading
const RegionChart = dynamic(() => import("./region-chart").then((mod) => ({ default: mod.RegionChart })), {
  loading: () => <RegionChartSkeleton />,
  ssr: false,
});

/**
 * 지역별 통계 데이터 로딩 컴포넌트
 * Server Component로 getRegionStats() API를 호출하여 데이터를 로드합니다.
 * 에러 발생 시 Next.js error.tsx에서 처리됩니다.
 */
export async function RegionChartContent() {
  const data = await getRegionStats();
  return <RegionChart data={data} />;
}

