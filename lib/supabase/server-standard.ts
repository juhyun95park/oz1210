import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 표준 Supabase 클라이언트 (Server Component/Server Action용)
 *
 * Supabase 공식 문서의 권장 방식:
 * - @supabase/ssr 패키지 사용
 * - Cookie 기반 세션 관리
 * - Supabase Auth를 사용하는 경우에 적합
 *
 * 주의: 현재 프로젝트는 Clerk를 사용하므로, 이 클라이언트는
 * Supabase Auth를 사용하거나 공개 데이터 접근 시에만 사용하세요.
 *
 * @example
 * ```tsx
 * // Server Component
 * import { createClient } from '@/lib/supabase/server-standard';
 *
 * export default async function MyPage() {
 *   const supabase = await createClient();
 *   const { data, error } = await supabase.from('posts').select('*');
 *
 *   if (error) {
 *     return <div>Error: {error.message}</div>;
 *   }
 *
 *   return (
 *     <div>
 *       {data?.map(post => <div key={post.id}>{post.title}</div>)}
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
 * import { createClient } from '@/lib/supabase/server-standard';
 *
 * export async function createPost(title: string) {
 *   const supabase = await createClient();
 *   const { data, error } = await supabase
 *     .from('posts')
 *     .insert({ title })
 *     .select()
 *     .single();
 *
 *   if (error) throw new Error(error.message);
 *   return data;
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

