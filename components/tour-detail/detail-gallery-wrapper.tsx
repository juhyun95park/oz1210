/**
 * @file detail-gallery-wrapper.tsx
 * @description DetailGallery 컴포넌트의 Client Component 래퍼
 *
 * Next.js 15에서는 Server Component에서 `dynamic`의 `ssr: false` 옵션을 사용할 수 없습니다.
 * 따라서 Client Component 래퍼를 통해 클라이언트 사이드에서만 로드되도록 합니다.
 */

"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { TourImage } from "@/lib/types/tour";

const DetailGallery = dynamic(
  () => import("@/components/tour-detail/detail-gallery").then((mod) => ({
    default: mod.DetailGallery,
  })),
  {
    loading: () => (
      <section className="space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 sm:h-80 md:h-96 w-full" />
      </section>
    ),
    ssr: false,
  }
);

interface DetailGalleryWrapperProps {
  images: TourImage[];
  title: string;
}

export function DetailGalleryWrapper({
  images,
  title,
}: DetailGalleryWrapperProps) {
  return <DetailGallery images={images} title={title} />;
}

