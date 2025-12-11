/**
 * @file stats-api.ts
 * @description 통계 데이터 수집 API
 *
 * 이 파일은 한국관광공사 API를 활용하여 지역별/타입별 관광지 통계 데이터를 수집하는 함수들을 제공합니다.
 *
 * 주요 기능:
 * 1. 지역별 관광지 통계 수집 (getRegionStats)
 * 2. 타입별 관광지 통계 수집 (getTypeStats)
 * 3. 통계 요약 정보 생성 (getStatsSummary)
 *
 * 핵심 구현 로직:
 * - getAreaBasedList() API의 totalCount 활용
 * - Promise.allSettled()로 병렬 처리 및 부분 실패 허용
 * - TourAPIError 클래스로 에러 처리
 *
 * @dependencies
 * - lib/api/tour-api.ts: getAreaCode, getAreaBasedList, TourAPIError
 * - lib/types/tour.ts: CONTENT_TYPE 상수
 * - lib/types/stats.ts: RegionStats, TypeStats, StatsSummary
 *
 * @see {@link /docs/PRD.MD} - 통계 대시보드 요구사항 참고
 */

import { getAreaCode, getAreaBasedList, TourAPIError } from './tour-api';
import { CONTENT_TYPE } from '@/lib/types/tour';
import type { RegionStats, TypeStats, StatsSummary } from '@/lib/types/stats';

// =====================================================
// 타입명 매핑 객체
// =====================================================

/**
 * 콘텐츠 타입 ID와 한글 타입명 매핑
 */
const TYPE_NAME_MAP: Record<string, string> = {
  [CONTENT_TYPE.TOURIST_SPOT]: '관광지',
  [CONTENT_TYPE.CULTURAL_FACILITY]: '문화시설',
  [CONTENT_TYPE.FESTIVAL]: '축제/행사',
  [CONTENT_TYPE.TOUR_COURSE]: '여행코스',
  [CONTENT_TYPE.LEISURE_SPORTS]: '레포츠',
  [CONTENT_TYPE.ACCOMMODATION]: '숙박',
  [CONTENT_TYPE.SHOPPING]: '쇼핑',
  [CONTENT_TYPE.RESTAURANT]: '음식점',
} as const;

// =====================================================
// 지역별 통계 수집
// =====================================================

/**
 * 지역별 관광지 통계 수집
 * @returns 지역별 관광지 통계 배열
 * @throws {TourAPIError} API 호출 실패 시
 */
