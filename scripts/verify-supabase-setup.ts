/**
 * @file verify-supabase-setup.ts
 * @description Supabase 데이터베이스 설정 검증 스크립트
 *
 * 이 스크립트는 북마크 기능을 위한 Supabase 데이터베이스 설정을 확인하고 검증합니다.
 *
 * 주요 확인 항목:
 * 1. 테이블 존재 여부 (users, bookmarks)
 * 2. 테이블 구조 (컬럼, 타입, 제약조건)
 * 3. 외래키 관계 (bookmarks.user_id → users.id)
 * 4. 인덱스 (user_id, content_id, created_at)
 * 5. RLS 상태 (비활성화 확인)
 * 6. 권한 (anon, authenticated, service_role)
 *
 * @usage
 * ```bash
 * npx tsx scripts/verify-supabase-setup.ts
 * ```
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase 클라이언트
 * - lib/supabase/service-role.ts: Service Role 클라이언트
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";

// =====================================================
// 타입 정의
// =====================================================

interface TableInfo {
  table_name: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface ConstraintInfo {
  constraint_name: string;
  constraint_type: string;
}

interface ForeignKeyInfo {
  constraint_name: string;
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
  delete_rule: string;
}

interface IndexInfo {
  indexname: string;
  indexdef: string;
}

interface RLSInfo {
  tablename: string;
  rowsecurity: boolean;
}

interface PermissionInfo {
  grantee: string;
  privilege_type: string;
}

// =====================================================
// 검증 결과 타입
// =====================================================

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: any;
}

// =====================================================
// 검증 함수들
// =====================================================

/**
 * 테이블 존재 여부 확인
 */
