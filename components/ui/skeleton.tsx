/**
 * @file skeleton.tsx
 * @description 스켈레톤 UI 컴포넌트
 *
 * 이 컴포넌트는 로딩 중 콘텐츠의 플레이스홀더를 표시합니다.
 *
 * 주요 기능:
 * - 로딩 중 콘텐츠 영역 표시
 * - 펄스 애니메이션 효과
 * - 다양한 크기와 형태 지원
 *
 * @dependencies
 * - lib/utils: cn 함수
 */

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 추가 클래스명
   */
  className?: string;
}

/**
 * 스켈레톤 컴포넌트
 * 로딩 중 콘텐츠의 플레이스홀더를 표시합니다.
 *
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-32" />
 * <Skeleton className="h-8 w-full" />
 * ```
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  );
}

/**
 * 카드 스켈레톤 컴포넌트
 * 관광지 카드 로딩 시 사용
 */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <Skeleton className="h-48 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
}

/**
 * 리스트 스켈레톤 컴포넌트
 * 목록 로딩 시 사용
 */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-20 w-20 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

