/**
 * @file page.tsx
 * @description 북마크 목록 페이지
 *
 * 이 페이지는 인증된 사용자가 북마크한 관광지 목록을 표시합니다.
 *
 * 주요 기능:
 * 1. 북마크 목록 조회 및 표시
 * 2. 정렬 기능 (최신순, 이름순, 지역별)
 * 3. 개별 삭제 기능
 * 4. 일괄 삭제 기능
 *
 * 핵심 구현 로직:
 * - Server Component로 구현하여 SEO 최적화
 * - Clerk 인증 확인 (인증되지 않은 사용자는 로그인 페이지로 리다이렉트)
 * - 북마크 목록 조회 (getUserBookmarks)
 * - 각 북마크의 content_id로 관광지 정보 조회 (getDetailCommon)
 * - TourItem 타입으로 변환하여 TourCard 컴포넌트에 전달
 *
 * @dependencies
 * - @clerk/nextjs/server: auth() 함수
 * - lib/supabase/server.ts: createClerkSupabaseClient 함수
 * - lib/api/supabase-api.ts: getUserBookmarks 함수
 * - lib/api/tour-api.ts: getDetailCommon 함수
 * - components/bookmarks/bookmark-list.tsx: BookmarkList 컴포넌트
 *
 * @see {@link /docs/PRD.MD} - 북마크 목록 페이지 요구사항 참고
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getUserBookmarks } from "@/lib/api/supabase-api";
import { getDetailCommon } from "@/lib/api/tour-api";
import { TourAPIError } from "@/lib/api/tour-api";
import dynamic from "next/dynamic";
import { BookmarkListError } from "@/components/bookmarks/bookmark-list-error";
import { CardSkeleton } from "@/components/ui/skeleton";

// 북마크 목록은 큰 컴포넌트이므로 dynamic import로 lazy loading
const BookmarkList = dynamic(() => import("@/components/bookmarks/bookmark-list").then((mod) => ({ default: mod.BookmarkList })), {
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  ),
});
import type { TourItem } from "@/lib/types/tour";

/**
 * 북마크와 관광지 정보를 결합한 타입
 */
interface BookmarkWithTour {
  bookmarkId: string;
  contentId: string;
  createdAt: string;
  tour: TourItem;
}

/**
 * 주소에서 지역 코드 추출
 * 한국관광공사 지역 코드 매핑:
 * 1: 서울, 2: 인천, 3: 대전, 4: 대구, 5: 광주, 6: 부산, 7: 울산, 8: 세종
 * 31: 경기, 32: 강원, 33: 충북, 34: 충남, 35: 경북, 36: 경남, 37: 전북, 38: 전남, 39: 제주
 */
function extractAreaCodeFromAddress(address: string): string {
  if (!address) return "";

  // 시/도 단위 지역명 매핑
  const areaMap: Record<string, string> = {
    서울: "1",
    인천: "2",
    대전: "3",
    대구: "4",
    광주: "5",
    부산: "6",
    울산: "7",
    세종: "8",
    경기: "31",
    강원: "32",
    충북: "33",
    충남: "34",
    경북: "35",
    경남: "36",
    전북: "37",
    전남: "38",
    제주: "39",
  };

  // 주소에서 지역명 찾기
  for (const [region, code] of Object.entries(areaMap)) {
    if (address.includes(region)) {
      return code;
    }
  }

  return "";
}

/**
 * 북마크 목록 데이터 로딩 (Server Component)
 */
async function BookmarksContent() {
  try {
    // 1. Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      redirect("/sign-in");
    }

    // 2. Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 3. 북마크 목록 조회
    let bookmarks;
    try {
      bookmarks = await getUserBookmarks(supabase, userId);
    } catch (error) {
      // 사용자 동기화 문제일 수 있음
      console.error("북마크 목록 조회 실패:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "북마크 목록을 불러올 수 없습니다.";
      
      // 사용자를 찾을 수 없는 경우 명확한 메시지 표시
      if (errorMessage.includes("사용자를 찾을 수 없습니다")) {
        return (
          <BookmarkListError message="사용자 정보가 동기화되지 않았습니다. 잠시 후 다시 시도해주세요." />
        );
      }
      
      return <BookmarkListError message={errorMessage} />;
    }

    if (bookmarks.length === 0) {
      return <BookmarkList tours={[]} />;
    }

    // 4. 각 북마크의 content_id로 관광지 정보 조회 (병렬 처리)
    const tourPromises = bookmarks.map(async (bookmark) => {
      try {
        const detailResponse = await getDetailCommon({ contentId: bookmark.content_id });
        const tourDetail = detailResponse.item; // getDetailCommon은 { item: TourDetail } 형태로 반환
        
        // 주소에서 지역 코드 추출 (시/도 단위)
        // 예: "서울특별시 강남구..." -> "1" (서울)
        // 예: "부산광역시 해운대구..." -> "6" (부산)
        const areacode = extractAreaCodeFromAddress(tourDetail.addr1 || "");
        
        // TourDetail을 TourItem으로 변환
        // 주의: TourDetail에는 cat1, cat2, cat3 필드가 없으므로 빈 값으로 설정
        const tourItem: TourItem = {
          addr1: tourDetail.addr1 || "",
          addr2: tourDetail.addr2,
          areacode: areacode, // 주소에서 추출한 지역 코드
          contentid: tourDetail.contentid,
          contenttypeid: tourDetail.contenttypeid,
          title: tourDetail.title || "",
          mapx: tourDetail.mapx || "0",
          mapy: tourDetail.mapy || "0",
          firstimage: tourDetail.firstimage,
          firstimage2: tourDetail.firstimage2,
          tel: tourDetail.tel,
          cat1: undefined, // TourDetail에는 cat1이 없음
          cat2: undefined, // TourDetail에는 cat2가 없음
          cat3: undefined, // TourDetail에는 cat3가 없음
          modifiedtime: new Date().toISOString(), // detailCommon에는 modifiedtime이 없으므로 현재 시간 사용
        };

        return {
          bookmarkId: bookmark.id,
          contentId: bookmark.content_id,
          createdAt: bookmark.created_at,
          tour: tourItem,
        } as BookmarkWithTour;
      } catch (error) {
        // 일부 관광지 정보 조회 실패 시 해당 항목 제외
        console.error(
          `관광지 정보 조회 실패 (contentId: ${bookmark.content_id}):`,
          error
        );
        return null;
      }
    });

    const results = await Promise.all(tourPromises);
    const bookmarkWithTours = results.filter(
      (item): item is BookmarkWithTour => item !== null
    );

    // 5. TourItem 배열로 변환
    const tours = bookmarkWithTours.map((item) => item.tour);

    return <BookmarkList tours={tours} bookmarks={bookmarkWithTours} />;
  } catch (error) {
    console.error("북마크 목록 로딩 실패:", error);

    if (error instanceof TourAPIError) {
      return <BookmarkListError message={error.getUserMessage()} />;
    }

    return <BookmarkListError message="북마크 목록을 불러올 수 없습니다." />;
  }
}

/**
 * 북마크 목록 페이지
 */
export default async function BookmarksPage() {
  // 인증 확인 (Server Component에서 먼저 확인)
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main
      role="main"
      aria-label="북마크 목록 페이지"
      className="min-h-[calc(100vh-4rem)]"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 페이지 제목 */}
        <section className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            내 북마크
          </h1>
          <p className="text-muted-foreground">
            저장한 관광지를 확인하고 관리할 수 있습니다.
          </p>
        </section>

        {/* 북마크 목록 */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <BookmarksContent />
        </Suspense>
      </div>
    </main>
  );
}