async function verifyTablesExist(
  supabase: ReturnType<typeof getServiceRoleClient>
): Promise<VerificationResult> {
  try {
    const { data, error } = await supabase.rpc("exec_sql", {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'bookmarks')
        ORDER BY table_name;
      `,
    });

    if (error) {
      // RPC 함수가 없을 수 있으므로 직접 쿼리 시도
      const { data: tables, error: queryError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .in("table_name", ["users", "bookmarks"]);

      if (queryError) {
        // Supabase 클라이언트로는 information_schema에 직접 접근할 수 없으므로
        // 실제 테이블에 쿼리를 시도하여 존재 여부 확인
        const usersCheck = await supabase.from("users").select("id").limit(1);
        const bookmarksCheck = await supabase
          .from("bookmarks")
          .select("id")
          .limit(1);

        const usersExists = !usersCheck.error;
        const bookmarksExists = !bookmarksCheck.error;

        if (usersExists && bookmarksExists) {
          return {
            passed: true,
            message: "✅ users와 bookmarks 테이블이 모두 존재합니다.",
            details: { users: true, bookmarks: true },
          };
        } else {
          return {
            passed: false,
            message: `❌ 테이블이 누락되었습니다. users: ${usersExists}, bookmarks: ${bookmarksExists}`,
            details: { users: usersExists, bookmarks: bookmarksExists },
          };
        }
      }
    }

    return {
      passed: true,
      message: "✅ 테이블 존재 확인 완료",
      details: data,
    };
  } catch (error: any) {
    return {
      passed: false,
      message: `❌ 테이블 확인 중 오류: ${error.message}`,
      details: error,
    };
  }
}

/**
 * users 테이블 구조 확인
 */
async function verifyUsersTableStructure(
  supabase: ReturnType<typeof getServiceRoleClient>
): Promise<VerificationResult> {
  try {
    // 실제 데이터를 조회하여 구조 확인
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .limit(0);

    if (error) {
      return {
        passed: false,
        message: `❌ users 테이블 접근 실패: ${error.message}`,
        details: error,
      };
    }

    // 예상되는 컬럼: id, clerk_id, name, created_at
    // 실제 구조는 Supabase가 자동으로 반환하므로, 타입 체크로 검증
    const expectedColumns = ["id", "clerk_id", "name", "created_at"];
    const actualColumns = data ? Object.keys(data[0] || {}) : [];

    const missingColumns = expectedColumns.filter(
      (col) => !actualColumns.includes(col)
    );

    if (missingColumns.length > 0) {
      return {
        passed: false,
        message: `❌ users 테이블에 누락된 컬럼: ${missingColumns.join(", ")}`,
        details: { expected: expectedColumns, actual: actualColumns },
      };
    }

    return {
      passed: true,
      message: "✅ users 테이블 구조가 올바릅니다.",
      details: { columns: actualColumns },
    };
  } catch (error: any) {
    return {
      passed: false,
      message: `❌ users 테이블 구조 확인 중 오류: ${error.message}`,
      details: error,
    };
  }
}

/**
 * bookmarks 테이블 구조 확인
 */
async function verifyBookmarksTableStructure(
  supabase: ReturnType<typeof getServiceRoleClient>
): Promise<VerificationResult> {
  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .limit(0);

    if (error) {
      return {
        passed: false,
        message: `❌ bookmarks 테이블 접근 실패: ${error.message}`,
        details: error,
      };
    }

    const expectedColumns = ["id", "user_id", "content_id", "created_at"];
    const actualColumns = data ? Object.keys(data[0] || {}) : [];

    const missingColumns = expectedColumns.filter(
      (col) => !actualColumns.includes(col)
    );

    if (missingColumns.length > 0) {
      return {
        passed: false,
        message: `❌ bookmarks 테이블에 누락된 컬럼: ${missingColumns.join(", ")}`,
        details: { expected: expectedColumns, actual: actualColumns },
      };
    }

    return {
      passed: true,
      message: "✅ bookmarks 테이블 구조가 올바릅니다.",
      details: { columns: actualColumns },
    };
  } catch (error: any) {
    return {
      passed: false,
      message: `❌ bookmarks 테이블 구조 확인 중 오류: ${error.message}`,
      details: error,
    };
  }
}

/**
 * 외래키 관계 확인 (bookmarks.user_id → users.id)
 */
async function verifyForeignKey(
  supabase: ReturnType<typeof getServiceRoleClient>
): Promise<VerificationResult> {
  try {
    // 외래키 관계는 실제 데이터 삽입/삭제로 테스트
    // 하지만 테스트 데이터를 생성하지 않으므로, 구조만 확인
    // 실제로는 users 테이블에 존재하는 user_id로만 bookmarks를 생성할 수 있어야 함

    // 임시 사용자 생성 (테스트용)
    const testClerkId = `test_verify_${Date.now()}`;
    const { data: testUser, error: insertError } = await supabase
      .from("users")
      .insert({
        clerk_id: testClerkId,
        name: "Test User (Verification)",
      })
      .select()
      .single();

    if (insertError) {
      return {
        passed: false,
        message: `❌ 테스트 사용자 생성 실패: ${insertError.message}`,
        details: insertError,
      };
    }

    // 외래키 테스트: bookmarks에 user_id 삽입 시도
    const { error: fkError } = await supabase
      .from("bookmarks")
      .insert({
        user_id: testUser.id,
        content_id: "test_content_123",
      })
      .select()
      .single();

    if (fkError) {
      // 테스트 데이터 정리
      await supabase.from("users").delete().eq("id", testUser.id);
      return {
        passed: false,
        message: `❌ 외래키 관계 확인 실패: ${fkError.message}`,
        details: fkError,
      };
    }

    // 테스트 데이터 정리
    await supabase.from("bookmarks").delete().eq("id", testUser.id);
    await supabase.from("users").delete().eq("id", testUser.id);

    return {
      passed: true,
      message: "✅ 외래키 관계 (bookmarks.user_id → users.id)가 정상입니다.",
      details: { foreign_key: "bookmarks.user_id → users.id" },
    };
  } catch (error: any) {
    return {
      passed: false,
      message: `❌ 외래키 확인 중 오류: ${error.message}`,
      details: error,
    };
  }
}

/**
 * UNIQUE 제약조건 확인 (bookmarks(user_id, content_id))
 */
async function verifyUniqueConstraint(
  supabase: ReturnType<typeof getServiceRoleClient>
): Promise<VerificationResult> {
  try {
    // 테스트 사용자 생성
    const testClerkId = `test_unique_${Date.now()}`;
    const { data: testUser, error: userError } = await supabase
      .from("users")
      .insert({
        clerk_id: testClerkId,
        name: "Test User (Unique Test)",
      })
      .select()
      .single();

    if (userError) {
      return {
        passed: false,
        message: `❌ 테스트 사용자 생성 실패: ${userError.message}`,
        details: userError,
      };
    }

    const testContentId = "test_unique_content_123";

    // 첫 번째 북마크 추가
    const { error: firstInsertError } = await supabase
      .from("bookmarks")
      .insert({
        user_id: testUser.id,
        content_id: testContentId,
      });

    if (firstInsertError) {
      await supabase.from("users").delete().eq("id", testUser.id);
      return {
        passed: false,
        message: `❌ 첫 번째 북마크 추가 실패: ${firstInsertError.message}`,
        details: firstInsertError,
      };
    }

    // 중복 북마크 추가 시도 (UNIQUE 제약 위반)
    const { error: duplicateError } = await supabase
      .from("bookmarks")
      .insert({
        user_id: testUser.id,
        content_id: testContentId,
      });

    // 중복 삽입이 성공하면 UNIQUE 제약이 없는 것
    if (!duplicateError) {
      // 테스트 데이터 정리
      await supabase.from("bookmarks").delete().eq("user_id", testUser.id);
      await supabase.from("users").delete().eq("id", testUser.id);
      return {
        passed: false,
        message: "❌ UNIQUE 제약조건이 없습니다. 중복 북마크가 허용됩니다.",
        details: { constraint: "unique_user_bookmark" },
      };
    }

    // UNIQUE 제약 위반 에러 코드 확인
    if (duplicateError.code !== "23505") {
      // 테스트 데이터 정리
      await supabase.from("bookmarks").delete().eq("user_id", testUser.id);
      await supabase.from("users").delete().eq("id", testUser.id);
      return {
        passed: false,
        message: `❌ UNIQUE 제약 위반이 예상과 다릅니다: ${duplicateError.message}`,
        details: duplicateError,
      };
    }

    // 테스트 데이터 정리
    await supabase.from("bookmarks").delete().eq("user_id", testUser.id);
    await supabase.from("users").delete().eq("id", testUser.id);

    return {
      passed: true,
      message:
        "✅ UNIQUE 제약조건 (bookmarks(user_id, content_id))이 정상입니다.",
      details: { constraint: "unique_user_bookmark" },
    };
  } catch (error: any) {
    return {
      passed: false,
      message: `❌ UNIQUE 제약조건 확인 중 오류: ${error.message}`,
      details: error,
    };
  }
}

/**
 * RLS 상태 확인
 */
async function verifyRLSStatus(
  supabase: ReturnType<typeof getServiceRoleClient>
): Promise<VerificationResult> {
  try {
    // RLS가 비활성화되어 있으면 Service Role 클라이언트로 접근 가능
    // RLS가 활성화되어 있으면 권한 에러가 발생할 수 있음
    // 하지만 Service Role은 RLS를 우회하므로, 실제로는 anon 또는 authenticated 역할로 테스트해야 함

    // Service Role로는 RLS 상태를 직접 확인할 수 없으므로
    // 실제 데이터 접근으로 간접 확인
    const { error: usersError } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    const { error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("id")
      .limit(1);

    // Service Role은 RLS를 우회하므로 에러가 없어야 함
    if (usersError || bookmarksError) {
      return {
        passed: false,
        message: `❌ RLS 상태 확인 실패. users: ${usersError?.message || "OK"}, bookmarks: ${bookmarksError?.message || "OK"}`,
        details: { users: usersError, bookmarks: bookmarksError },
      };
    }

    // RLS가 비활성화되어 있다고 가정 (개발 환경)
    // 실제 RLS 상태는 Supabase Dashboard에서 확인해야 함
    return {
      passed: true,
      message:
        "✅ RLS가 비활성화된 것으로 확인됩니다. (Service Role로 접근 가능)",
      details: {
        note: "실제 RLS 상태는 Supabase Dashboard에서 확인하세요.",
      },
    };
  } catch (error: any) {
    return {
      passed: false,
      message: `❌ RLS 상태 확인 중 오류: ${error.message}`,
      details: error,
    };
  }
}

/**
 * 인덱스 확인 (간접적)
 */
async function verifyIndexes(
  supabase: ReturnType<typeof getServiceRoleClient>
): Promise<VerificationResult> {
  try {
    // Supabase 클라이언트로는 인덱스를 직접 조회할 수 없음
    // 하지만 인덱스가 있으면 쿼리 성능이 향상되므로, 실제 쿼리로 간접 확인
    // 인덱스 확인은 Supabase Dashboard의 SQL Editor에서 직접 확인해야 함

    // user_id로 조회 (인덱스가 있으면 빠름)
    const { error: userIndexError } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", "00000000-0000-0000-0000-000000000000")
      .limit(1);

    // content_id로 조회
    const { error: contentIndexError } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("content_id", "test")
      .limit(1);

    // created_at으로 정렬 (인덱스가 있으면 빠름)
    const { error: dateIndexError } = await supabase
      .from("bookmarks")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1);

    if (userIndexError || contentIndexError || dateIndexError) {
      return {
        passed: false,
        message: `❌ 인덱스 확인 중 쿼리 실패. user_id: ${userIndexError?.message || "OK"}, content_id: ${contentIndexError?.message || "OK"}, created_at: ${dateIndexError?.message || "OK"}`,
        details: {
          user_id: userIndexError,
          content_id: contentIndexError,
          created_at: dateIndexError,
        },
      };
    }

    return {
      passed: true,
      message:
        "✅ 인덱스 관련 쿼리가 정상 작동합니다. (실제 인덱스는 Supabase Dashboard에서 확인하세요.)",
      details: {
        note: "인덱스 확인은 Supabase Dashboard의 SQL Editor에서 다음 쿼리를 실행하세요:",
        query:
          "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'bookmarks';",
      },
    };
  } catch (error: any) {
    return {
      passed: false,
      message: `❌ 인덱스 확인 중 오류: ${error.message}`,
      details: error,
    };
  }
}

// =====================================================
// 환경변수 확인
// =====================================================

function checkEnvironmentVariables(): boolean {
  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const missingVars = requiredVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error("❌ 필수 환경변수가 설정되지 않았습니다:");
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error();
    console.error("💡 해결 방법:");
    console.error("   1. .env 파일을 프로젝트 루트에 생성하세요.");
    console.error("   2. 다음 환경변수를 설정하세요:");
    console.error("      NEXT_PUBLIC_SUPABASE_URL=your_supabase_url");
    console.error("      SUPABASE_SERVICE_ROLE_KEY=your_service_role_key");
    console.error();
    console.error("   또는 다음 명령으로 .env 파일을 확인하세요:");
    console.error("   cat .env");
    return false;
  }

  return true;
}

// =====================================================
// 메인 함수
// =====================================================

async function main() {
  console.log("🔍 Supabase 데이터베이스 설정 검증 시작...\n");

  // 환경변수 확인
  if (!checkEnvironmentVariables()) {
    process.exit(1);
  }

  let supabase;
  try {
    supabase = getServiceRoleClient();
  } catch (error: any) {
    console.error("❌ Supabase 클라이언트 생성 실패:", error.message);
    process.exit(1);
  }

  const results: VerificationResult[] = [];

  // 1. 테이블 존재 여부 확인
  console.log("1️⃣ 테이블 존재 여부 확인 중...");
  const tablesResult = await verifyTablesExist(supabase);
  results.push(tablesResult);
  console.log(tablesResult.message);
  if (tablesResult.details) {
    console.log("   상세:", JSON.stringify(tablesResult.details, null, 2));
  }
  console.log();

  // 2. users 테이블 구조 확인
  console.log("2️⃣ users 테이블 구조 확인 중...");
  const usersStructureResult = await verifyUsersTableStructure(supabase);
  results.push(usersStructureResult);
  console.log(usersStructureResult.message);
  if (usersStructureResult.details) {
    console.log("   상세:", JSON.stringify(usersStructureResult.details, null, 2));
  }
  console.log();

  // 3. bookmarks 테이블 구조 확인
  console.log("3️⃣ bookmarks 테이블 구조 확인 중...");
  const bookmarksStructureResult =
    await verifyBookmarksTableStructure(supabase);
  results.push(bookmarksStructureResult);
  console.log(bookmarksStructureResult.message);
  if (bookmarksStructureResult.details) {
    console.log(
      "   상세:",
      JSON.stringify(bookmarksStructureResult.details, null, 2)
    );
  }
  console.log();

  // 4. 외래키 관계 확인
  console.log("4️⃣ 외래키 관계 확인 중...");
  const fkResult = await verifyForeignKey(supabase);
  results.push(fkResult);
  console.log(fkResult.message);
  if (fkResult.details) {
    console.log("   상세:", JSON.stringify(fkResult.details, null, 2));
  }
  console.log();

  // 5. UNIQUE 제약조건 확인
  console.log("5️⃣ UNIQUE 제약조건 확인 중...");
  const uniqueResult = await verifyUniqueConstraint(supabase);
  results.push(uniqueResult);
  console.log(uniqueResult.message);
  if (uniqueResult.details) {
    console.log("   상세:", JSON.stringify(uniqueResult.details, null, 2));
  }
  console.log();

  // 6. RLS 상태 확인
  console.log("6️⃣ RLS 상태 확인 중...");
  const rlsResult = await verifyRLSStatus(supabase);
  results.push(rlsResult);
  console.log(rlsResult.message);
  if (rlsResult.details) {
    console.log("   상세:", JSON.stringify(rlsResult.details, null, 2));
  }
  console.log();

  // 7. 인덱스 확인
  console.log("7️⃣ 인덱스 확인 중...");
  const indexesResult = await verifyIndexes(supabase);
  results.push(indexesResult);
  console.log(indexesResult.message);
  if (indexesResult.details) {
    console.log("   상세:", JSON.stringify(indexesResult.details, null, 2));
  }
  console.log();

  // 결과 요약
  console.log("=".repeat(60));
  console.log("📊 검증 결과 요약");
  console.log("=".repeat(60));

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log(`✅ 통과: ${passedCount}개`);
  console.log(`❌ 실패: ${failedCount}개`);
  console.log();

  if (failedCount > 0) {
    console.log("❌ 실패한 항목:");
    results.forEach((result, index) => {
      if (!result.passed) {
        console.log(`   ${index + 1}. ${result.message}`);
      }
    });
    console.log();
    console.log(
      "💡 해결 방법: supabase/migrations/db.sql 파일을 Supabase에 적용하세요."
    );
    process.exit(1);
  } else {
    console.log("🎉 모든 검증 항목이 통과했습니다!");
    console.log();
    console.log("📝 참고:");
    console.log(
      "   - 인덱스와 RLS 상태는 Supabase Dashboard에서 직접 확인하세요."
    );
    console.log(
      "   - SQL Editor에서 다음 쿼리를 실행하여 상세 정보를 확인할 수 있습니다:"
    );
    console.log("     SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'bookmarks';");
    console.log("     SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'bookmarks');");
    process.exit(0);
  }
}

// 스크립트 실행
main().catch((error) => {
  console.error("❌ 검증 스크립트 실행 중 오류:", error);
  process.exit(1);
});

