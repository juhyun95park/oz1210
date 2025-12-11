/**
 * @file global-error.tsx
 * @description 전역 에러 핸들링 컴포넌트 (루트 레이아웃 에러 처리)
 *
 * 이 컴포넌트는 Next.js 15 App Router의 Global Error Boundary 패턴을 사용하여
 * 루트 레이아웃에서 발생한 에러를 처리합니다.
 *
 * 주요 기능:
 * 1. 루트 레이아웃 에러 캐치 및 표시 (ClerkProvider, ToastProvider 등)
 * 2. html과 body 태그 포함 (루트 레이아웃 대체)
 * 3. 최소한의 스타일링 (글로벌 CSS 로드 실패 대비)
 * 4. 에러 복구 기능 (새로고침)
 *
 * 핵심 구현 로직:
 * - Next.js 15의 global-error.tsx 패턴 준수
 * - Client Component로 구현
 * - html과 body 태그를 포함하여 완전한 HTML 문서 구조 제공
 * - 글로벌 CSS 로드 실패 시에도 동작하도록 인라인 스타일 사용
 *
 * @dependencies
 * - next/link: Link 컴포넌트 (선택 사항)
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/global-error} - Next.js Global Error Handling
 */

'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 에러 메시지를 사용자 친화적으로 변환
 */
function getErrorMessage(error: Error): string {
  // 루트 레이아웃 에러는 주로 설정 오류
  if (error.message.includes('Clerk') || error.message.includes('clerk')) {
    return '인증 서비스 설정에 문제가 있습니다.';
  }

  if (error.message.includes('Toast') || error.message.includes('toast')) {
    return '알림 서비스 설정에 문제가 있습니다.';
  }

  if (error.message.includes('Supabase') || error.message.includes('supabase')) {
    return '데이터베이스 연결에 문제가 있습니다.';
  }

  return error.message || '애플리케이션 초기화 중 오류가 발생했습니다.';
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  // 개발 환경에서만 콘솔에 에러 로그 출력
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Global Error Boundary caught an error:', error);
      if (error.digest) {
        console.error('Error digest:', error.digest);
      }
    }
  }, [error]);

  const errorMessage = getErrorMessage(error);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: '#ffffff',
          color: '#000000',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '600px',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              marginBottom: '2rem',
            }}
          >
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#dc2626',
              }}
            >
              오류가 발생했습니다
            </h1>
            <p
              style={{
                fontSize: '1rem',
                color: '#6b7280',
                marginBottom: '2rem',
                lineHeight: '1.6',
              }}
            >
              {errorMessage}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#ffffff',
                backgroundColor: '#2563eb',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                minHeight: '44px',
                minWidth: '120px',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              aria-label="새로고침"
            >
              새로고침
            </button>

            <a
              href="/"
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#2563eb',
                textDecoration: 'none',
                border: '1px solid #2563eb',
                borderRadius: '0.5rem',
                minHeight: '44px',
                minWidth: '120px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#eff6ff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="홈으로 돌아가기"
            >
              홈으로 돌아가기
            </a>
          </div>

          {/* 개발 환경에서만 상세 에러 정보 표시 */}
          {process.env.NODE_ENV === 'development' && (
            <details
              style={{
                marginTop: '2rem',
                padding: '1rem',
                border: '1px solid #dc2626',
                borderRadius: '0.5rem',
                backgroundColor: '#fef2f2',
                textAlign: 'left',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#dc2626',
                  marginBottom: '1rem',
                }}
              >
                개발자 정보 (개발 환경에서만 표시)
              </summary>
              <div
                style={{
                  fontSize: '0.75rem',
                  marginTop: '1rem',
                }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <strong>에러 메시지:</strong>
                  <pre
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: '#ffffff',
                      borderRadius: '0.25rem',
                      overflow: 'auto',
                      fontSize: '0.75rem',
                    }}
                  >
                    {error.message}
                  </pre>
                </div>
                {error.digest && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Error Digest:</strong>
                    <code
                      style={{
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#ffffff',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                      }}
                    >
                      {error.digest}
                    </code>
                  </div>
                )}
                {error.stack && (
                  <div>
                    <strong>스택 트레이스:</strong>
                    <pre
                      style={{
                        marginTop: '0.5rem',
                        maxHeight: '200px',
                        padding: '0.5rem',
                        backgroundColor: '#ffffff',
                        borderRadius: '0.25rem',
                        overflow: 'auto',
                        fontSize: '0.75rem',
                      }}
                    >
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </body>
    </html>
  );
}

