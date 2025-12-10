/**
 * @file tour.ts
 * @description 한국관광공사 공공 API (KorService2) 타입 정의
 *
 * 이 파일은 한국관광공사 API의 요청/응답 타입을 정의합니다.
 *
 * 주요 타입:
 * - TourItem: 관광지 목록 항목
 * - TourDetail: 관광지 상세 정보
 * - TourIntro: 관광지 운영 정보
 * - TourImage: 관광지 이미지 정보
 * - PetTourInfo: 반려동물 동반 정보
 *
 * @see {@link /docs/PRD.MD} - API 명세 및 데이터 구조 참고
 */

// =====================================================
// Content Type ID 상수
// =====================================================

export const CONTENT_TYPE = {
  TOURIST_SPOT: '12', // 관광지
  CULTURAL_FACILITY: '14', // 문화시설
  FESTIVAL: '15', // 축제/행사
  TOUR_COURSE: '25', // 여행코스
  LEISURE_SPORTS: '28', // 레포츠
  ACCOMMODATION: '32', // 숙박
  SHOPPING: '38', // 쇼핑
  RESTAURANT: '39', // 음식점
} as const;

export type ContentTypeId = (typeof CONTENT_TYPE)[keyof typeof CONTENT_TYPE];

// =====================================================
// 기본 타입 인터페이스
// =====================================================

/**
 * 관광지 목록 항목 (areaBasedList2, searchKeyword2 응답)
 * @see PRD 5.1
 */
export interface TourItem {
  addr1: string; // 주소
  addr2?: string; // 상세주소
  areacode: string; // 지역코드
  contentid: string; // 콘텐츠ID
  contenttypeid: string; // 콘텐츠타입ID
  title: string; // 제목
  mapx: string; // 경도 (KATEC 좌표계, 정수형)
  mapy: string; // 위도 (KATEC 좌표계, 정수형)
  firstimage?: string; // 대표이미지1
  firstimage2?: string; // 대표이미지2
  tel?: string; // 전화번호
  cat1?: string; // 대분류
  cat2?: string; // 중분류
  cat3?: string; // 소분류
  modifiedtime: string; // 수정일
}

/**
 * 관광지 상세 정보 (detailCommon2 응답)
 * @see PRD 5.2
 */
export interface TourDetail {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1: string;
  addr2?: string;
  zipcode?: string;
  tel?: string;
  homepage?: string;
  overview?: string; // 개요 (긴 설명)
  firstimage?: string;
  firstimage2?: string;
  mapx: string; // 경도 (KATEC 좌표계)
  mapy: string; // 위도 (KATEC 좌표계)
}

/**
 * 관광지 운영 정보 (detailIntro2 응답)
 * @see PRD 5.3
 * 타입별로 필드가 다를 수 있음
 */
export interface TourIntro {
  contentid: string;
  contenttypeid: string;
  // 공통 필드
  usetime?: string; // 이용시간
  restdate?: string; // 휴무일
  infocenter?: string; // 문의처
  parking?: string; // 주차 가능
  chkpet?: string; // 반려동물 동반
  // 관광지(12) 필드
  expguide?: string; // 체험안내
  expagerange?: string; // 체험가능연령
  // 문화시설(14) 필드
  usefee?: string; // 이용요금
  usetimeculture?: string; // 관람시간
  restdateculture?: string; // 휴관일
  // 축제/행사(15) 필드
  playtime?: string; // 공연시간
  eventplace?: string; // 행사장소
  eventhomepage?: string; // 행사홈페이지
  // 레포츠(28) 필드
  openperiod?: string; // 개장기간
  reservation?: string; // 예약안내
  // 숙박(32) 필드
  checkintime?: string; // 체크인
  checkouttime?: string; // 체크아웃
  roomcount?: string; // 객실수
  // 음식점(39) 필드
  firstmenu?: string; // 대표메뉴
  treatmenu?: string; // 취급메뉴
  opentimefood?: string; // 영업시간
}

/**
 * 관광지 이미지 정보 (detailImage2 응답)
 */
export interface TourImage {
  contentid: string;
  originimgurl: string; // 원본 이미지 URL
  smallimageurl: string; // 썸네일 이미지 URL
  imgname?: string; // 이미지명
  serialnum?: string; // 일련번호
}

/**
 * 반려동물 동반 정보 (detailPetTour2 응답)
 * @see PRD 2.5
 */
export interface PetTourInfo {
  contentid: string;
  contenttypeid: string;
  chkpetleash?: string; // 애완동물 동반 여부
  chkpetsize?: string; // 애완동물 크기
  chkpetplace?: string; // 입장 가능 장소
  chkpetfee?: string; // 추가 요금
  petinfo?: string; // 기타 반려동물 정보
  parking?: string; // 주차장 정보
}

/**
 * 지역코드 정보 (areaCode2 응답)
 */
export interface AreaCode {
  code: string; // 지역코드
  name: string; // 지역명
  rnum?: string; // 순번
}

// =====================================================
// API 응답 래퍼 타입
// =====================================================

/**
 * 한국관광공사 API 공통 응답 구조
 */
export interface TourAPIResponse<T> {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items?: {
        item: T | T[];
      };
      numOfRows?: number;
      pageNo?: number;
      totalCount?: number;
    };
  };
}

/**
 * 지역코드 조회 응답
 */
export type AreaCodeResponse = TourAPIResponse<AreaCode>;

/**
 * 관광지 목록 응답
 */
export interface TourListResponse {
  items: TourItem[];
  totalCount: number;
  numOfRows: number;
  pageNo: number;
}

/**
 * 검색 결과 응답 (TourListResponse와 동일)
 */
export type TourSearchResponse = TourListResponse;

/**
 * 상세 정보 응답
 */
export interface TourDetailResponse {
  item: TourDetail;
}

/**
 * 운영 정보 응답
 */
export interface TourIntroResponse {
  item: TourIntro;
}

/**
 * 이미지 목록 응답
 */
export interface TourImageResponse {
  items: TourImage[];
  totalCount: number;
}

/**
 * 반려동물 정보 응답
 */
export interface PetTourInfoResponse {
  item: PetTourInfo;
}

// =====================================================
// API 파라미터 타입
// =====================================================

/**
 * 지역코드 조회 파라미터
 */
export interface AreaCodeParams {
  numOfRows?: number; // 페이지당 결과 수 (기본값: 10)
  pageNo?: number; // 페이지 번호 (기본값: 1)
}

/**
 * 지역 기반 목록 조회 파라미터
 */
export interface AreaBasedListParams {
  areaCode?: string; // 지역코드 (선택)
  contentTypeId?: string; // 콘텐츠타입ID (선택)
  numOfRows?: number; // 페이지당 결과 수 (기본값: 10)
  pageNo?: number; // 페이지 번호 (기본값: 1)
}

/**
 * 키워드 검색 파라미터
 */
export interface SearchKeywordParams {
  keyword: string; // 검색 키워드 (필수)
  areaCode?: string; // 지역코드 (선택)
  contentTypeId?: string; // 콘텐츠타입ID (선택)
  numOfRows?: number; // 페이지당 결과 수 (기본값: 10)
  pageNo?: number; // 페이지 번호 (기본값: 1)
}

/**
 * 상세 정보 조회 파라미터
 */
export interface DetailParams {
  contentId: string; // 콘텐츠ID (필수)
}

/**
 * 소개 정보 조회 파라미터
 */
export interface DetailIntroParams extends DetailParams {
  contentTypeId: string; // 콘텐츠타입ID (필수)
}

