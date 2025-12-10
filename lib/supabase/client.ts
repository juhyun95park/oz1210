import { createBrowserClient } from "@supabase/ssr";

/**
 * 표준 Supabase 브라우저 클라이언트 (Client Component용)
 *
 * Supabase 공식 문서의 권장 방식:
 * - @supabase/ssr 패키지의 createBrowserClient 사용
 * - 자동 Cookie 관리
 * - Supabase Auth를 사용하는 경우에 적합
 *
 * 주의: 현재 프로젝트는 Clerk를 사용하므로, 이 클라이언트는
 * Supabase Auth를 사용하거나 공개 데이터 접근 시에만 사용하세요.
 * Clerk 통합이 필요한 경우 `useClerkSupabaseClient()`를 사용하세요.
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { supabase } from '@/lib/supabase/client';
 * import { useEffect, useState } from 'react';
 *
 * export default function MyComponent() {
 *   const [posts, setPosts] = useState([]);
 *
 *   useEffect(() => {
 *     async function loadPosts() {
 *       const { data } = await supabase.from('posts').select('*');
 *       if (data) setPosts(data);
 *     }
 *     loadPosts();
 *   }, []);
 *
 *   return <div>{posts.map(post => <div key={post.id}>{post.title}</div>)}</div>;
 * }
 * ```
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
