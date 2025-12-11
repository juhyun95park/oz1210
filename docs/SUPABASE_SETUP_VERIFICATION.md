# Supabase 설정 검증 가이드

이 문서는 Phase 5 북마크 기능을 위한 Supabase 데이터베이스 설정을 확인하고 검증하는 방법을 설명합니다.

## 검증 스크립트 실행

### 사전 요구사항

1. `.env` 파일에 다음 환경변수가 설정되어 있어야 합니다:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. `tsx` 패키지가 설치되어 있어야 합니다 (자동 설치됨)

### 실행 방법

```bash
pnpm run verify:supabase
```

또는 직접 실행:

```bash
npx tsx scripts/verify-supabase-setup.ts
```

## 검증 항목

스크립트는 다음 항목들을 자동으로 확인합니다:

### 1. 테이블 존재 여부
- `users` 테이블 존재 확인
- `bookmarks` 테이블 존재 확인

### 2. 테이블 구조 확인
- **users 테이블**: `id` (UUID, PK), `clerk_id` (TEXT, UNIQUE), `name` (TEXT), `created_at` (TIMESTAMPTZ)
- **bookmarks 테이블**: `id` (UUID, PK), `user_id` (UUID, FK), `content_id` (TEXT), `created_at` (TIMESTAMPTZ)

### 3. 외래키 관계 확인
- `bookmarks.user_id` → `users.id` 외래키 관계
- ON DELETE CASCADE 동작 확인

### 4. UNIQUE 제약조건 확인
- `bookmarks(user_id, content_id)` UNIQUE 제약조건
- 중복 북마크 방지 확인

### 5. RLS 상태 확인
- `users` 테이블 RLS 비활성화 확인
- `bookmarks` 테이블 RLS 비활성화 확인
- 개발 환경에서는 RLS가 비활성화되어 있어야 함

### 6. 인덱스 확인 (간접적)
- `idx_bookmarks_user_id` 인덱스
- `idx_bookmarks_content_id` 인덱스
- `idx_bookmarks_created_at` 인덱스 (DESC 정렬)

> **참고**: 인덱스는 Supabase 클라이언트로 직접 확인할 수 없으므로, Supabase Dashboard의 SQL Editor에서 직접 확인해야 합니다.

## 수동 확인 방법

스크립트로 확인할 수 없는 항목은 Supabase Dashboard에서 직접 확인할 수 있습니다.

### Supabase Dashboard에서 확인

1. **Supabase Dashboard** → **SQL Editor** 접속

2. **인덱스 확인**:
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND tablename = 'bookmarks';
   ```

3. **RLS 상태 확인**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('users', 'bookmarks');
   ```

4. **외래키 관계 확인**:
   ```sql
   SELECT 
     tc.constraint_name,
     tc.table_name,
     kcu.column_name,
     ccu.table_name AS foreign_table_name,
     ccu.column_name AS foreign_column_name,
     rc.delete_rule
   FROM information_schema.table_constraints AS tc
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   JOIN information_schema.referential_constraints AS rc
     ON rc.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY'
     AND tc.table_schema = 'public'
     AND tc.table_name = 'bookmarks';
   ```

5. **권한 확인**:
   ```sql
   SELECT grantee, privilege_type
   FROM information_schema.role_table_grants
   WHERE table_schema = 'public'
     AND table_name IN ('users', 'bookmarks');
   ```

## 문제 해결

### 테이블이 없는 경우

`supabase/migrations/db.sql` 파일을 Supabase에 적용하세요:

1. **Supabase Dashboard** → **SQL Editor** 접속
2. `supabase/migrations/db.sql` 파일 내용을 복사하여 실행

또는 Supabase CLI 사용:

```bash
supabase db push
```

### 스키마 불일치 시

1. 불일치하는 부분을 확인
2. 수정 마이그레이션 파일 작성
3. Supabase에 적용

### 인덱스 누락 시

다음 SQL을 실행하여 인덱스를 생성하세요:

```sql
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_content_id ON public.bookmarks(content_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at DESC);
```

### RLS 활성화된 경우

개발 환경에서는 RLS를 비활성화해야 합니다:

```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks DISABLE ROW LEVEL SECURITY;
```

> **주의**: 프로덕션 환경에서는 적절한 RLS 정책을 설정해야 합니다.

## 검증 체크리스트

모든 검증이 완료되면 다음 항목들이 모두 만족되어야 합니다:

- [x] `users` 테이블 존재
- [x] `bookmarks` 테이블 존재
- [x] `users` 테이블 구조가 `db.sql`과 일치
- [x] `bookmarks` 테이블 구조가 `db.sql`과 일치
- [x] 외래키 관계 정상 (`bookmarks.user_id` → `users.id`)
- [x] UNIQUE 제약조건 정상 (`bookmarks(user_id, content_id)`)
- [x] 인덱스 3개 모두 생성됨
- [x] RLS 비활성화 상태 (개발 환경)
- [x] 권한 정상 부여 (anon, authenticated, service_role)

## 참고 파일

- `supabase/migrations/db.sql`: 데이터베이스 스키마 정의
- `lib/api/supabase-api.ts`: 북마크 API 함수
- `AGENTS.md`: Clerk + Supabase 통합 가이드