export async function getRegionStats(): Promise<RegionStats[]> {
  try {
    // 1. 모든 지역 코드 조회 (numOfRows를 크게 설정하여 한 번에 조회)
    const areaCodes = await getAreaCode({ numOfRows: 100, pageNo: 1 });

    if (areaCodes.length === 0) {
      console.warn('[getRegionStats] 지역 코드를 조회할 수 없습니다.');
      return [];
    }

    // 2. 각 지역별로 totalCount 조회 (병렬 처리)
    const statsPromises = areaCodes.map(async (areaCode) => {
      try {
        const response = await getAreaBasedList({
          areaCode: areaCode.code,
          numOfRows: 1, // totalCount만 필요하므로 최소한의 데이터만 요청
          pageNo: 1,
        });

        return {
          areaCode: areaCode.code,
          name: areaCode.name,
          count: response.totalCount,
        } as RegionStats;
      } catch (error) {
        // 부분 실패 허용: 실패한 지역은 로그만 남기고 제외
        console.error(
          `[getRegionStats] 지역 ${areaCode.name} (${areaCode.code}) 통계 수집 실패:`,
          error instanceof Error ? error.message : String(error),
        );
        return null;
      }
    });

    // 3. Promise.allSettled()로 병렬 처리 및 부분 실패 허용
    const results = await Promise.allSettled(statsPromises);

    // 4. 성공한 결과만 필터링
    const regionStats: RegionStats[] = results
      .filter(
        (result): result is PromiseFulfilledResult<RegionStats | null> =>
          result.status === 'fulfilled' && result.value !== null,
      )
      .map((result) => result.value)
      .filter((stat): stat is RegionStats => stat !== null);

    return regionStats;
  } catch (error) {
    if (error instanceof TourAPIError) {
      throw error;
    }
    throw new TourAPIError(
      '지역별 통계 수집 중 에러가 발생했습니다.',
      undefined,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

// =====================================================
// 타입별 통계 수집
// =====================================================

/**
 * 타입별 관광지 통계 수집
 * @returns 타입별 관광지 통계 배열 (비율 포함)
 * @throws {TourAPIError} API 호출 실패 시
 */
export async function getTypeStats(): Promise<TypeStats[]> {
  try {
    // 1. 모든 콘텐츠 타입 ID 추출
    const contentTypeIds = Object.values(CONTENT_TYPE);

    // 2. 각 타입별로 totalCount 조회 (병렬 처리)
    const statsPromises = contentTypeIds.map(async (contentTypeId) => {
      try {
        const response = await getAreaBasedList({
          contentTypeId,
          numOfRows: 1, // totalCount만 필요하므로 최소한의 데이터만 요청
          pageNo: 1,
        });

        return {
          contentTypeId,
          name: TYPE_NAME_MAP[contentTypeId] || `타입 ${contentTypeId}`,
          count: response.totalCount,
          percentage: 0, // 나중에 계산
        } as TypeStats;
      } catch (error) {
        // 부분 실패 허용: 실패한 타입은 로그만 남기고 제외
        console.error(
          `[getTypeStats] 타입 ${contentTypeId} 통계 수집 실패:`,
          error instanceof Error ? error.message : String(error),
        );
        return null;
      }
    });

    // 3. Promise.allSettled()로 병렬 처리 및 부분 실패 허용
    const results = await Promise.allSettled(statsPromises);

    // 4. 성공한 결과만 필터링
    const typeStats: TypeStats[] = results
      .filter(
        (result): result is PromiseFulfilledResult<TypeStats | null> =>
          result.status === 'fulfilled' && result.value !== null,
      )
      .map((result) => result.value)
      .filter((stat): stat is TypeStats => stat !== null);

    // 5. 전체 개수 계산 및 비율 계산
    const totalCount = typeStats.reduce((sum, stat) => sum + stat.count, 0);

    if (totalCount === 0) {
      console.warn('[getTypeStats] 전체 관광지 수가 0입니다.');
      return typeStats;
    }

    // 각 타입별 비율 계산 (백분율)
    return typeStats.map((stat) => ({
      ...stat,
      percentage: Number(((stat.count / totalCount) * 100).toFixed(2)),
    }));
  } catch (error) {
    if (error instanceof TourAPIError) {
      throw error;
    }
    throw new TourAPIError(
      '타입별 통계 수집 중 에러가 발생했습니다.',
      undefined,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

// =====================================================
// 통계 요약
// =====================================================

/**
 * 통계 요약 정보 생성
 * @returns 통계 요약 정보 (전체 개수, Top 3 지역, Top 3 타입, 마지막 업데이트 시간)
 * @throws {TourAPIError} API 호출 실패 시
 */
export async function getStatsSummary(): Promise<StatsSummary> {
  try {
    // 1. 지역별 통계와 타입별 통계를 병렬로 수집
    const [regionStats, typeStats] = await Promise.all([
      getRegionStats(),
      getTypeStats(),
    ]);

    // 2. 전체 관광지 수 계산 (모든 타입의 count 합계)
    const totalCount = typeStats.reduce((sum, stat) => sum + stat.count, 0);

    // 3. Top 3 지역 추출 (count 기준 내림차순 정렬)
    const topRegions = [...regionStats]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // 4. Top 3 타입 추출 (count 기준 내림차순 정렬)
    const topTypes = [...typeStats]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // 5. 마지막 업데이트 시간 설정
    const lastUpdated = new Date();

    return {
      totalCount,
      topRegions,
      topTypes,
      lastUpdated,
    };
  } catch (error) {
    if (error instanceof TourAPIError) {
      throw error;
    }
    throw new TourAPIError(
      '통계 요약 정보 생성 중 에러가 발생했습니다.',
      undefined,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

