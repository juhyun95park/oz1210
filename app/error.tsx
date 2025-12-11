/**
 * @file error.tsx
 * @description 전역 에러 핸들링 컴포넌트 (라우트 세그먼트 에러 처리)
 *
 * 이 컴포넌트는 Next.js 15 App Router의 Error Boundary 패턴을 사용하여
 * 특정 라우트 세그먼트에서 발생한 에러를 처리합니다.
 *
 * 주요 기능:
 * 1. 라우트 세그먼트 에러 캐치 및 표시
 * 2. TourAPIError 타입 구분하여 적절한 메시지 표시
 * 3. 에러 복구 기능 (reset 함수)
 * 4. 홈으로 돌아가기 기능
 *
 * 핵심 구현 로직:
 * - Next.js 15의 error.tsx 패턴 준수
 * - Client Component로 구현 (에러는 클라이언트에서 처리)
 * - error와 reset props를 받아서 처리
 * - TourAPIError 인스턴스 체크하여 사용자 친화적 메시지 표시
 *
 * @dependencies
 * - next/link: Link 컴포넌트
 * - components/ui/error: Error 컴포넌트
 * - components/ui/button: Button 컴포넌트
 * - lib/api/tour-api: TourAPIError 클래스
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/error} - Next.js Error Handling
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Error as ErrorComponent } from '@/components/ui/error';
import { TourAPIError, TourAPIErrorType } from '@/lib/api/tour-api';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 에러 메시지를 사용자 친화적으로 변환
 */
function getErrorMessage(error: Error): { title?: string; message: string } {
  // TourAPIError인 경우
  if (error instanceof TourAPIError) {
    // TourAPIError의 getUserMessage() 메서드 사용
    const userMessage = error.getUserMessage();

    // 에러 타입에 따른 제목 설정
    let title: string | undefined;
    switch (error.errorType) {
      case TourAPIErrorType.API_KEY_MISSING:
      case TourAPIErrorType.API_KEY_INVALID:
        title = 'API 설정 오류';
        break;
      case TourAPIErrorType.NETWORK_ERROR:
        title = '네트워크 오류';
        break;
      case TourAPIErrorType.TIMEOUT_ERROR:
        title = '요청 시간 초과';
        break;
      case TourAPIErrorType.HTTP_ERROR:
        title = '서버 오류';
        break;
      case TourAPIErrorType.API_ERROR:
        title = '데이터 조회 오류';
        break;
      case TourAPIErrorType.VALIDATION_ERROR:
        title = '입력 오류';
        break;
      default:
        title = '오류 발생';
    }

    return {
      title,
      message: userMessage,
    };
  }

  // 일반 에러
  return {
    message: error.message || '오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  };
}

export default function Error({ error, reset }: ErrorProps) {
  // 개발 환경에서만 콘솔에 에러 로그 출력
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error);
      if (error.digest) {
        console.error('Error digest:', error.digest);
      }
    }
  }, [error]);

  const { title, message } = getErrorMessage(error);

  return (
    <main
      className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12"
      role="main"
      aria-label="에러 페이지"
    >
      <div className="container mx-auto max-w-2xl text-center">
        <ErrorComponent
          title={title}
          message={message}
          onRetry={reset}
          retryText="다시 시도"
          size="lg"
          className="mb-8"
        />

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            variant="default"
            size="lg"
            className="min-h-[44px] min-w-[120px]"
            aria-label="다시 시도"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="min-h-[44px] min-w-[120px]"
            aria-label="홈으로 돌아가기"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Link>
          </Button>
        </div>

        {/* 개발 환경에서만 상세 에러 정보 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-left">
            <summary className="cursor-pointer text-sm font-semibold text-destructive">
              개발자 정보 (개발 환경에서만 표시)
            </summary>
            <div className="mt-4 space-y-2 text-xs">
              <div>
                <strong>에러 메시지:</strong>
                <pre className="mt-1 overflow-auto rounded bg-background p-2">
                  {error.message}
                </pre>
              </div>
              {error.digest && (
                <div>
                  <strong>Error Digest:</strong>
                  <code className="ml-2 rounded bg-background px-2 py-1">
                    {error.digest}
                  </code>
                </div>
              )}
              {error.stack && (
                <div>
                  <strong>스택 트레이스:</strong>
                  <pre className="mt-1 max-h-48 overflow-auto rounded bg-background p-2 text-xs">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </main>
  );
}

