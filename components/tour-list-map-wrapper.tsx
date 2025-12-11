/**
 * @file tour-list-map-wrapper.tsx
 * @description 관광지 목록과 지도를 연동하는 클라이언트 컴포넌트 래퍼
 *
 * 이 컴포넌트는 TourList와 NaverMap 간 호버 상태를 공유합니다.
 *
 * 주요 기능:
 * 1. 호버 상태 관리 (hoveredTourId)
 * 2. TourList와 NaverMap 간 상태 연동
 *
 * @dependencies
 * - components/tour-list: TourList 컴포넌트
 * - components/naver-map: NaverMap 컴포넌트
 * - lib/types/tour: TourListResponse, TourItem 타입
 */

"use client";

import { useState } from "react";
import { TourList } from "@/components/tour-list";
import { NaverMap } from "@/components/naver-map";
import type { TourListResponse, TourItem } from "@/lib/types/tour";

interface TourListMapWrapperProps {
  /**
   * 관광지 목록 데이터
   */
  listData: TourListResponse;
  /**
   * 지도용 관광지 목록 데이터
   */
  mapData: TourItem[];
  /**
   * 표시 모드 ('pagination' | 'infinite')
   */
  mode?: "pagination" | "infinite";
}

/**
 * 관광지 목록과 지도를 연동하는 래퍼 컴포넌트
 */
export function TourListMapWrapper({
  listData,
  mapData,
  mode = "pagination",
}: TourListMapWrapperProps) {
  const [hoveredTourId, setHoveredTourId] = useState<string | null>(null);

  return (
    <>
      <TourList
        data={listData}
        mode={mode}
        onTourHover={setHoveredTourId}
      />
      <NaverMap tours={mapData} hoveredTourId={hoveredTourId} />
    </>
  );
}

