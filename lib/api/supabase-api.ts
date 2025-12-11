/**
 * @file supabase-api.ts
 * @description Supabase 북마크 관련 API 함수
 *
 * 이 파일은 북마크 기능을 위한 Supabase 데이터베이스 작업을 처리하는 함수들을 제공합니다.
 *
 * 주요 기능:
 * 1. 북마크 조회 (getBookmark)
 * 2. 북마크 추가 (addBookmark)
 * 3. 북마크 제거 (removeBookmark)
 * 4. 사용자 북마크 목록 조회 (getUserBookmarks)
 *
 * 핵심 구현 로직:
 * - Clerk user ID를 Supabase user_id로 변환
 * - bookmarks 테이블과 users 테이블 조인
 * - 에러 처리 및 타입 안전성
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase 클라이언트
 * - lib/supabase/clerk-client.ts: Client Component용 클라이언트
 * - lib/supabase/server.ts: Server Component용 클라이언트
 *
 * @see {@link /docs/PRD.MD} - 북마크 기능 요구사항 참고
 * @see {@link /supabase/migrations/db.sql} - 데이터베이스 스키마 참고
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// =====================================================
// 타입 정의
// =====================================================

/**
 * 북마크 정보
 */
export interface Bookmark {
  id: string;
  user_id: string;
  content_id: string;
  created_at: string;
}

/**
 * 사용자 정보 (users 테이블)
 */
interface User {
  id: string;
  clerk_id: string;
  name: string;
  created_at: string;
}

// =====================================================
// 유틸리티 함수
// =====================================================

/**
 * Clerk user ID를 Supabase user_id로 변환
 * 사용자가 없을 경우 자동으로 동기화를 시도합니다.
 * @param supabase Supabase 클라이언트
 * @param clerkUserId Clerk user ID (예: "user_2abc...")
 * @param autoSync 사용자가 없을 경우 자동 동기화 시도 여부 (기본값: true)
 * @returns Supabase user_id (UUID) 또는 null
 */
