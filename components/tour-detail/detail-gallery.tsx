/**
 * @file detail-gallery.tsx
 * @description 관광지 이미지 갤러리 섹션 컴포넌트
 *
 * 이 컴포넌트는 관광지의 이미지 갤러리를 표시합니다.
 *
 * 주요 기능:
 * 1. 이미지 목록 표시 (대표 이미지 + 썸네일)
 * 2. 이미지 슬라이드 기능
 * 3. 전체화면 모달
 * 4. 이미지 클릭 시 모달 열기
 * 5. 키보드 네비게이션 지원
 *
 * 핵심 구현 로직:
 * - Client Component로 갤러리 UI 구현
 * - Dialog 컴포넌트를 사용한 전체화면 모달
 * - Next.js Image 컴포넌트로 이미지 최적화
 *
 * @dependencies
 * - lib/types/tour.ts: TourImage 타입
 * - lib/utils/image.ts: 이미지 유틸리티 함수
 * - components/ui/dialog.tsx: Dialog 컴포넌트
 * - next/image: 이미지 최적화
 * - lucide-react: ChevronLeft, ChevronRight, X 아이콘
 *
 * @see {@link /docs/PRD.MD} - 이미지 갤러리 섹션 요구사항 참고
 */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import type { TourImage } from "@/lib/types/tour";
import { cn } from "@/lib/utils";
import {
  normalizeImageUrl,
  isHttpImage,
  getImageSizes,
} from "@/lib/utils/image";

/**
 * 관광지 이미지 갤러리 컴포넌트
 */
