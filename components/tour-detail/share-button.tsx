/**
 * @file share-button.tsx
 * @description URL 공유 버튼 컴포넌트
 *
 * 이 컴포넌트는 현재 페이지 URL을 클립보드에 복사하는 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 현재 페이지 URL 복사
 * 2. 클립보드 API 사용
 * 3. 복사 완료 토스트 메시지
 * 4. HTTPS 환경 확인
 * 5. 에러 처리
 *
 * @dependencies
 * - components/ui/button.tsx: Button 컴포넌트
 * - components/providers/toast-provider.tsx: useToast hook
 * - lucide-react: Share2, Check 아이콘
 *
 * @see {@link /docs/PRD.MD} - 공유 기능 요구사항 참고
 */

"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
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
 * URL 공유 버튼 컴포넌트
 */
export function ShareButton({
  className,
  size = "sm",
  variant = "outline",
}: ShareButtonProps) {
  const { success, error: showError } = useToast();
  const [copied, setCopied] = useState(false);

  /**
   * URL 복사 기능
   */
  const handleShare = async () => {
    try {
      // 현재 페이지 URL 가져오기
      const url = typeof window !== "undefined" ? window.location.href : "";

      if (!url) {
        showError("URL을 가져올 수 없습니다.");
        return;
      }

      // HTTPS 환경 확인 (로컬 개발 환경은 http://localhost 허용)
      const isSecureContext =
        typeof window !== "undefined" &&
        (window.isSecureContext ||
          window.location.protocol === "http:" ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");

      if (isSecureContext && navigator.clipboard) {
        // 클립보드 API 사용 (권장 방법)
        await navigator.clipboard.writeText(url);
        setCopied(true);
        success("링크가 복사되었습니다.");
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback: execCommand 사용 (구형 브라우저 지원)
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          setCopied(true);
          success("링크가 복사되었습니다.");
          setTimeout(() => setCopied(false), 2000);
        } else {
          showError("링크 복사에 실패했습니다. 브라우저를 확인해주세요.");
        }
      }
    } catch (err) {
      console.error("URL 복사 실패:", err);
      showError("링크 복사에 실패했습니다.");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleShare();
        }
      }}
      className={cn("min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", className)}
      aria-label={copied ? "링크 복사됨" : "링크 공유하기"}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">복사됨</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">공유</span>
        </>
      )}
    </Button>
  );
}

