import { createClient } from "@/lib/supabase/server-standard";
import { Suspense } from "react";
import Link from "next/link";

/**
 * Supabase 데이터 조회 예제 페이지
 *
 * Supabase 공식 문서의 Next.js 퀵스타트 패턴을 따릅니다:
 * https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 *
 * 이 페이지는 표준 Supabase 클라이언트를 사용하여
 * 공개 데이터를 조회하는 방법을 보여줍니다.
 */
async function InstrumentsData() {
  const supabase = await createClient();
  const { data: instruments, error } = await supabase
    .from("instruments")
    .select();

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-800 mb-2">에러 발생</h3>
        <p className="text-sm text-red-700">{error.message}</p>
        <p className="text-xs text-red-600 mt-2">
          💡 <strong>해결 방법:</strong>
          <br />
          1. Supabase Dashboard에서 instruments 테이블이 생성되었는지 확인
          <br />
          2. 환경 변수가 올바르게 설정되었는지 확인
          <br />
          3. RLS 정책이 공개 읽기를 허용하는지 확인
        </p>
      </div>
    );
  }

  if (!instruments || instruments.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">데이터 없음</h3>
        <p className="text-sm text-yellow-700">
          instruments 테이블에 데이터가 없습니다. Supabase Dashboard의 SQL Editor에서
          샘플 데이터를 삽입하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">악기 목록</h2>
      <ul className="space-y-2">
        {instruments.map((instrument: { id: number; name: string }) => (
          <li
            key={instrument.id}
            className="p-4 bg-white border rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">#{instrument.id}</span>
              <span className="font-medium">{instrument.name}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">💡 이 페이지의 작동 원리</h3>
        <ul className="text-sm text-blue-900 space-y-1 list-disc list-inside">
          <li>
            <code>@supabase/ssr</code>의 <code>createServerClient</code>를 사용합니다
          </li>
          <li>Server Component에서 직접 데이터를 조회합니다</li>
          <li>Cookie 기반 세션 관리가 자동으로 처리됩니다</li>
          <li>
            Supabase 공식 문서의 권장 패턴을 따릅니다:
            <br />
            <a
              href="https://supabase.com/docs/guides/getting-started/quickstarts/nextjs"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Supabase Next.js Quickstart
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function Instruments() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <Link
          href="/"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← 홈으로 돌아가기
        </Link>
        <h1 className="text-4xl font-bold mb-2">Supabase 데이터 조회 예제</h1>
        <p className="text-gray-600">
          Supabase 공식 문서의 Next.js 퀵스타트 패턴을 따라 구현한 예제입니다.
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-8">로딩 중...</div>}>
        <InstrumentsData />
      </Suspense>
    </div>
  );
}

