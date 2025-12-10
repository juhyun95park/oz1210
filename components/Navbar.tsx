import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { Home, BarChart3, Bookmark } from "lucide-react";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex justify-between items-center p-4 gap-4 h-16 max-w-7xl mx-auto">
        {/* 로고 */}
        <Link href="/" className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">My Trip</span>
        </Link>

        {/* 네비게이션 링크 */}
        <nav className="hidden md:flex gap-6 items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
          >
            <Home className="h-4 w-4" />
            홈
          </Link>
          <Link
            href="/stats"
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
          >
            <BarChart3 className="h-4 w-4" />
            통계
          </Link>
          <Link
            href="/bookmarks"
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
          >
            <Bookmark className="h-4 w-4" />
            북마크
          </Link>
        </nav>

        {/* 검색창 (Phase 2에서 구현 예정) */}
        <div className="flex-1 max-w-md mx-4 hidden lg:block">
          {/* 검색창은 Phase 2에서 tour-search 컴포넌트로 구현 */}
        </div>

        {/* 로그인 버튼 */}
        <div className="flex gap-4 items-center">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">
                로그인
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
