/**
 * @file tour-api.ts
 * @description 한국관광공사 공공 API (KorService2) 클라이언트
 *
 * 이 파일은 한국관광공사 공공 API를 호출하는 함수들을 제공합니다.
 *
 * 주요 기능:
 * 1. 지역코드 조회 (getAreaCode)
 * 2. 지역 기반 목록 조회 (getAreaBasedList)
 * 3. 키워드 검색 (searchKeyword)
 * 4. 공통 정보 조회 (getDetailCommon)
 * 5. 소개 정보 조회 (getDetailIntro)
 * 6. 이미지 목록 조회 (getDetailImage)
 * 7. 반려동물 정보 조회 (getDetailPetTour)
 *
 * 핵심 구현 로직:
 * - 공통 파라미터 자동 처리 (serviceKey, MobileOS, MobileApp, _type)
 * - 재시도 로직 (최대 3회, 지수 백오프)
 * - 타임아웃 처리 (30초)
 * - 에러 처리 및 타입 안전성
 *
 * @dependencies
 * - lib/types/tour.ts: 타입 정의
 *
 * @see {@link /docs/PRD.MD} - API 명세 참고
 */

import type {
  AreaCode,
  AreaCodeParams,
  AreaBasedListParams,
  DetailIntroParams,
  TourAPIResponse,
  DetailParams,
  PetTourInfo,
  PetTourInfoResponse,
  SearchKeywordParams,
  TourDetail,
  TourDetailResponse,
  TourImage,
  TourImageResponse,
  TourIntro,
  TourIntroResponse,
  TourItem,
  TourListResponse,
} from '@/lib/types/tour';

// =====================================================
// 상수 정의
// =====================================================

const BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';
const DEFAULT_MOBILE_OS = 'ETC';
const DEFAULT_MOBILE_APP = 'MyTrip';
const DEFAULT_TYPE = 'json';
const DEFAULT_NUM_OF_ROWS = 10;
const DEFAULT_PAGE_NO = 1;
const REQUEST_TIMEOUT = 30000; // 30초
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // 지수 백오프: 1초, 2초, 4초

// =====================================================
// 에러 처리
// =====================================================

/**
 * 에러 타입 정의
 */
export enum TourAPIErrorType {
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_KEY_INVALID = 'API_KEY_INVALID',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  HTTP_ERROR = 'HTTP_ERROR',
  API_ERROR = 'API_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 한국관광공사 API 에러 클래스
 */
export class TourAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error,
    public errorType: TourAPIErrorType = TourAPIErrorType.UNKNOWN_ERROR,
  ) {
    super(message);
    this.name = 'TourAPIError';
    Object.setPrototypeOf(this, TourAPIError.prototype);
  }

  /**
   * 사용자에게 표시할 친화적인 메시지 반환
   */
  getUserMessage(): string {
    switch (this.errorType) {
      case TourAPIErrorType.API_KEY_MISSING:
      case TourAPIErrorType.API_KEY_INVALID:
        return '서비스 설정에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
      case TourAPIErrorType.NETWORK_ERROR:
        return '인터넷 연결을 확인하고 잠시 후 다시 시도해주세요.';
      case TourAPIErrorType.TIMEOUT_ERROR:
        return '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.';
      case TourAPIErrorType.HTTP_ERROR:
        if (this.statusCode === 404) {
          return '요청한 정보를 찾을 수 없습니다.';
        }
        if (this.statusCode === 429) {
          return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
        }
        if (this.statusCode && this.statusCode >= 500) {
          return '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
        return '요청 처리 중 오류가 발생했습니다.';
      case TourAPIErrorType.API_ERROR:
        return '관광지 정보를 불러오는 중 오류가 발생했습니다.';
      case TourAPIErrorType.PARSE_ERROR:
        return '데이터 처리 중 오류가 발생했습니다.';
      case TourAPIErrorType.VALIDATION_ERROR:
        return this.message; // 검증 에러는 원본 메시지 사용
      default:
        return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
  }

  /**
   * 개발자용 상세 에러 정보 로깅
   */
  logError(context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.group(`[TourAPIError] ${this.errorType}${context ? ` - ${context}` : ''}`);
      console.error('Message:', this.message);
      if (this.statusCode) {
        console.error('Status Code:', this.statusCode);
      }
      if (this.originalError) {
        console.error('Original Error:', this.originalError);
      }
      if (this.stack) {
        console.error('Stack:', this.stack);
      }
      console.groupEnd();
    }
  }
}

