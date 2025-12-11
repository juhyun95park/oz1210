/**
 * @file map-content-client.tsx
 * @description 지도 클라이언트 컴포넌트
 *
 * 이 컴포넌트는 Server Component에서 지도를 렌더링하기 위한 클라이언트 컴포넌트 래퍼입니다.
 *
 * 주요 기능:
 * 1. NaverMap 컴포넌트를 클라이언트 사이드에서 렌더링
 * 2. TourHoverProvider Context를 통해 호버 상태 자동 연동
 *
 * @dependencies
 * - components/naver-map: NaverMap 컴포넌트
 * - lib/types/tour: TourItem 타입
 */

"use client";

import dynamic from "next/dynamic";
import type { TourItem } from "@/lib/types/tour";
import { Skeleton } from "@/components/ui/skeleton";

// Naver Maps는 큰 번들이므로 dynamic import로 lazy loading
const NaverMap = dynamic(() => import("@/components/naver-map").then((mod) => ({ default: mod.NaverMap })), {
  loading: () => (
    <div className="h-full bg-muted rounded-lg flex items-center justify-center">
      <Skeleton className="w-full h-full" />
    </div>
  ),
  ssr: false,
});

interface MapContentClientProps {
  /**
   * 관광지 목록
   */
  tours: TourItem[];
  /**
   * 지역 코드 (선택된 지역의 중심 좌표를 초기 중심으로 사용)
   */
  areaCode?: string;
}

/**
 * 지도 클라이언트 컴포넌트 (호버 상태 연동용)
 * Context를 통해 호버 상태를 자동으로 받아옵니다.
 */
export function MapContentClient({ tours, areaCode }: MapContentClientProps) {
  if (!tours || tours.length === 0) {
    return (
      <div className="h-full bg-muted rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">표시할 관광지가 없습니다.</p>
      </div>
    );
  }

  return <NaverMap tours={tours} areaCode={areaCode} />;
}

