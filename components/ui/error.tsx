/**
 * @file error.tsx
 * @description 에러 메시지 컴포넌트
 *
 * 이 컴포넌트는 에러 발생 시 사용자에게 친화적인 에러 메시지를 표시합니다.
 *
 * 주요 기능:
 * - 에러 메시지 표시
 * - 재시도 버튼 제공 (선택 사항)
 * - 다양한 에러 타입 지원
 *
 * @dependencies
 * - lucide-react: AlertCircle 아이콘
 * - components/ui/button: Button 컴포넌트
 */

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorProps {
  /**
   * 에러 메시지
   */
  message?: string;
  /**
   * 에러 제목 (선택 사항)
   */
  title?: string;
  /**
   * 재시도 함수 (선택 사항, 제공 시 재시도 버튼 표시)
   */
  onRetry?: () => void;
  /**
   * 재시도 버튼 텍스트
   * @default "다시 시도"
   */
  retryText?: string;
  /**
   * 추가 클래스명
   */
  className?: string;
  /**
   * 크기 (sm, md, lg)
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const iconSizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function Error({
  message = "오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  title,
  onRetry,
  retryText = "다시 시도",
  className,
  size = "md",
}: ErrorProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-8 text-center",
        className
      )}
    >
      <AlertCircle
        className={cn(
          "text-destructive",
          iconSizeClasses[size]
        )}
      />
      <div className="space-y-2">
        {title && (
          <h3 className={cn("font-semibold", sizeClasses[size])}>
            {title}
          </h3>
        )}
        <p className={cn("text-muted-foreground", sizeClasses[size])}>
          {message}
        </p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          {retryText}
        </Button>
      )}
    </div>
  );
}

/**
 * 인라인 에러 컴포넌트
 * 폼 필드 등 작은 영역에 사용
 */
export function InlineError({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-destructive",
        className
      )}
    >
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

