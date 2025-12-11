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
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDetailCommon, getDetailIntro, getDetailImage, getDetailPetTour, getAreaBasedList } from "@/lib/api/tour-api";
import { TourAPIError } from "@/lib/api/tour-api";
import { Error } from "@/components/ui/error";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailInfo } from "@/components/tour-detail/detail-info";
import { DetailIntro } from "@/components/tour-detail/detail-intro";
import { DetailPetTour } from "@/components/tour-detail/detail-pet-tour";
import { DetailRecommendations } from "@/components/tour-detail/detail-recommendations";
import { DetailGalleryWrapper } from "@/components/tour-detail/detail-gallery-wrapper";
import { DetailMapWrapper } from "@/components/tour-detail/detail-map-wrapper";
import { ShareButton } from "@/components/tour-detail/share-button";
import { BookmarkButton } from "@/components/bookmarks/bookmark-button";
import type { TourItem } from "@/lib/types/tour";
import { notFound } from "next/navigation";

interface DetailPageProps {
  params: Promise<{
    contentId: string;
  }>;
}

/**
 * 사이트 URL 가져오기
 * 환경변수 NEXT_PUBLIC_SITE_URL이 있으면 사용, 없으면 기본값 사용
 */
function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // 개발 환경 기본값
  return "http://localhost:3000";
}

/**
 * Open Graph 메타데이터 생성
 * Next.js 15 Metadata API 사용
 */
export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { contentId } = await params;

  // contentId 검증
  if (!contentId || contentId.trim() === "") {
    return {
      title: "관광지 상세 정보",
      description: "관광지 상세 정보를 불러올 수 없습니다.",
    };
  }

  try {
    // 관광지 상세 정보 조회
    const { item: detail } = await getDetailCommon({
      contentId: contentId.trim(),
    });

    const siteUrl = getSiteUrl();
    const pageUrl = `${siteUrl}/places/${contentId}`;

    // 설명 텍스트 (100자 이내로 자르기)
    const description = detail.overview
      ? detail.overview.length > 100
        ? `${detail.overview.substring(0, 100)}...`
        : detail.overview
      : `${detail.title}의 상세 정보를 확인해보세요.`;

    // 이미지 URL (대표 이미지가 있으면 사용, 없으면 기본 이미지)
    const imageUrl = detail.firstimage || `${siteUrl}/og-image.png`;

    return {
      title: `${detail.title} - My Trip`,
      description,
      openGraph: {
        title: detail.title,
        description,
        url: pageUrl,
        siteName: "My Trip",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: detail.title,
          },
        ],
        locale: "ko_KR",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: detail.title,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: pageUrl,
      },
    };
  } catch (error) {
    // API 호출 실패 시 기본 메타데이터 반환
    // 메타데이터 생성 실패는 치명적이지 않으므로 조용히 처리
    if (process.env.NODE_ENV === 'development') {
      console.warn("메타데이터 생성 실패 (기본 메타데이터 사용):", error instanceof Error ? error.message : String(error));
    }
    return {
      title: "관광지 상세 정보 - My Trip",
      description: "관광지 상세 정보를 불러올 수 없습니다.",
    };
  }
}

/**
 * 관광지 운영 정보 컴포넌트
 * Server Component로 데이터 로딩
 */
async function TourIntroContent({
  contentId,
  contentTypeId,
}: {
  contentId: string;
  contentTypeId: string;
}) {
  try {
    // 운영 정보 로딩
    const { item: intro } = await getDetailIntro({
      contentId,
      contentTypeId,
    });

    return <DetailIntro intro={intro} />;
  } catch (error) {
    // 운영 정보는 선택적이므로 에러가 발생해도 null 반환
    // 에러 로그만 출력하고 UI에는 표시하지 않음
    console.warn("운영 정보를 불러올 수 없습니다:", error);
    return null;
  }
}

/**
 * 관광지 반려동물 정보 컴포넌트
 * Server Component로 데이터 로딩
 */
async function TourPetContent({
  contentId,
}: {
  contentId: string;
}) {
  try {
    // 반려동물 정보 로딩
    const { item: petInfo } = await getDetailPetTour({
      contentId,
    });

    return <DetailPetTour petInfo={petInfo} />;
  } catch (error) {
    // 반려동물 정보는 선택적 기능이므로 에러가 발생해도 null 반환
    // 에러 로그만 출력하고 UI에는 표시하지 않음
    console.warn("반려동물 정보를 불러올 수 없습니다:", error);
    return null;
  }
}

/**
 * 관광지 이미지 갤러리 컴포넌트
 * Server Component로 데이터 로딩
 */
async function TourGalleryContent({
  contentId,
  title,
}: {
  contentId: string;
  title: string;
}) {
  try {
    // 이미지 목록 조회 (최대 20개)
    const { items: images } = await getDetailImage({
      contentId,
      numOfRows: 20,
      pageNo: 1,
    });

    // 이미지가 없는 경우 null 반환
    if (!images || images.length === 0) {
      return null;
    }

    return <DetailGalleryWrapper images={images} title={title} />;
  } catch (error) {
    // 이미지 갤러리는 선택적 기능이므로 에러 발생 시 null 반환
    console.warn("이미지 갤러리를 불러올 수 없습니다:", error);
    return null;
  }
}

