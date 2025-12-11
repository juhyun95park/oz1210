/**
 * @file not-found.tsx
 * @description 404 에러 페이지
 *
 * 이 컴포넌트는 Next.js 15 App Router의 not-found.tsx 패턴을 사용하여
 * 404 에러를 처리합니다.
 *
 * 주요 기능:
 * 1. 사용자 친화적인 404 메시지 표시
 * 2. 홈으로 돌아가기 버튼 제공
 * 3. 검색 기능 링크 제공
 * 4. 반응형 디자인 및 접근성 개선
 *
 * 핵심 구현 로직:
 * - Next.js 15의 not-found.tsx 패턴 준수
 * - Server Component로 구현 (기본)
 * - notFound() 함수 호출 시 자동 표시
 * - 시맨틱 HTML 사용
 *
 * @dependencies
 * - next/link: Link 컴포넌트
 * - components/ui/button: Button 컴포넌트
 * - lucide-react: 아이콘
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/not-found} - Next.js Not Found Handling
 */

import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main
      className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12"
      role="main"
      aria-label="페이지를 찾을 수 없음"
    >
      <div className="container mx-auto max-w-2xl text-center">
        {/* 404 숫자 표시 */}
        <div className="mb-8">
          <h1
            className="text-8xl font-bold text-primary sm:text-9xl"
            aria-label="404"
          >
            404
          </h1>
        </div>

        {/* 에러 메시지 */}
        <div className="mb-8 space-y-4">
          <h2 className="text-2xl font-bold sm:text-3xl">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-muted-foreground">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            <br className="hidden sm:block" />
            URL을 확인하시거나 홈으로 돌아가서 다시 시도해주세요.
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            asChild
            variant="default"
            size="lg"
            className="min-h-[44px] min-w-[140px]"
            aria-label="홈으로 돌아가기"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="min-h-[44px] min-w-[140px]"
            aria-label="관광지 검색하기"
          >
            <Link href="/">
              <Search className="mr-2 h-4 w-4" />
              관광지 검색하기
            </Link>
          </Button>
        </div>

        {/* 도움말 링크 */}
        <div className="mt-12 space-y-2 text-sm text-muted-foreground">
          <p>다음 페이지를 확인해보세요:</p>
          <nav
            className="flex flex-wrap items-center justify-center gap-4"
            aria-label="유용한 링크"
          >
            <Link
              href="/"
              className="hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              홈
            </Link>
            <span aria-hidden="true">•</span>
            <Link
              href="/stats"
              className="hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              통계
            </Link>
            <span aria-hidden="true">•</span>
            <Link
              href="/bookmarks"
              className="hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              북마크
            </Link>
          </nav>
        </div>
      </div>
    </main>
  );
}

