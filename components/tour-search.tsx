/**
 * @file tour-search.tsx
 * @description 관광지 검색 컴포넌트
 *
 * 이 컴포넌트는 키워드로 관광지를 검색하는 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 검색창 UI
 * 2. 엔터 또는 버튼 클릭으로 검색
 * 3. 검색 중 로딩 스피너
 * 4. URL 쿼리 파라미터로 상태 관리
 *
 * @dependencies
 * - components/ui/input.tsx: Input 컴포넌트
 * - components/ui/button.tsx: Button 컴포넌트
 * - components/ui/loading.tsx: Loading 컴포넌트
 * - lucide-react: Search 아이콘
 *
 * @see {@link /docs/PRD.MD} - 검색 기능 요구사항 참고
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TourSearchProps {
  /**
   * 검색창 위치 ('header' | 'main')
   * @default 'main'
   */
  placement?: "header" | "main";
  /**
   * 추가 클래스명
   */
  className?: string;
}

/**
 * 관광지 검색 컴포넌트
 */
export function TourSearch({
  placement = "main",
  className,
}: TourSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // URL에서 초기 키워드 로드
  useEffect(() => {
    const urlKeyword = searchParams.get("keyword") || "";
    setKeyword(urlKeyword);
  }, [searchParams]);

  // 검색 실행
  const handleSearch = () => {
    if (isSearching) return;

    const params = new URLSearchParams(searchParams.toString());

    if (keyword.trim()) {
      params.set("keyword", keyword.trim());
    } else {
      params.delete("keyword");
    }

    // 검색 시 페이지 리셋
    params.delete("page");

    setIsSearching(true);
    router.push(`/?${params.toString()}`);
    
    // 검색 상태 리셋 (약간의 딜레이)
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  };

  // 엔터 키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // 검색어 초기화
  const handleClear = () => {
    setKeyword("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("keyword");
    params.delete("page");
    router.push(`/?${params.toString()}`);
  };

  const isHeaderPlacement = placement === "header";

  return (
    <div
      className={cn(
        "relative flex items-center gap-2",
        isHeaderPlacement ? "w-full max-w-md" : "w-full",
        className
      )}
      role="search"
      aria-label="관광지 검색"
    >
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="관광지명, 주소, 설명으로 검색..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "pl-10 pr-10 min-h-[44px]",
            isHeaderPlacement && "text-sm"
          )}
          aria-label="검색어 입력"
          disabled={isSearching}
        />
        {keyword && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="검색어 지우기"
            disabled={isSearching}
          >
            <span className="text-lg leading-none">×</span>
          </button>
        )}
      </div>
      <Button
        onClick={handleSearch}
        disabled={isSearching}
        className="min-h-[44px] min-w-[44px] sm:min-w-[80px]"
        aria-label="검색 실행"
      >
        {isSearching ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <>
            <Search className="h-4 w-4 sm:mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">검색</span>
          </>
        )}
      </Button>
    </div>
  );
}

