/**
 * @file bookmark-list.tsx
 * @description 북마크 목록 컴포넌트
 *
 * 이 컴포넌트는 북마크한 관광지 목록을 표시하고 관리하는 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 북마크 목록 표시 (TourCard 재사용)
 * 2. 빈 상태 처리 (북마크 없을 때)
 * 3. 정렬 기능 (최신순, 이름순, 지역별)
 * 4. 개별 삭제 기능
 * 5. 일괄 삭제 기능
 *
 * 핵심 구현 로직:
 * - Client Component로 구현 (인터랙션 필요)
 * - TourCard 컴포넌트 재사용
 * - 정렬 상태 관리 (URL 쿼리 파라미터)
 * - 체크박스 선택 상태 관리
 * - 삭제 기능 (removeBookmark)
 *
 * @dependencies
 * - @clerk/nextjs: useAuth hook
 * - lib/supabase/clerk-client.ts: useClerkSupabaseClient hook
 * - lib/api/supabase-api.ts: removeBookmark 함수
 * - components/tour-card.tsx: TourCard 컴포넌트
 * - components/ui/button.tsx: Button 컴포넌트
 * - components/ui/dialog.tsx: Dialog 컴포넌트
 * - components/providers/toast-provider.tsx: useToast hook
 * - lucide-react: 아이콘
 *
 * @see {@link /docs/PRD.MD} - 북마크 목록 페이지 요구사항 참고
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Trash2, X, ArrowUpDown } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { TourCard } from "@/components/tour-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/providers/toast-provider";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { removeBookmark } from "@/lib/api/supabase-api";
import type { TourItem } from "@/lib/types/tour";
import { cn } from "@/lib/utils";

/**
 * 북마크와 관광지 정보를 결합한 타입
 */
interface BookmarkWithTour {
  bookmarkId: string;
  contentId: string;
  createdAt: string;
  tour: TourItem;
}

interface BookmarkListProps {
  /**
   * 관광지 목록
   */
  tours: TourItem[];
  /**
   * 북마크 정보 (선택 사항, 정렬 및 삭제에 사용)
   */
  bookmarks?: BookmarkWithTour[];
}

/**
 * 정렬 옵션 타입
 */
type SortOption = "latest" | "name" | "region";

/**
 * 북마크 목록 컴포넌트
 */
