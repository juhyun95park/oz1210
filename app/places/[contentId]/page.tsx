/**
 * @file page.tsx
 * @description 관광지 상세페이지
 *
 * 이 페이지는 관광지의 상세 정보를 표시하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 관광지 기본 정보 표시
 * 2. 운영 정보 표시
 * 3. 이미지 갤러리
 * 4. 지도 표시
 * 5. 공유 및 북마크 기능
 *
 * 핵심 구현 로직:
 * - Server Component로 구현하여 SEO 최적화
 * - 동적 라우팅 (contentId 파라미터)
 * - Next.js 15 App Router 패턴 준수 (params는 Promise)
 * - 반응형 레이아웃 (모바일 우선)
 *
 * @dependencies
 * - lib/api/tour-api.ts: getDetailCommon 함수
 * - lib/types/tour.ts: TourDetail 타입
 * - components/ui/loading.tsx: 로딩 상태 UI
 * - components/ui/error.tsx: 에러 상태 UI
 *
 * @see {@link /docs/PRD.MD} - 상세페이지 요구사항 참고
 */

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDetailCommon } from "@/lib/api/tour-api";
import { TourAPIError } from "@/lib/api/tour-api";
import { Error } from "@/components/ui/error";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailInfo } from "@/components/tour-detail/detail-info";
import type { TourDetail } from "@/lib/types/tour";
import { notFound } from "next/navigation";

interface DetailPageProps {
  params: Promise<{
    contentId: string;
  }>;
}

/**
 * 관광지 상세 정보 컴포넌트
 * Server Component로 데이터 로딩
 */
async function TourDetailContent({ contentId }: { contentId: string }) {
  try {
    // 상세 정보 로딩
    const { item: detail } = await getDetailCommon({ contentId });

    return (
      <div className="space-y-8">
        {/* 기본 정보 섹션 */}
        <DetailInfo detail={detail} />

        {/* 추가 섹션들은 Phase 3.3~3.6에서 구현 예정 */}
        <div className="text-center py-12 text-muted-foreground">
          <p>운영 정보, 이미지 갤러리, 지도 섹션은 다음 단계에서 구현 예정입니다.</p>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof TourAPIError) {
      // 관광지를 찾을 수 없는 경우 404
      if (error.message.includes("찾을 수 없습니다")) {
        notFound();
      }
      return (
        <Error
          title="데이터를 불러올 수 없습니다"
          message={error.message}
        />
      );
    }
    return (
      <Error
        title="오류가 발생했습니다"
        message="관광지 상세 정보를 불러오는 중 문제가 발생했습니다."
      />
    );
  }
}

/**
 * 상세페이지 로딩 스켈레톤
 */
function DetailPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

/**
 * 관광지 상세페이지
 */
export default async function DetailPage({ params }: DetailPageProps) {
  // Next.js 15에서는 params가 Promise이므로 await 필요
  const { contentId } = await params;

  // contentId 검증
  if (!contentId || contentId.trim() === "") {
    notFound();
  }

  return (
    <main
      className="min-h-[calc(100vh-4rem)] container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      role="main"
      aria-label="관광지 상세 정보"
    >
      {/* 뒤로가기 버튼 */}
      <section className="mb-6" aria-label="네비게이션">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] px-3"
            aria-label="목록으로 돌아가기"
          >
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">목록으로</span>
          </Button>
        </Link>
      </section>

      {/* 상세 정보 영역 */}
      <section className="space-y-6" aria-label="관광지 상세 정보">
        <Suspense fallback={<DetailPageSkeleton />}>
          <TourDetailContent contentId={contentId.trim()} />
        </Suspense>
      </section>
    </main>
  );
}

