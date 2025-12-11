/**
 * @file desktop-list-map-wrapper.tsx
 * @description 데스크톱 레이아웃용 리스트와 지도 연동 래퍼
 *
 * 이 컴포넌트는 데스크톱에서 리스트와 지도를 분할하여 표시하고,
 * 호버 상태를 공유합니다.
 *
 * 주요 기능:
 * 1. 호버 상태 관리 (hoveredTourId)
 * 2. TourListContent와 MapContent 간 상태 연동
 */

"use client";

import { useState, ReactNode } from "react";

interface DesktopListMapWrapperProps {
  /**
   * 리스트 컴포넌트 (Server Component)
   */
  listContent: ReactNode;
  /**
   * 지도 컴포넌트 (Server Component)
   */
  mapContent: ReactNode;
}

/**
 * 데스크톱 레이아웃용 리스트와 지도 연동 래퍼
 */
export function DesktopListMapWrapper({
  listContent,
  mapContent,
}: DesktopListMapWrapperProps) {
  const [hoveredTourId, setHoveredTourId] = useState<string | null>(null);

  // listContent와 mapContent에 hoveredTourId를 전달하려면
  // React.cloneElement를 사용하거나, 다른 방식으로 처리해야 합니다.
  // 하지만 Server Component는 클라이언트 컴포넌트로 직접 prop을 전달할 수 없으므로,
  // 이 래퍼는 레이아웃만 제공하고, 실제 호버 상태는 각 컴포넌트 내부에서 처리합니다.

  return (
    <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
      <div>{listContent}</div>
      <div className="sticky top-20 h-[calc(100vh-8rem)]">{mapContent}</div>
    </div>
  );
}