/**
 * 추천 관광지 컴포넌트
 * Server Component로 데이터 로딩
 */
async function TourRecommendationsContent({
  contentId,
  areaCode,
  contentTypeId,
}: {
  contentId: string;
  areaCode: string;
  contentTypeId: string;
}) {
  try {
    const recommendations: TourItem[] = [];
    const maxRecommendations = 6;

    // 1. 같은 지역 + 같은 타입 조회 (우선순위 1)
    try {
      const { items } = await getAreaBasedList({
        areaCode,
        contentTypeId,
        numOfRows: 10,
        pageNo: 1,
      });

      const filtered = items
        .filter((item) => item.contentid !== contentId)
        .slice(0, maxRecommendations);

      recommendations.push(...filtered);
    } catch (error) {
      console.warn("같은 지역+타입 조회 실패:", error);
    }

    // 2. 결과가 부족한 경우 같은 지역의 다른 타입 관광지 추가 조회 (우선순위 2)
    if (recommendations.length < 3) {
      try {
        const { items } = await getAreaBasedList({
          areaCode,
          numOfRows: 10,
          pageNo: 1,
        });

        const filtered = items
          .filter(
            (item) =>
              item.contentid !== contentId &&
              !recommendations.some((rec) => rec.contentid === item.contentid)
          )
          .slice(0, maxRecommendations - recommendations.length);

        recommendations.push(...filtered);
      } catch (error) {
        console.warn("같은 지역 조회 실패:", error);
      }
    }

    // 3. 여전히 부족한 경우 같은 타입의 다른 지역 관광지 추가 조회 (우선순위 3)
    if (recommendations.length < 3) {
      try {
        const { items } = await getAreaBasedList({
          contentTypeId,
          numOfRows: 10,
          pageNo: 1,
        });

        const filtered = items
          .filter(
            (item) =>
              item.contentid !== contentId &&
              !recommendations.some((rec) => rec.contentid === item.contentid)
          )
          .slice(0, maxRecommendations - recommendations.length);

        recommendations.push(...filtered);
      } catch (error) {
        console.warn("같은 타입 조회 실패:", error);
      }
    }

    // 최대 6개까지만 반환
    const finalRecommendations = recommendations.slice(0, maxRecommendations);

    // 추천 관광지가 없는 경우 null 반환
    if (finalRecommendations.length === 0) {
      return null;
    }

    return <DetailRecommendations recommendations={finalRecommendations} />;
  } catch (error) {
    // 추천 관광지는 선택적 기능이므로 에러 발생 시 null 반환
    console.warn("추천 관광지를 불러올 수 없습니다:", error);
    return null;
  }
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
      <div className="space-y-8 sm:space-y-12">
        {/* 기본 정보 섹션 */}
        <DetailInfo detail={detail} />

        {/* 운영 정보 섹션 */}
        <Suspense
          fallback={
            <div className="space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t">
              <Skeleton className="h-8 w-32" />
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          }
        >
          <TourIntroContent
            contentId={contentId}
            contentTypeId={detail.contenttypeid}
          />
        </Suspense>

        {/* 반려동물 정보 섹션 */}
        <Suspense
          fallback={
            <div className="space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t">
              <Skeleton className="h-8 w-40" />
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          }
        >
          <TourPetContent contentId={contentId} />
        </Suspense>

        {/* 이미지 갤러리 섹션 */}
        <Suspense
          fallback={
            <div className="space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-64 sm:h-80 md:h-96 w-full" />
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="aspect-video w-full" />
                ))}
              </div>
            </div>
          }
        >
          <TourGalleryContent contentId={contentId} title={detail.title} />
        </Suspense>

        {/* 지도 섹션 */}
        <Suspense
          fallback={
            <div className="space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-64 sm:h-96 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          }
        >
          <DetailMapWrapper detail={detail} />
        </Suspense>

        {/* 추천 관광지 섹션 */}
        <Suspense
          fallback={
            <div className="space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t">
              <Skeleton className="h-8 w-40" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4 md:gap-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-lg" />
                ))}
              </div>
            </div>
          }
        >
          <TourRecommendationsContent
            contentId={contentId}
            areaCode={detail.areacode}
            contentTypeId={detail.contenttypeid}
          />
        </Suspense>
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
    <div className="space-y-8 sm:space-y-12">
      {/* 기본 정보 섹션 스켈레톤 */}
      <div className="space-y-6 sm:space-y-8">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-64 sm:h-80 md:h-96 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      {/* 운영 정보 섹션 스켈레톤 */}
      <div className="space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
      {/* 반려동물 정보 섹션 스켈레톤 */}
      <div className="space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
      {/* 이미지 갤러리 섹션 스켈레톤 */}
      <div className="space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 sm:h-80 md:h-96 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full" />
          ))}
        </div>
      </div>
      {/* 지도 섹션 스켈레톤 */}
      <div className="space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 sm:h-96 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
      {/* 추천 관광지 섹션 스켈레톤 */}
      <div className="space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4 md:gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
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
      {/* 뒤로가기 버튼 및 공유 버튼 */}
      <section className="mb-6 sm:mb-8 flex items-center justify-between gap-2 sm:gap-4" aria-label="네비게이션">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] px-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="목록으로 돌아가기"
          >
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">목록으로</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <BookmarkButton contentId={contentId.trim()} />
          <ShareButton />
        </div>
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