// =====================================================
// 공통 유틸리티 함수
// =====================================================

/**
 * 환경변수에서 API 키 가져오기
 * 우선순위: NEXT_PUBLIC_TOUR_API_KEY > TOUR_API_KEY
 */
function getServiceKey(): string {
  const serviceKey =
    process.env.NEXT_PUBLIC_TOUR_API_KEY || process.env.TOUR_API_KEY;

  if (!serviceKey) {
    const error = new TourAPIError(
      'API 키가 설정되지 않았습니다. NEXT_PUBLIC_TOUR_API_KEY 또는 TOUR_API_KEY 환경변수를 설정해주세요.',
      undefined,
      undefined,
      TourAPIErrorType.API_KEY_MISSING,
    );
    error.logError('getServiceKey');
    throw error;
  }

  return serviceKey;
}

/**
 * 공통 파라미터 생성
 */
function getCommonParams(): Record<string, string> {
  return {
    serviceKey: getServiceKey(),
    MobileOS: DEFAULT_MOBILE_OS,
    MobileApp: DEFAULT_MOBILE_APP,
    _type: DEFAULT_TYPE,
  };
}

/**
 * 쿼리 문자열 생성
 */
function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

// =====================================================
// HTTP 요청 유틸리티
// =====================================================

/**
 * 재시도 로직이 포함된 fetch 함수
 * Next.js의 fetch는 Server Component에서 자동으로 캐싱을 처리합니다.
 * @param url - 요청 URL
 * @param options - fetch 옵션
 * @param retryCount - 현재 재시도 횟수
 * @returns Promise<Response>
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryCount = 0,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    // Next.js의 fetch는 Server Component에서 자동으로 캐싱을 처리합니다.
    // fetch 호출 시 next 옵션을 전달할 수 있지만, fetchWithRetry에서는
    // 각 API 함수에서 적절한 캐싱 전략을 적용하는 것이 좋습니다.
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // HTTP 에러 상태 코드 처리
    if (!response.ok) {
      const errorType =
        response.status === 401 || response.status === 403
          ? TourAPIErrorType.API_KEY_INVALID
          : response.status === 408
            ? TourAPIErrorType.TIMEOUT_ERROR
            : TourAPIErrorType.HTTP_ERROR;

      const error = new TourAPIError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        undefined,
        errorType,
      );
      error.logError('fetchWithRetry');
      throw error;
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // AbortError는 타임아웃 에러
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = new TourAPIError(
        '요청 시간이 초과되었습니다.',
        408,
        error,
        TourAPIErrorType.TIMEOUT_ERROR,
      );
      timeoutError.logError('fetchWithRetry - timeout');
      throw timeoutError;
    }

    // 최대 재시도 횟수에 도달한 경우
    if (retryCount >= MAX_RETRIES) {
      // 네트워크 관련 에러인지 확인
      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof Error &&
          (error.message.includes('fetch') ||
            error.message.includes('network') ||
            error.message.includes('Network')));

      const errorType = isNetworkError
        ? TourAPIErrorType.NETWORK_ERROR
        : TourAPIErrorType.UNKNOWN_ERROR;

      const maxRetryError = new TourAPIError(
        `요청 실패 (${retryCount + 1}회 시도): ${error instanceof Error ? error.message : '알 수 없는 에러'}`,
        undefined,
        error instanceof Error ? error : new Error(String(error)),
        errorType,
      );
      maxRetryError.logError(`fetchWithRetry - max retries (${retryCount + 1})`);
      throw maxRetryError;
    }

    // 재시도 대기 (지수 백오프)
    const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
    await new Promise((resolve) => setTimeout(resolve, delay));

    // 재시도
    return fetchWithRetry(url, options, retryCount + 1);
  }
}

/**
 * API 응답 파싱 및 검증
 */
