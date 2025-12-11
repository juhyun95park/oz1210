/**
 * @file mobile-map-tabs.tsx
 * @description 모바일 탭 전환 컴포넌트
 *
 * 이 컴포넌트는 모바일에서 리스트와 지도를 탭 형태로 전환할 수 있게 합니다.
 *
 * 주요 기능:
 * 1. 리스트/지도 탭 전환 UI
 * 2. 현재 활성 탭 표시
 * 3. 접근성 개선 (ARIA 라벨, 키보드 네비게이션)
 *
 * @dependencies
 * - components/tour-list: TourList 컴포넌트
 * - components/map-content-client: MapContentClient 컴포넌트
 *
 * @see {@link /docs/PRD.MD} - 모바일 UI 요구사항 참고
 */

"use client";

import { useState, ReactNode } from "react";
import { List, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileMapTabsProps {
  /**
   * 리스트 컴포넌트
   */
  listContent: ReactNode;
  /**
   * 지도 컴포넌트
   */
  mapContent: ReactNode;
}

type TabType = "list" | "map";

/**
 * 모바일 탭 전환 컴포넌트
 * PRD 요구사항: 모바일에서 탭 형태로 리스트/지도 전환
 */
export function MobileMapTabs({
  listContent,
  mapContent,
}: MobileMapTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("list");

  return (
    <div className="lg:hidden">
      {/* 탭 버튼 */}
      <div
        className="flex border-b border-border mb-4"
        role="tablist"
        aria-label="리스트 및 지도 전환"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "list"}
          aria-controls="mobile-list-panel"
          id="mobile-list-tab"
          onClick={() => setActiveTab("list")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "px-4 py-3",
            "font-medium text-sm",
            "border-b-2 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            activeTab === "list"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <List className="w-4 h-4" aria-hidden="true" />
          <span>리스트</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "map"}
          aria-controls="mobile-map-panel"
          id="mobile-map-tab"
          onClick={() => setActiveTab("map")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "px-4 py-3",
            "font-medium text-sm",
            "border-b-2 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            activeTab === "map"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <MapIcon className="w-4 h-4" aria-hidden="true" />
          <span>지도</span>
        </button>
      </div>

      {/* 탭 패널 */}
      <div className="space-y-4">
        <div
          id="mobile-list-panel"
          role="tabpanel"
          aria-labelledby="mobile-list-tab"
          hidden={activeTab !== "list"}
        >
          {activeTab === "list" && listContent}
        </div>
        <div
          id="mobile-map-panel"
          role="tabpanel"
          aria-labelledby="mobile-map-tab"
          hidden={activeTab !== "map"}
        >
          {activeTab === "map" && mapContent}
        </div>
      </div>
    </div>
  );
}

