"use client";

import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Client Component용)
 *
 * 2025년 4월 1일부터 권장되는 방식 (JWT 템플릿 deprecated):
 * - Clerk Dashboard에서 Supabase 통합 활성화 필요
 * - Supabase에서 Clerk를 Third-Party Auth Provider로 추가 필요
 * - useAuth().getToken()으로 현재 세션 토큰 사용
 * - Supabase가 Clerk 세션 토큰을 자동으로 검증
 * - RLS 정책에서 auth.jwt()->>'sub'로 Clerk user ID 확인
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
 * import { useEffect, useState } from 'react';
 *
 * export default function MyComponent() {
 *   const supabase = useClerkSupabaseClient();
 *   const [tasks, setTasks] = useState([]);
 *
 *   useEffect(() => {
 *     async function loadTasks() {
 *       const { data } = await supabase.from('tasks').select('*');
 *       if (data) setTasks(data);
 *     }
 *     loadTasks();
 *   }, [supabase]);
 *
 *   return <div>{tasks.map(task => <div key={task.id}>{task.name}</div>)}</div>;
 * }
 * ```
 */
export function useClerkSupabaseClient() {
  const { getToken } = useAuth();

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createClient(supabaseUrl, supabaseKey, {
      async accessToken() {
        return (await getToken()) ?? null;
      },
    });
  }, [getToken]);

  return supabase;
}
