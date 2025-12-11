/**
 * @file bookmark-list-error.tsx
 * @description 북마크 목록 에러 컴포넌트
 *
 * 북마크 목록 로딩 실패 시 표시되는 에러 컴포넌트입니다.
 */

"use client";

import { useRouter } from "next/navigation";
import { Error } from "@/components/ui/error";

interface BookmarkListErrorProps {
  message: string;
}

export function BookmarkListError({ message }: BookmarkListErrorProps) {
  const router = useRouter();

  return (
    <Error
      message={message}
      onRetry={() => {
        router.refresh();
      }}
    />
  );
}