async function getSupabaseUserId(
  supabase: SupabaseClient,
  clerkUserId: string,
  autoSync: boolean = true
): Promise<string | null> {
  // 1. 먼저 사용자 조회
  let { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  // 2. 사용자가 있고 에러가 없는 경우 반환
  if (data && !error) {
    return data.id;
  }

  // 3. 사용자가 없고 autoSync가 true인 경우 동기화 시도
  if (autoSync && (error?.code === "PGRST116" || !data)) {
    try {
      // 서버 사이드에서만 동기화 가능 (API 라우트 호출)
      // 클라이언트 사이드에서는 /api/sync-user를 호출해야 함
      // 여기서는 서버 사이드 클라이언트를 사용하는 경우에만 동기화 시도
      const isServer = typeof window === "undefined";
      
      if (isServer) {
        // 서버 사이드: Service Role 클라이언트로 직접 동기화
        try {
          const { getServiceRoleClient } = await import("@/lib/supabase/service-role");
          const serviceSupabase = getServiceRoleClient();
          
          // Clerk에서 사용자 정보 가져오기 (서버 사이드에서만 가능)
          const { auth, clerkClient } = await import("@clerk/nextjs/server");
          const { userId } = await auth();
          
          if (userId === clerkUserId) {
            const client = await clerkClient();
            const clerkUser = await client.users.getUser(userId);
            
            if (clerkUser) {
              const { data: syncedData, error: syncError } = await serviceSupabase
                .from("users")
                .upsert(
                  {
                    clerk_id: clerkUser.id,
                    name:
                      clerkUser.fullName ||
                      clerkUser.username ||
                      clerkUser.emailAddresses[0]?.emailAddress ||
                      "Unknown",
                  },
                  {
                    onConflict: "clerk_id",
                  }
                )
                .select()
                .single();

              if (!syncError && syncedData) {
                return syncedData.id;
              }
            }
          }
        } catch (serverSyncError) {
          // 서버 사이드 동기화 실패 시 무시 (클라이언트 사이드 동기화로 대체)
          console.error("서버 사이드 사용자 동기화 실패:", serverSyncError);
        }
      } else {
        // 클라이언트 사이드: API 라우트 호출
        const response = await fetch("/api/sync-user", {
          method: "POST",
        });

        if (response.ok) {
          // 동기화 후 다시 조회
          const { data: retryData, error: retryError } = await supabase
            .from("users")
            .select("id")
            .eq("clerk_id", clerkUserId)
            .single();

          if (retryData && !retryError) {
            return retryData.id;
          }
        }
      }
    } catch (syncError) {
      console.error("사용자 동기화 실패:", syncError);
      // 동기화 실패해도 계속 진행 (null 반환)
    }
  }

  // 4. 최종적으로 사용자를 찾을 수 없는 경우 null 반환
  if (error && error.code !== "PGRST116") {
    console.error("사용자 조회 실패:", error);
  }

  return null;
}

// =====================================================
// 북마크 API 함수
// =====================================================

/**
 * 특정 관광지의 북마크 여부 조회
 * @param supabase Supabase 클라이언트
 * @param clerkUserId Clerk user ID
 * @param contentId 관광지 contentId
 * @returns 북마크 정보 또는 null
 */
export async function getBookmark(
  supabase: SupabaseClient,
  clerkUserId: string,
  contentId: string
): Promise<Bookmark | null> {
  try {
    // 1. Clerk user ID를 Supabase user_id로 변환
    const userId = await getSupabaseUserId(supabase, clerkUserId);
    if (!userId) {
      return null;
    }

    // 2. 북마크 조회
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .eq("content_id", contentId)
      .single();

    if (error) {
      // 북마크가 없는 경우 (PGRST116: No rows found)
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("북마크 조회 실패:", error);
      throw new Error("북마크를 조회할 수 없습니다.");
    }

    return data as Bookmark;
  } catch (error) {
    console.error("getBookmark 에러:", error);
    throw error;
  }
}

/**
 * 북마크 추가
 * @param supabase Supabase 클라이언트
 * @param clerkUserId Clerk user ID
 * @param contentId 관광지 contentId
 * @returns 추가된 북마크 정보
 */
export async function addBookmark(
  supabase: SupabaseClient,
  clerkUserId: string,
  contentId: string
): Promise<Bookmark> {
  try {
    // 1. Clerk user ID를 Supabase user_id로 변환
    const userId = await getSupabaseUserId(supabase, clerkUserId);
    if (!userId) {
      throw new Error("사용자를 찾을 수 없습니다. 로그인 상태를 확인해주세요.");
    }

    // 2. 북마크 추가
    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        user_id: userId,
        content_id: contentId,
      })
      .select()
      .single();

    if (error) {
      // 중복 북마크 (UNIQUE 제약 위반)
      if (error.code === "23505") {
        // 이미 북마크된 경우, 기존 북마크 조회
        const existing = await getBookmark(supabase, clerkUserId, contentId);
        if (existing) {
          return existing;
        }
        throw new Error("이미 북마크된 관광지입니다.");
      }
      console.error("북마크 추가 실패:", error);
      throw new Error("북마크를 추가할 수 없습니다.");
    }

    return data as Bookmark;
  } catch (error) {
    console.error("addBookmark 에러:", error);
    throw error;
  }
}

/**
 * 북마크 제거
 * @param supabase Supabase 클라이언트
 * @param clerkUserId Clerk user ID
 * @param contentId 관광지 contentId
 * @returns 성공 여부
 */
export async function removeBookmark(
  supabase: SupabaseClient,
  clerkUserId: string,
  contentId: string
): Promise<boolean> {
  try {
    // 1. Clerk user ID를 Supabase user_id로 변환
    const userId = await getSupabaseUserId(supabase, clerkUserId);
    if (!userId) {
      throw new Error("사용자를 찾을 수 없습니다. 로그인 상태를 확인해주세요.");
    }

    // 2. 북마크 제거
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("content_id", contentId);

    if (error) {
      console.error("북마크 제거 실패:", error);
      throw new Error("북마크를 제거할 수 없습니다.");
    }

    return true;
  } catch (error) {
    console.error("removeBookmark 에러:", error);
    throw error;
  }
}

/**
 * 사용자의 모든 북마크 목록 조회
 * @param supabase Supabase 클라이언트
 * @param clerkUserId Clerk user ID
 * @returns 북마크 목록 (최신순)
 */
export async function getUserBookmarks(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<Bookmark[]> {
  try {
    // 1. Clerk user ID를 Supabase user_id로 변환 (자동 동기화 시도)
    const userId = await getSupabaseUserId(supabase, clerkUserId, true);
    if (!userId) {
      // 사용자를 찾을 수 없는 경우 명확한 에러 메시지
      throw new Error(
        "사용자를 찾을 수 없습니다. 로그인 상태를 확인하거나 잠시 후 다시 시도해주세요."
      );
    }

    // 2. 북마크 목록 조회 (최신순)
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("북마크 목록 조회 실패:", error);
      throw new Error("북마크 목록을 조회할 수 없습니다.");
    }

    return (data || []) as Bookmark[];
  } catch (error) {
    console.error("getUserBookmarks 에러:", error);
    throw error;
  }
}

