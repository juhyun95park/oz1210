import { koKR } from "@clerk/localizations";

/**
 * Clerk 한국어 로컬라이제이션 설정
 *
 * 이 파일은 Clerk 컴포넌트의 한국어 로컬라이제이션을 관리합니다.
 * 기본 koKR 로컬라이제이션에 커스텀 에러 메시지를 추가합니다.
 *
 * @see https://clerk.com/docs/guides/customizing-clerk/localization
 */

/**
 * 한국어 로컬라이제이션 (커스텀 에러 메시지 포함)
 *
 * 기본 한국어 로컬라이제이션에 브랜드에 맞는 에러 메시지를 추가합니다.
 * 필요에 따라 추가 텍스트를 커스터마이징할 수 있습니다.
 */
export const koreanLocalization = {
  ...koKR,
  unstable__errors: {
    ...koKR.unstable__errors,
    // 일반적인 에러 메시지
    not_allowed_access:
      "접근이 허용되지 않은 이메일 도메인입니다. 접근을 원하시면 관리자에게 문의해주세요.",
    form_identifier_not_found:
      "입력한 이메일 주소를 찾을 수 없습니다. 다시 확인해주세요.",
    form_password_incorrect:
      "비밀번호가 올바르지 않습니다. 다시 시도해주세요.",
    form_param_format_invalid:
      "입력 형식이 올바르지 않습니다. 올바른 형식으로 입력해주세요.",
    form_password_length_too_short:
      "비밀번호가 너무 짧습니다. 최소 8자 이상 입력해주세요.",
    form_password_pwned:
      "이 비밀번호는 보안상 안전하지 않습니다. 다른 비밀번호를 사용해주세요.",
    form_password_size_in_bytes_too_large:
      "비밀번호가 너무 깁니다. 더 짧은 비밀번호를 사용해주세요.",
    form_username_invalid:
      "사용자 이름 형식이 올바르지 않습니다.",
    identification_deletion_failed:
      "계정 삭제에 실패했습니다. 다시 시도해주세요.",
    session_exists:
      "이미 로그인되어 있습니다.",
    session_not_found:
      "세션을 찾을 수 없습니다. 다시 로그인해주세요.",
    user_locked:
      "계정이 잠겨 있습니다. 관리자에게 문의해주세요.",
    too_many_requests:
      "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
    // OAuth 관련 에러
    oauth_access_denied:
      "소셜 로그인 접근이 거부되었습니다.",
    oauth_callback_error:
      "소셜 로그인 중 오류가 발생했습니다. 다시 시도해주세요.",
    // 이메일 인증 관련
    form_email_verification_link_expired:
      "이메일 인증 링크가 만료되었습니다. 새로운 링크를 요청해주세요.",
    form_email_verification_link_invalid:
      "이메일 인증 링크가 유효하지 않습니다.",
    // 전화번호 인증 관련
    form_phone_number_verification_code_incorrect:
      "인증 코드가 올바르지 않습니다. 다시 확인해주세요.",
    form_phone_number_verification_code_expired:
      "인증 코드가 만료되었습니다. 새로운 코드를 요청해주세요.",
  },
} as const;

/**
 * 추가 커스터마이징 예제
 *
 * 필요에 따라 특정 컴포넌트의 텍스트를 커스터마이징할 수 있습니다.
 * 예를 들어, 회원가입 페이지의 부제목을 변경하려면:
 *
 * ```ts
 * export const customKoreanLocalization = {
 *   ...koreanLocalization,
 *   signUp: {
 *     start: {
 *       subtitle: "{{applicationName}}에 가입하세요",
 *     },
 *   },
 * };
 * ```
 *
 * 전체 로컬라이제이션 키 목록은 다음을 참고하세요:
 * https://github.com/clerk/javascript/blob/main/packages/localizations/src/en-US.ts
 */

