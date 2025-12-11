/**
 * @file bookmark-button.tsx
 * @description 북마크 버튼 컴포넌트
 *
 * 이 컴포넌트는 관광지를 북마크로 추가/제거하는 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 북마크 상태 확인 및 표시
 * 2. 북마크 추가/제거 토글
 * 3. Clerk 인증 확인
 * 4. 로그인하지 않은 경우 로그인 페이지로 리다이렉트
 * 5. 토스트 메시지 표시
 *
 * 핵심 구현 로직:
 * - Clerk 인증 상태 확인 (useAuth())
 * - Supabase 클라이언트 사용 (useClerkSupabaseClient)
 * - 북마크 상태 초기화 (useEffect)
 * - 북마크 토글 기능 (addBookmark/removeBookmark)
 *
 * @dependencies
 * - @clerk/nextjs: useAuth hook
 * - lib/supabase/clerk-client.ts: useClerkSupabaseClient hook
 * - lib/api/supabase-api.ts: getBookmark, addBookmark, removeBookmark 함수
 * - components/ui/button.tsx: Button 컴포넌트
 * - components/providers/toast-provider.tsx: useToast hook
 * - lucide-react: Star 아이콘
 *
 * @see {@link /docs/PRD.MD} - 북마크 기능 요구사항 참고
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import {
  getBookmark,
  addBookmark,
  removeBookmark,
} from "@/lib/api/supabase-api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface BookmarkButtonProps {
  /**
   * 관광지 contentId (필수)
   */
  contentId: string;
  /**
   * 추가 클래스명
   */
  className?: string;
  /**
   * 버튼 크기
   */
  size?: "default" | "sm" | "lg" | "icon";
  /**
   * 버튼 variant
   */
  variant?: "default" | "outline" | "ghost" | "secondary";
}

/**
 * 북마크 버튼 컴포넌트
 */
export function BookmarkButton({
  contentId,
  className,
  size = "sm",
  variant = "outline",
}: BookmarkButtonProps) {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const supabase = useClerkSupabaseClient();
  const { success, error: showError } = useToast();

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  /**
   * 북마크 상태 초기화
   */
  useEffect(() => {
    async function loadBookmarkStatus() {
      // Clerk 인증이 로드되지 않았거나 로그인하지 않은 경우
      if (!isLoaded || !userId) {
        setIsLoading(false);
        setIsBookmarked(false);
        return;
      }

      try {
        const bookmark = await getBookmark(supabase, userId, contentId);
        setIsBookmarked(!!bookmark);
      } catch (error) {
        console.error("북마크 상태 조회 실패:", error);
        // 에러가 발생해도 북마크되지 않은 것으로 처리
        setIsBookmarked(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadBookmarkStatus();
  }, [isLoaded, userId, contentId, supabase]);

  /**
   * 북마크 토글 기능
   */
  const handleToggle = async () => {
    // Clerk 인증이 로드되지 않은 경우
    if (!isLoaded) {
      return;
    }

    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    if (!userId) {
      router.push("/sign-in");
      return;
    }

    // 이미 토글 중인 경우 무시
    if (isToggling) {
      return;
    }

    setIsToggling(true);

    try {
      if (isBookmarked) {
        // 북마크 제거
        await removeBookmark(supabase, userId, contentId);
        setIsBookmarked(false);
        success("북마크가 제거되었습니다.");
      } else {
        // 북마크 추가
        await addBookmark(supabase, userId, contentId);
        setIsBookmarked(true);
        success("북마크에 추가되었습니다.");
      }
    } catch (error) {
      console.error("북마크 토글 실패:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "북마크 작업을 완료할 수 없습니다. 다시 시도해주세요.";
      showError(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  // 로딩 중일 때 스켈레톤 표시
  if (isLoading) {
    return (
      <Skeleton
        className={cn("min-h-[44px] min-w-[44px]", className)}
        aria-label="북마크 상태 로딩 중"
      />
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isToggling) {
          e.preventDefault();
          handleToggle();
        }
      }}
      disabled={isToggling}
      className={cn("min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", className)}
      aria-label={isBookmarked ? "북마크 제거" : "북마크 추가"}
      aria-pressed={isBookmarked}
    >
      {isBookmarked ? (
        <>
          <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" aria-hidden="true" />
          <span className="hidden sm:inline">북마크됨</span>
        </>
      ) : (
        <>
          <Star className="h-4 w-4 mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">북마크</span>
        </>
      )}
    </Button>
  );
}