export function DetailGallery({
  images,
  title = "관광지",
  className,
}: DetailGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());

  // 이미지가 없는 경우
  if (!images || images.length === 0) {
    return (
      <section
        className={cn("space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t", className)}
        aria-label="이미지 갤러리"
      >
        <h2 className="text-2xl sm:text-3xl font-bold">이미지 갤러리</h2>
        <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          <p className="text-muted-foreground">이미지가 없습니다</p>
        </div>
      </section>
    );
  }

  // 이미지 로드 실패 처리
  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  // Next.js Image 컴포넌트 에러 처리
  const handleImageLoadError = (index: number) => {
    setImageLoadErrors((prev) => new Set(prev).add(index));
    handleImageError(index);
  };

  // 이전 이미지
  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  // 다음 이미지
  const handleNext = () => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // 키보드 네비게이션
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, images.length]);

  // 모달 열기
  const handleOpenModal = (index: number) => {
    setSelectedIndex(index);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // 현재 선택된 이미지
  const currentImage = images[selectedIndex];
  const currentImageUrl = normalizeImageUrl(
    currentImage?.originimgurl || currentImage?.smallimageurl,
    null,
  );
  const hasImageError = imageErrors.has(selectedIndex) || imageLoadErrors.has(selectedIndex);
  
  // HTTP 이미지인지 확인 (공통 유틸리티 함수 사용)
  const httpImage = currentImageUrl ? isHttpImage(currentImageUrl) : false;
  
  // 이미지 sizes 속성 (공통 유틸리티 함수 사용)
  const mainImageSizes = getImageSizes("gallery-main");
  const thumbnailSizes = getImageSizes("gallery-thumbnail");
  const modalImageSizes = getImageSizes("gallery-modal");

  return (
    <section
      className={cn("space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t", className)}
      aria-label="이미지 갤러리"
    >
      {/* 섹션 제목 */}
      <h2 className="text-2xl sm:text-3xl font-bold">이미지 갤러리</h2>

      {/* 대표 이미지 */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden bg-muted">
        {currentImageUrl && !hasImageError ? (
          <button
            onClick={() => handleOpenModal(selectedIndex)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleOpenModal(selectedIndex);
              }
            }}
            className="relative w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg min-h-[44px]"
            aria-label={`${title} 이미지 ${selectedIndex + 1} 보기 (전체화면)`}
          >
            {!imageLoadErrors.has(selectedIndex) ? (
              <Image
                src={currentImageUrl}
                alt={currentImage?.imgname || `${title} 이미지 ${selectedIndex + 1}`}
                fill
                className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
                sizes={mainImageSizes}
                priority={selectedIndex === 0}
                onError={() => handleImageLoadError(selectedIndex)}
                unoptimized={httpImage}
              />
            ) : (
              <img
                src={currentImageUrl}
                alt={currentImage?.imgname || `${title} 이미지 ${selectedIndex + 1}`}
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onError={() => handleImageError(selectedIndex)}
              />
            )}
          </button>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-muted-foreground">이미지를 불러올 수 없습니다</p>
          </div>
        )}

        {/* 이미지가 2개 이상일 때만 네비게이션 버튼 표시 */}
        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] bg-background/80 hover:bg-background"
              aria-label="이전 이미지"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] bg-background/80 hover:bg-background"
              aria-label="다음 이미지"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </>
        )}

        {/* 이미지 인덱스 표시 */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* 썸네일 그리드 */}
      {images.length > 1 && (
        <div
          className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-4"
          role="list"
          aria-label="이미지 썸네일 목록"
        >
          {images.map((image, index) => {
            const thumbnailUrl = normalizeImageUrl(
              image.smallimageurl || image.originimgurl
            );
            const isSelected = index === selectedIndex;
            const hasError = imageErrors.has(index) || imageLoadErrors.has(index);

            return (
              <button
                key={image.serialnum || index}
                onClick={() => setSelectedIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedIndex(index);
                  }
                }}
                className={cn(
                  "relative aspect-video rounded-lg overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all min-h-[44px]",
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2 scale-105"
                    : "hover:scale-105 hover:shadow-lg"
                )}
                aria-label={`${title} 이미지 ${index + 1} 선택`}
                aria-current={isSelected ? "true" : "false"}
                role="listitem"
              >
                {thumbnailUrl && !hasError ? (
                  <>
                    {!imageLoadErrors.has(index) ? (
                      <Image
                        src={thumbnailUrl}
                        alt={image.imgname || `${title} 썸네일 ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes={thumbnailSizes}
                        loading={index < 5 ? "eager" : "lazy"}
                        onError={() => handleImageLoadError(index)}
                        unoptimized={thumbnailUrl ? isHttpImage(thumbnailUrl) : false}
                      />
                    ) : (
                      <img
                        src={thumbnailUrl}
                        alt={image.imgname || `${title} 썸네일 ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(index)}
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">이미지 없음</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 전체화면 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-w-7xl w-full h-full max-h-[95vh] p-0 bg-black/95"
          aria-label="이미지 전체화면 보기"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* 닫기 버튼 */}
            <DialogClose
              className="absolute top-4 right-4 z-50 min-h-[44px] min-w-[44px] bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
              aria-label="모달 닫기"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </DialogClose>

            {/* 모달 내 이미지 */}
            {currentImageUrl && !hasImageError ? (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                {!imageLoadErrors.has(selectedIndex) ? (
                  <Image
                    src={currentImageUrl}
                    alt={currentImage?.imgname || `${title} 이미지 ${selectedIndex + 1}`}
                    width={1920}
                    height={1080}
                    className="max-w-full max-h-full object-contain"
                    sizes={modalImageSizes}
                    onError={() => handleImageLoadError(selectedIndex)}
                    unoptimized={httpImage}
                  />
                ) : (
                  <img
                    src={currentImageUrl}
                    alt={currentImage?.imgname || `${title} 이미지 ${selectedIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                    onError={() => handleImageError(selectedIndex)}
                  />
                )}
              </div>
            ) : (
              <div className="text-white">이미지를 불러올 수 없습니다</div>
            )}

            {/* 모달 내 네비게이션 버튼 */}
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] bg-black/50 hover:bg-black/70 text-white border-white/20"
                  aria-label="이전 이미지"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] bg-black/50 hover:bg-black/70 text-white border-white/20"
                  aria-label="다음 이미지"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </Button>
              </>
            )}

            {/* 모달 내 이미지 인덱스 표시 */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                {selectedIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