export function BookmarkList({ tours, bookmarks = [] }: BookmarkListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const supabase = useClerkSupabaseClient();
  const { addToast } = useToast();

  // 정렬 옵션 (URL 쿼리 파라미터에서 가져오기)
  const sortParam = searchParams.get("sort") || "latest";
  const [sort, setSort] = useState<SortOption>(
    (sortParam as SortOption) || "latest"
  );

  // 체크박스 선택 상태
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // 삭제 다이얼로그 상태
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 북마크 목록 상태 (삭제 후 업데이트)
  const [bookmarkList, setBookmarkList] = useState<BookmarkWithTour[]>(
    bookmarks.length > 0
      ? bookmarks
      : tours.map((tour, index) => ({
          bookmarkId: `temp-${index}`,
          contentId: tour.contentid,
          createdAt: new Date().toISOString(),
          tour,
        }))
  );

  // 정렬된 목록
  const sortedTours = useMemo(() => {
    const toursWithBookmarks = bookmarkList.map((item) => item.tour);

    switch (sort) {
      case "name":
        return [...toursWithBookmarks].sort((a, b) =>
          a.title.localeCompare(b.title, "ko")
        );
      case "region":
        return [...toursWithBookmarks].sort((a, b) =>
          a.areacode.localeCompare(b.areacode)
        );
      case "latest":
      default:
        return [...toursWithBookmarks].sort((a, b) => {
          const bookmarkA = bookmarkList.find(
            (item) => item.tour.contentid === a.contentid
          );
          const bookmarkB = bookmarkList.find(
            (item) => item.tour.contentid === b.contentid
          );
          if (!bookmarkA || !bookmarkB) return 0;
          return (
            new Date(bookmarkB.createdAt).getTime() -
            new Date(bookmarkA.createdAt).getTime()
          );
        });
    }
  }, [bookmarkList, sort]);

  // 정렬 변경 핸들러
  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    router.push(`/bookmarks?${params.toString()}`);
  };

  // 체크박스 토글
  const toggleSelect = (contentId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(contentId)) {
      newSelected.delete(contentId);
    } else {
      newSelected.add(contentId);
    }
    setSelectedIds(newSelected);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.size === sortedTours.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedTours.map((tour) => tour.contentid)));
    }
  };

  // 개별 삭제
  const handleDelete = async (contentId: string) => {
    if (!userId) {
      addToast({
        type: "error",
        title: "로그인이 필요합니다",
        message: "북마크를 삭제하려면 로그인해주세요.",
      });
      return;
    }

    try {
      await removeBookmark(supabase, userId, contentId);

      // 목록에서 제거 (optimistic update)
      setBookmarkList((prev) =>
        prev.filter((item) => item.contentId !== contentId)
      );
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(contentId);
        return newSet;
      });

      addToast({
        type: "success",
        title: "북마크 삭제 완료",
        message: "북마크가 삭제되었습니다.",
      });
    } catch (error) {
      console.error("북마크 삭제 실패:", error);
      addToast({
        type: "error",
        title: "삭제 실패",
        message: "북마크를 삭제할 수 없습니다. 다시 시도해주세요.",
      });
    }
  };

  // 일괄 삭제
  const handleBatchDelete = async () => {
    if (!userId || selectedIds.size === 0) {
      return;
    }

    setIsDeleting(true);

    try {
      // 병렬로 삭제
      const deletePromises = Array.from(selectedIds).map((contentId) =>
        removeBookmark(supabase, userId, contentId)
      );

      await Promise.all(deletePromises);

      // 삭제된 개수 저장 (상태 업데이트 전에)
      const deletedCount = selectedIds.size;

      // 목록에서 제거
      setBookmarkList((prev) =>
        prev.filter((item) => !selectedIds.has(item.contentId))
      );
      setSelectedIds(new Set());
      setIsSelectMode(false);
      setIsDeleteDialogOpen(false);

      addToast({
        type: "success",
        title: "북마크 삭제 완료",
        message: `${deletedCount}개의 북마크가 삭제되었습니다.`,
      });
    } catch (error) {
      console.error("일괄 삭제 실패:", error);
      addToast({
        type: "error",
        title: "삭제 실패",
        message: "일부 북마크를 삭제할 수 없습니다. 다시 시도해주세요.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 빈 상태
  if (sortedTours.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-24">
        <Bookmark className="w-16 h-16 sm:w-20 sm:h-20 text-muted-foreground mb-4" />
        <h2 className="text-xl sm:text-2xl font-semibold mb-2">
          북마크가 없습니다
        </h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          관심 있는 관광지를 북마크하여 나중에 쉽게 찾아보세요.
        </p>
        <Button asChild>
          <Link href="/">관광지 둘러보기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 툴바: 정렬 및 삭제 */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        {/* 정렬 옵션 */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">정렬:</span>
          <div className="flex gap-2">
            <Button
              variant={sort === "latest" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSortChange("latest")}
              aria-label="최신순 정렬"
            >
              최신순
            </Button>
            <Button
              variant={sort === "name" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSortChange("name")}
              aria-label="이름순 정렬"
            >
              이름순
            </Button>
            <Button
              variant={sort === "region" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSortChange("region")}
              aria-label="지역별 정렬"
            >
              지역별
            </Button>
          </div>
        </div>

        {/* 일괄 삭제 버튼 */}
        <div className="flex items-center gap-2">
          {isSelectMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSelectMode(false);
                  setSelectedIds(new Set());
                }}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={selectedIds.size === 0 || isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                선택 삭제 ({selectedIds.size})
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSelectMode(true)}
            >
              선택 모드
            </Button>
          )}
        </div>
      </div>

      {/* 북마크 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {sortedTours.map((tour, index) => {
          const bookmark = bookmarkList.find(
            (item) => item.tour.contentid === tour.contentid
          );
          const isSelected = selectedIds.has(tour.contentid);

          return (
            <div key={`${bookmark?.bookmarkId || tour.contentid}-${index}`} className="relative group">
              {/* 체크박스 (선택 모드일 때만 표시) */}
              {isSelectMode && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(tour.contentid)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    aria-label={`${tour.title} 선택`}
                  />
                </div>
              )}

              {/* 삭제 버튼 (선택 모드가 아닐 때만 표시) */}
              {!isSelectMode && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(tour.contentid)}
                  aria-label={`${tour.title} 북마크 삭제`}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}

              <TourCard tour={tour} />
            </div>
          );
        })}
      </div>

      {/* 전체 선택 체크박스 (선택 모드일 때만 표시) */}
      {isSelectMode && sortedTours.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-4 border-t">
          <input
            type="checkbox"
            checked={selectedIds.size === sortedTours.length}
            onChange={toggleSelectAll}
            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            aria-label="전체 선택"
          />
          <label className="text-sm font-medium cursor-pointer">
            전체 선택 ({selectedIds.size}/{sortedTours.length})
          </label>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>북마크 삭제</DialogTitle>
            <DialogDescription>
              정말 {selectedIds.size}개의 북마크를 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleBatchDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

