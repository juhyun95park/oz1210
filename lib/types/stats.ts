/**
 * @file stats.ts
 * @description 통계 대시보드 타입 정의
 *
 * 이 파일은 통계 대시보드 페이지에서 사용하는 타입들을 정의합니다.
 *
 * 주요 타입:
 * - RegionStats: 지역별 관광지 통계
 * - TypeStats: 타입별 관광지 통계
 * - StatsSummary: 통계 요약 정보
 *
 * @see {@link /docs/PRD.MD} - 통계 대시보드 요구사항 참고
 */

/**
 * 지역별 관광지 통계
 * @see PRD 2.6.1
 */
export interface RegionStats {
  areaCode: string; // 지역코드
  name: string; // 지역명 (예: 서울, 부산, 제주)
  count: number; // 관광지 개수
}

/**
 * 타입별 관광지 통계
 * @see PRD 2.6.2
 */
export interface TypeStats {
  contentTypeId: string; // 콘텐츠타입ID (12, 14, 15, 25, 28, 32, 38, 39)
  name: string; // 타입명 (예: 관광지, 문화시설, 음식점)
  count: number; // 관광지 개수
  percentage: number; // 비율 (백분율)
}

/**
 * 통계 요약 정보
 * @see PRD 2.6.3
 */
export interface StatsSummary {
  totalCount: number; // 전체 관광지 수
  topRegions: RegionStats[]; // Top 3 지역
  topTypes: TypeStats[]; // Top 3 타입
  lastUpdated: Date; // 마지막 업데이트 시간
}

