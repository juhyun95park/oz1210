/**
 * @file tour-hover-provider.tsx
 * @description 관광지 호버 상태 관리 Provider
 *
 * 이 Provider는 TourList와 NaverMap 간 호버 상태를 공유합니다.
 *
 * @dependencies
 * - React Context API
 */

"use client";

import * as React from "react";

interface TourHoverContextType {
  hoveredTourId: string | null;
  setHoveredTourId: (tourId: string | null) => void;
}

const TourHoverContext = React.createContext<TourHoverContextType | undefined>(undefined);

export function useTourHover() {
  const context = React.useContext(TourHoverContext);
  if (!context) {
    throw new Error("useTourHover must be used within TourHoverProvider");
  }
  return context;
}

/**
 * 안전한 버전의 useTourHover 훅
 * Context가 없어도 에러를 던지지 않고 undefined를 반환합니다.
 * TourList에서 선택적으로 사용할 수 있습니다.
 */
export function useTourHoverSafe() {
  const context = React.useContext(TourHoverContext);
  return context;
}

export function TourHoverProvider({ children }: { children: React.ReactNode }) {
  const [hoveredTourId, setHoveredTourId] = React.useState<string | null>(null);

  const value = React.useMemo(
    () => ({
      hoveredTourId,
      setHoveredTourId,
    }),
    [hoveredTourId]
  );

  return (
    <TourHoverContext.Provider value={value}>
      {children}
    </TourHoverContext.Provider>
  );
}