function parseAPIResponse<T>(response: TourAPIResponse<T> | any): T | T[] {
  const { response: apiResponse } = response;

  // API 에러 응답 확인
  if (apiResponse.header.resultCode !== '0000') {
    const resultCode = apiResponse.header.resultCode;
    const resultMsg = apiResponse.header.resultMsg || '알 수 없는 에러';

    // API 키 관련 에러 코드 확인 (일반적인 에러 코드)
    const isApiKeyError =
      resultCode === 'SERVICE_KEY_IS_NOT_REGISTERED' ||
      resultCode === 'SERVICE_KEY_IS_NOT_VALID' ||
      resultCode === 'SERVICE_KEY_IS_NULL';

    const errorType = isApiKeyError
      ? TourAPIErrorType.API_KEY_INVALID
      : TourAPIErrorType.API_ERROR;

    const error = new TourAPIError(
      `API 에러: ${resultMsg} (코드: ${resultCode})`,
      undefined,
      undefined,
      errorType,
    );
    error.logError('parseAPIResponse');
    throw error;
  }

  // 응답 데이터 확인
  if (!apiResponse.body?.items?.item) {
    return [] as T[];
  }

  const item = apiResponse.body.items.item;

  // 배열인 경우 그대로 반환, 단일 객체인 경우 배열로 변환
  return Array.isArray(item) ? item : [item];
}

// =====================================================
// API 함수 구현
// =====================================================

/**
 * 지역코드 조회
 * @param params - 지역코드 조회 파라미터 (선택)
 * @returns 지역코드 목록
 */
