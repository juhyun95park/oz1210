/**
 * @file use-infinite-scroll.ts
 * @description 무한 스크롤 훅
 *
 * 이 훅은 Intersection Observer를 사용하여 무한 스크롤 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. Intersection Observer를 사용한 스크롤 감지
 * 2. 하단 로딩 인디케이터 표시
 * 3. 에러 처리
 * 4. 로딩 상태 관리
 *
 * @dependencies
 * - React hooks (useRef, useEffect, useState, useCallback)
 *
 * @see {@link /docs/PRD.MD} - 무한 스크롤 요구사항 참고
 */

"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface UseInfiniteScrollOptions {
  /**
   * 다음 페이지 로드 함수
   */
  onLoadMore: () => void | Promise<void>;
  /**
   * 로딩 중인지 여부
   */
  isLoading: boolean;
  /**
   * 더 이상 로드할 데이터가 없는지 여부
   */
  hasMore: boolean;
  /**
   * 에러 발생 여부
   */
  error?: Error | null;
  /**
   * Intersection Observer 옵션
   */
  rootMargin?: string;
  /**
   * 로드 트리거 임계값 (0.0 ~ 1.0)
   * @default 0.1
   */
  threshold?: number;
  /**
   * 활성화 여부
   * @default true
   */
  enabled?: boolean;
}

interface UseInfiniteScrollReturn {
  /**
   * 하단 로딩 인디케이터에 연결할 ref
   */
  sentinelRef: React.RefObject<HTMLDivElement>;
  /**
   * 수동으로 다음 페이지 로드
   */
  loadMore: () => void;
  /**
   * 무한 스크롤 재설정
   */
  reset: () => void;
}

/**
 * 무한 스크롤 훅
 */
export function useInfiniteScroll({
  onLoadMore,
  isLoading,
  hasMore,
  error,
  rootMargin = "100px",
  threshold = 0.1,
  enabled = true,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isObserving, setIsObserving] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 수동으로 다음 페이지 로드
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && enabled) {
      onLoadMore();
    }
  }, [isLoading, hasMore, enabled, onLoadMore]);

  // 무한 스크롤 재설정
  const reset = useCallback(() => {
    setIsObserving(true);
  }, []);

  useEffect(() => {
    // 활성화되지 않았거나 더 이상 로드할 데이터가 없으면 관찰 중지
    if (!enabled || !hasMore || isLoading || error) {
      setIsObserving(false);
      return;
    }

    // Intersection Observer 설정
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && isObserving && !isLoading && hasMore) {
          setIsObserving(false);
          onLoadMore();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observerRef.current = observer;

    // 센티널 요소 관찰 시작
    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    // 정리 함수
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [
    enabled,
    hasMore,
    isLoading,
    error,
    isObserving,
    onLoadMore,
    rootMargin,
    threshold,
  ]);

  // 로딩이 완료되면 다시 관찰 시작
  useEffect(() => {
    if (!isLoading && hasMore && enabled && !error) {
      setIsObserving(true);
    }
  }, [isLoading, hasMore, enabled, error]);

  return {
    sentinelRef,
    loadMore,
    reset,
  };
}

