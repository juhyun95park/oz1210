/**
 * @file loading.tsx
 * @description 로딩 스피너 컴포넌트
 *
 * 이 컴포넌트는 데이터 로딩 중 표시되는 스피너를 제공합니다.
 *
 * 주요 기능:
 * - 로딩 스피너 표시
 * - 선택적 텍스트 메시지
 * - 크기 조절 가능 (sm, md, lg)
 *
 * @dependencies
 * - lucide-react: Loader2 아이콘
 */

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  /**
   * 로딩 메시지 (선택 사항)
   */
  message?: string;
  /**
   * 크기 (sm, md, lg)
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * 전체 화면 표시 여부
   * @default false
   */
  fullScreen?: boolean;
  /**
   * 추가 클래스명
   */
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function Loading({
  message,
  size = "md",
  fullScreen = false,
  className,
}: LoadingProps) {
  const containerClasses = fullScreen
    ? "fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
    : "flex items-center justify-center p-4";

  return (
    <div className={cn(containerClasses, className)}>
      <div className="flex flex-col items-center gap-2">
        <Loader2
          className={cn(
            "animate-spin text-primary",
            sizeClasses[size]
          )}
        />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}

