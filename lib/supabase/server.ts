import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Server Component/Server Action용)
 *
 * 2025년 4월 1일부터 권장되는 방식 (JWT 템플릿 deprecated):
 * - Clerk Dashboard에서 Supabase 통합 활성화 필요
 * - Supabase에서 Clerk를 Third-Party Auth Provider로 추가 필요
 * - auth().getToken()으로 현재 세션 토큰 사용
 * - Supabase가 Clerk 세션 토큰을 자동으로 검증
 * - RLS 정책에서 auth.jwt()->>'sub'로 Clerk user ID 확인
 *
 * @example
 * ```tsx
 * // Server Component
 * import { createClerkSupabaseClient } from '@/lib/supabase/server';
 *
 * export default async function MyPage() {
 *   const supabase = createClerkSupabaseClient();
 *   const { data, error } = await supabase.from('tasks').select('*');
 *
 *   if (error) {
 *     return <div>Error: {error.message}</div>;
 *   }
 *
 *   return (
 *     <div>
 *       {data?.map(task => <div key={task.id}>{task.name}</div>)}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```ts
 * // Server Action
 * 'use server';
 *
 * import { createClerkSupabaseClient } from '@/lib/supabase/server';
 *
 * export async function createTask(name: string) {
 *   const supabase = createClerkSupabaseClient();
 *   const { data, error } = await supabase
 *     .from('tasks')
 *     .insert({ name })
 *     .select()
 *     .single();
 *
 *   if (error) throw new Error(error.message);
 *   return data;
 * }
 * ```
 */
export function createClerkSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseKey, {
    async accessToken() {
      return (await auth()).getToken();
    },
  });
}