export async function getAreaCode(
  params: AreaCodeParams = {},
): Promise<AreaCode[]> {
  const queryParams = {
    ...getCommonParams(),
    numOfRows: params.numOfRows || DEFAULT_NUM_OF_ROWS,
    pageNo: params.pageNo || DEFAULT_PAGE_NO,
  };

  const url = `${BASE_URL}/areaCode2?${buildQueryString(queryParams)}`;

  try {
    const response = await fetchWithRetry(url);
    const data = await response.json();
    const items = parseAPIResponse<AreaCode>(data);

    return Array.isArray(items) ? items : [];
  } catch (error) {
    if (error instanceof TourAPIError) {
      throw error;
    }
    throw new TourAPIError(
      '지역코드 조회 중 에러가 발생했습니다.',
      undefined,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * 지역 기반 목록 조회
 * @param params - 지역 기반 목록 조회 파라미터
 * @returns 관광지 목록 및 총 개수
 * @note Next.js의 fetch는 Server Component에서 자동으로 캐싱을 처리합니다.
 *       관광지 목록은 자주 변경되지 않으므로 1시간 캐싱을 권장합니다.
 */
export async function getAreaBasedList(
  params: AreaBasedListParams = {},
): Promise<TourListResponse> {
  const queryParams = {
    ...getCommonParams(),
    areaCode: params.areaCode,
    contentTypeId: params.contentTypeId,
    numOfRows: params.numOfRows || DEFAULT_NUM_OF_ROWS,
    pageNo: params.pageNo || DEFAULT_PAGE_NO,
  };

  const url = `${BASE_URL}/areaBasedList2?${buildQueryString(queryParams)}`;

  try {
    // Next.js의 fetch는 Server Component에서 자동으로 캐싱을 처리합니다.
    // fetchWithRetry를 사용하더라도, fetch 호출 시 next 옵션을 전달할 수 없으므로
    // 각 API 함수에서 적절한 캐싱 전략을 적용하는 것이 좋습니다.
    // 관광지 목록은 자주 변경되지 않으므로 1시간 캐싱을 권장합니다.
    const response = await fetchWithRetry(url);
    const data: TourAPIResponse<TourItem> = await response.json();

    const items = parseAPIResponse<TourItem>(data);
    const tourItems = Array.isArray(items) ? items : [];

    return {
      items: tourItems,
      totalCount: data.response.body?.totalCount || 0,
      numOfRows: data.response.body?.numOfRows || DEFAULT_NUM_OF_ROWS,
      pageNo: data.response.body?.pageNo || DEFAULT_PAGE_NO,
    };
  } catch (error) {
    if (error instanceof TourAPIError) {
      throw error;
    }
    throw new TourAPIError(
      '지역 기반 목록 조회 중 에러가 발생했습니다.',
      undefined,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * 키워드 검색
 * @param params - 키워드 검색 파라미터
 * @returns 검색 결과 목록 및 총 개수
 */
export async function searchKeyword(
  params: SearchKeywordParams,
): Promise<TourListResponse> {
  if (!params.keyword || params.keyword.trim() === '') {
    const error = new TourAPIError(
      '검색 키워드는 필수입니다.',
      undefined,
      undefined,
      TourAPIErrorType.VALIDATION_ERROR,
    );
    error.logError('searchKeyword');
    throw error;
  }

  const queryParams = {
    ...getCommonParams(),
    keyword: params.keyword.trim(),
    areaCode: params.areaCode,
    contentTypeId: params.contentTypeId,
    numOfRows: params.numOfRows || DEFAULT_NUM_OF_ROWS,
    pageNo: params.pageNo || DEFAULT_PAGE_NO,
  };

  const url = `${BASE_URL}/searchKeyword2?${buildQueryString(queryParams)}`;

  try {
    const response = await fetchWithRetry(url);
    const data: TourAPIResponse<TourItem> = await response.json();

    const items = parseAPIResponse<TourItem>(data);
    const tourItems = Array.isArray(items) ? items : [];

    return {
      items: tourItems,
      totalCount: data.response.body?.totalCount || 0,
      numOfRows: data.response.body?.numOfRows || DEFAULT_NUM_OF_ROWS,
      pageNo: data.response.body?.pageNo || DEFAULT_PAGE_NO,
    };
  } catch (error) {
    if (error instanceof TourAPIError) {
      throw error;
    }
    throw new TourAPIError(
      '키워드 검색 중 에러가 발생했습니다.',
      undefined,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * 공통 정보 조회
 * @param params - 상세 정보 조회 파라미터
 * @returns 관광지 상세 정보
 */
export async function getDetailCommon(
  params: DetailParams,
): Promise<TourDetailResponse> {
  if (!params.contentId || params.contentId.trim() === '') {
    const error = new TourAPIError(
      '콘텐츠 ID는 필수입니다.',
      undefined,
      undefined,
      TourAPIErrorType.VALIDATION_ERROR,
    );
    error.logError('getDetailCommon');
    throw error;
  }

  const queryParams = {
    ...getCommonParams(),
    contentId: params.contentId.trim(),
  };

  const url = `${BASE_URL}/detailCommon2?${buildQueryString(queryParams)}`;

  try {
    const response = await fetchWithRetry(url);
    const data: TourAPIResponse<TourDetail> = await response.json();

    const items = parseAPIResponse<TourDetail>(data);
    const detail = Array.isArray(items) ? items[0] : items;

    if (!detail) {
      throw new TourAPIError('상세 정보를 찾을 수 없습니다.');
    }

    return { item: detail };
  } catch (error) {
    if (error instanceof TourAPIError) {
      throw error;
    }
    throw new TourAPIError(
      '공통 정보 조회 중 에러가 발생했습니다.',
      undefined,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * 소개 정보 조회
 * @param params - 소개 정보 조회 파라미터
 * @returns 관광지 운영 정보
 */
export async function getDetailIntro(
  params: DetailIntroParams,
): Promise<TourIntroResponse> {
  if (!params.contentId || params.contentId.trim() === '') {
    const error = new TourAPIError(
      '콘텐츠 ID는 필수입니다.',
      undefined,
      undefined,
      TourAPIErrorType.VALIDATION_ERROR,
    );
    error.logError('getDetailIntro');
    throw error;
  }

  if (!params.contentTypeId || params.contentTypeId.trim() === '') {
    const error = new TourAPIError(
      '콘텐츠 타입 ID는 필수입니다.',
      undefined,
      undefined,
      TourAPIErrorType.VALIDATION_ERROR,
    );
    error.logError('getDetailIntro');
    throw error;
  }

  const queryParams = {
    ...getCommonParams(),
    contentId: params.contentId.trim(),
    contentTypeId: params.contentTypeId.trim(),
  };

  const url = `${BASE_URL}/detailIntro2?${buildQueryString(queryParams)}`;

  try {
    const response = await fetchWithRetry(url);
    const data: TourAPIResponse<TourIntro> = await response.json();

    const items = parseAPIResponse<TourIntro>(data);
    const intro = Array.isArray(items) ? items[0] : items;

    if (!intro) {
      throw new TourAPIError('소개 정보를 찾을 수 없습니다.');
    }

    return { item: intro };
  } catch (error) {
    if (error instanceof TourAPIError) {
      throw error;
    }
    throw new TourAPIError(
      '소개 정보 조회 중 에러가 발생했습니다.',
      undefined,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * 이미지 목록 조회
 * @param params - 이미지 목록 조회 파라미터
 * @returns 이미지 목록 및 총 개수
 */
export async function getDetailImage(
  params: DetailParams & { numOfRows?: number; pageNo?: number },
): Promise<TourImageResponse> {
  if (!params.contentId || params.contentId.trim() === '') {
    const error = new TourAPIError(
      '콘텐츠 ID는 필수입니다.',
      undefined,
      undefined,
      TourAPIErrorType.VALIDATION_ERROR,
    );
    error.logError('getDetailImage');
    throw error;
  }

  const queryParams = {
    ...getCommonParams(),
    contentId: params.contentId.trim(),
    numOfRows: params.numOfRows || DEFAULT_NUM_OF_ROWS,
    pageNo: params.pageNo || DEFAULT_PAGE_NO,
  };

  const url = `${BASE_URL}/detailImage2?${buildQueryString(queryParams)}`;

  try {
    const response = await fetchWithRetry(url);
    const data: TourAPIResponse<TourImage> = await response.json();

    const items = parseAPIResponse<TourImage>(data);
    const images = Array.isArray(items) ? items : [];

    return {
      items: images,
      totalCount: data.response.body?.totalCount || 0,
    };
  } catch (error) {
    if (error instanceof TourAPIError) {
      throw error;
    }
    throw new TourAPIError(
      '이미지 목록 조회 중 에러가 발생했습니다.',
      undefined,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * 반려동물 정보 조회
 * @param params - 반려동물 정보 조회 파라미터
 * @returns 반려동물 동반 정보
 */
export async function getDetailPetTour(
  params: DetailParams,
): Promise<PetTourInfoResponse> {
  if (!params.contentId || params.contentId.trim() === '') {
    const error = new TourAPIError(
      '콘텐츠 ID는 필수입니다.',
      undefined,
      undefined,
      TourAPIErrorType.VALIDATION_ERROR,
    );
    error.logError('getDetailPetTour');
    throw error;
  }

  const queryParams = {
    ...getCommonParams(),
    contentId: params.contentId.trim(),
  };

  const url = `${BASE_URL}/detailPetTour2?${buildQueryString(queryParams)}`;

  try {
    const response = await fetchWithRetry(url);
    const data: TourAPIResponse<PetTourInfo> = await response.json();

    const items = parseAPIResponse<PetTourInfo>(data);
    const petInfo = Array.isArray(items) ? items[0] : items;

    if (!petInfo) {
      throw new TourAPIError('반려동물 정보를 찾을 수 없습니다.');
    }

    return { item: petInfo };
  } catch (error) {
    if (error instanceof TourAPIError) {
      throw error;
    }
    throw new TourAPIError(
      '반려동물 정보 조회 중 에러가 발생했습니다.',
      undefined,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

