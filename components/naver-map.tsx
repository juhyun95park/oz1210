/**
 * @file naver-map.tsx
 * @description 네이버 지도 컴포넌트
 *
 * 이 컴포넌트는 관광지 목록을 네이버 지도에 마커로 표시합니다.
 *
 * 주요 기능:
 * 1. Naver Maps API v3 (NCP) 초기화
 * 2. 관광지 마커 표시
 * 3. 좌표 변환 (KATEC → WGS84)
 * 4. 마커 클릭 시 인포윈도우
 * 5. 지도-리스트 연동
 * 6. 지도 컨트롤
 *
 * @dependencies
 * - Naver Maps JavaScript API v3 (NCP)
 * - lib/types/tour.ts: TourItem 타입
 *
 * @see {@link /docs/PRD.MD} - 네이버 지도 연동 요구사항 참고
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Map, Satellite, Navigation } from "lucide-react";
import type { TourItem } from "@/lib/types/tour";
import { CONTENT_TYPE } from "@/lib/types/tour";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";
import { useTourHoverSafe } from "@/components/providers/tour-hover-provider";

interface NaverMapProps {
  /**
   * 관광지 목록
   */
  tours: TourItem[];
  /**
   * 선택된 관광지 ID (리스트에서 클릭한 항목)
   */
  selectedTourId?: string;
  /**
   * 호버된 관광지 ID (리스트에서 호버한 항목)
   */
  hoveredTourId?: string;
  /**
   * 관광지 클릭 핸들러
   */
  onTourClick?: (tour: TourItem) => void;
  /**
   * 지역 코드 (선택된 지역의 중심 좌표를 초기 중심으로 사용)
   */
  areaCode?: string;
  /**
   * 추가 클래스명
   */
  className?: string;
}

/**
 * KATEC 좌표를 WGS84로 변환
 * 한국관광공사 API의 mapx, mapy는 KATEC 좌표계 정수형입니다.
 * 예: mapx = "1271234567" (경도), mapy = "371234567" (위도)
 * 이를 WGS84로 변환하려면 10000000으로 나눕니다.
 *
 * @param mapx KATEC 경도 (문자열 또는 숫자)
 * @param mapy KATEC 위도 (문자열 또는 숫자)
 * @returns WGS84 좌표 {lng, lat}
 */
function convertKATECToWGS84(
  mapx: string | number | undefined | null,
  mapy: string | number | undefined | null,
): { lng: number; lat: number } {
  // undefined, null, 빈 문자열 체크
  if (mapx == null || mapy == null || mapx === "" || mapy === "") {
    console.error("❌ 좌표 변환 실패: 좌표 값이 없음", {
      mapx: String(mapx),
      mapy: String(mapy),
      mapxType: typeof mapx,
      mapyType: typeof mapy,
    });
    // 기본값: 서울 좌표
    return { lng: 126.978, lat: 37.5665 };
  }

  const x = typeof mapx === "string" ? parseFloat(mapx) : mapx;
  const y = typeof mapy === "string" ? parseFloat(mapy) : mapy;

  // NaN 체크
  if (isNaN(x) || isNaN(y)) {
    console.error("❌ 좌표 변환 실패: NaN 값", {
      mapx: String(mapx),
      mapy: String(mapy),
      x: String(x),
      y: String(y),
      mapxType: typeof mapx,
      mapyType: typeof mapy,
    });
    // 기본값: 서울 좌표
    return { lng: 126.978, lat: 37.5665 };
  }

  // 한국관광공사 API의 KATEC 좌표는 항상 10000000으로 나눠야 합니다.
  // 한국 좌표 범위: 경도 124~132, 위도 33~43
  const KOREA_LNG_MIN = 124;
  const KOREA_LNG_MAX = 132;
  const KOREA_LAT_MIN = 33;
  const KOREA_LAT_MAX = 43;

  // 먼저 KATEC 좌표로 변환 시도
  const convertedLng = x / 10000000;
  const convertedLat = y / 10000000;

  // 변환된 값이 한국 범위 내인지 확인
  const isConvertedInKoreaRange =
    convertedLng >= KOREA_LNG_MIN &&
    convertedLng <= KOREA_LNG_MAX &&
    convertedLat >= KOREA_LAT_MIN &&
    convertedLat <= KOREA_LAT_MAX;

  // 원본 값이 한국 범위 내인지 확인 (이미 WGS84일 가능성)
  const isOriginalInKoreaRange =
    x >= KOREA_LNG_MIN &&
    x <= KOREA_LNG_MAX &&
    y >= KOREA_LAT_MIN &&
    y <= KOREA_LAT_MAX;

  // 변환된 값이 한국 범위 내이면 변환된 값 사용
  if (isConvertedInKoreaRange) {
    return {
      lng: convertedLng,
      lat: convertedLat,
    };
  }

  // 원본 값이 한국 범위 내이면 원본 값 사용 (이미 WGS84)
  if (isOriginalInKoreaRange) {
    // 개발 환경에서만 디버그 로그 출력 (첫 번째 작은 값 케이스만)
    if (process.env.NODE_ENV === "development") {
      const hasLoggedSmall = (window as any).__hasLoggedSmallCoords;
      if (!hasLoggedSmall) {
        console.log(
          "📍 좌표 값이 작습니다. 이미 WGS84일 수 있습니다 (이 메시지는 한 번만 표시됩니다):",
          {
            x,
            y,
            mapx: String(mapx),
            mapy: String(mapy),
          },
        );
        (window as any).__hasLoggedSmallCoords = true;
      }
    }
    return {
      lng: x,
      lat: y,
    };
  }

  // 둘 다 한국 범위를 벗어나면 기본값 사용
  console.error("❌ 좌표 변환 실패: 한국 범위를 벗어난 값", {
    mapx: String(mapx),
    mapy: String(mapy),
    x,
    y,
    convertedLng,
    convertedLat,
    isConvertedInKoreaRange,
    isOriginalInKoreaRange,
  });
  return { lng: 126.978, lat: 37.5665 };
}

/**
 * 관광 타입별 마커 색상 매핑
 * PRD 요구사항: 관광 타입별로 구분 (선택 사항)
 */
const MARKER_COLOR_BY_TYPE: Record<string, string> = {
  [CONTENT_TYPE.TOURIST_SPOT]: "#ef4444", // 관광지: 빨간색
  [CONTENT_TYPE.CULTURAL_FACILITY]: "#8b5cf6", // 문화시설: 보라색
  [CONTENT_TYPE.FESTIVAL]: "#f59e0b", // 축제/행사: 주황색
  [CONTENT_TYPE.TOUR_COURSE]: "#10b981", // 여행코스: 초록색
  [CONTENT_TYPE.LEISURE_SPORTS]: "#06b6d4", // 레포츠: 청록색
  [CONTENT_TYPE.ACCOMMODATION]: "#6366f1", // 숙박: 인디고색
  [CONTENT_TYPE.SHOPPING]: "#ec4899", // 쇼핑: 핑크색
  [CONTENT_TYPE.RESTAURANT]: "#f97316", // 음식점: 오렌지색
};

/**
 * 지역별 중심 좌표 매핑
 * PRD 요구사항: 선택된 지역의 중심 좌표를 초기 중심으로 사용
 * 한국관광공사 API areaCode 기준
 */
const REGION_CENTER_COORDS: Record<string, { lat: number; lng: number }> = {
  "1": { lat: 37.5665, lng: 126.978 }, // 서울
  "2": { lat: 35.1796, lng: 129.0756 }, // 인천
  "3": { lat: 35.5384, lng: 129.3114 }, // 대전
  "4": { lat: 35.1595, lng: 126.8526 }, // 대구
  "5": { lat: 35.1796, lng: 129.0756 }, // 광주
  "6": { lat: 35.5384, lng: 129.3114 }, // 부산
  "7": { lat: 36.8003, lng: 127.0748 }, // 울산
  "8": { lat: 37.4563, lng: 126.7052 }, // 세종
  "31": { lat: 37.4138, lng: 127.5183 }, // 경기
  "32": { lat: 37.4563, lng: 126.7052 }, // 강원
  "33": { lat: 36.8003, lng: 127.0748 }, // 충북
  "34": { lat: 36.5184, lng: 126.8 }, // 충남
  "35": { lat: 35.5384, lng: 129.3114 }, // 전북
  "36": { lat: 35.1796, lng: 126.8526 }, // 전남
  "37": { lat: 36.8003, lng: 127.0748 }, // 경북
  "38": { lat: 35.1796, lng: 129.0756 }, // 경남
  "39": { lat: 33.4996, lng: 126.5312 }, // 제주
};

/**
 * 네이버 지도 컴포넌트
 */
export function NaverMap({
  tours,
  selectedTourId,
  hoveredTourId: propHoveredTourId,
  onTourClick,
  areaCode,
  className,
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowsRef = useRef<any[]>([]);
  const currentLocationMarkerRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapTypeId, setMapTypeId] = useState<"normal" | "satellite">("normal");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const toast = useToast();

  // Context에서 호버 상태 가져오기 (있는 경우)
  // useTourHoverSafe는 Context가 없어도 에러를 던지지 않으므로
  // 항상 안전하게 호출할 수 있습니다.
  const hoverContext = useTourHoverSafe();
  const contextHoveredTourId = hoverContext?.hoveredTourId;

  // prop 또는 context에서 호버 상태 가져오기
  const hoveredTourId = propHoveredTourId ?? contextHoveredTourId;

  // 네이버 지도 API 로드
  useEffect(() => {
    const scriptId = "naver-maps-script";

    // 이미 로드된 경우 스킵
    if (document.getElementById(scriptId)) {
      if (window.naver && window.naver.maps) {
        console.log("✅ 네이버 지도 API 이미 로드됨");
        setIsMapLoaded(true);
      }
      return;
    }

    const ncpKeyId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    console.log("🔍 환경 변수 확인:", {
      hasKey: !!ncpKeyId,
      keyLength: ncpKeyId?.length || 0,
      keyPreview: ncpKeyId ? `${ncpKeyId.substring(0, 10)}...` : "없음",
    });

    if (!ncpKeyId) {
      console.error(
        "❌ NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수가 설정되지 않았습니다.",
      );
      console.error("💡 해결 방법:");
      console.error("   1. .env.local 파일을 프로젝트 루트에 생성하세요.");
      console.error(
        "   2. NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id 추가",
      );
      console.error("   3. 개발 서버를 재시작하세요 (pnpm dev)");
      setMapError(
        "네이버 지도 API 키가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID를 설정해주세요.",
      );
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${ncpKeyId}`;
    script.async = true;

    console.log(
      "📥 네이버 지도 API 스크립트 로드 시작:",
      script.src.replace(ncpKeyId, "***"),
    );

    script.onload = () => {
      console.log("📦 스크립트 로드 완료, window.naver 확인:", {
        hasWindow: typeof window !== "undefined",
        hasNaver: !!window.naver,
        hasMaps: !!window.naver?.maps,
      });

      if (window.naver && window.naver.maps) {
        console.log("✅ 네이버 지도 API 로드 성공");
        setIsMapLoaded(true);
      } else {
        console.error("❌ 네이버 지도 API 객체를 찾을 수 없습니다.");
        console.error("💡 가능한 원인:");
        console.error("   1. API 키가 유효하지 않습니다.");
        console.error(
          "   2. 네이버 클라우드 플랫폼에서 API가 활성화되지 않았습니다.",
        );
        console.error(
          "   3. API 키의 도메인 설정이 올바르지 않습니다 (localhost 포함 필요).",
        );
        setMapError(
          "네이버 지도 API를 로드할 수 없습니다. API 키와 도메인 설정을 확인해주세요.",
        );
      }
    };

    script.onerror = (error) => {
      console.error("❌ 네이버 지도 API 스크립트 로드 실패:", error);
      console.error("💡 가능한 원인:");
      console.error("   1. API 키가 유효하지 않습니다.");
      console.error("   2. 네트워크 연결 문제입니다.");
      console.error(
        "   3. 네이버 클라우드 플랫폼에서 API가 활성화되지 않았습니다.",
      );
      setMapError(
        "네이버 지도 API 스크립트를 로드하는 중 오류가 발생했습니다. API 키와 네트워크 연결을 확인해주세요.",
      );
    };

    document.head.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거하지 않음 (다른 컴포넌트에서 사용 가능)
    };
  }, []);

  // 지도 초기화
  useEffect(() => {
    console.log("🗺️ 지도 초기화 시도:", {
      isMapLoaded,
      hasMapRef: !!mapRef.current,
      hasNaverMaps: !!window.naver?.maps,
      toursCount: tours.length,
    });

    // 초기화 조건 체크
    if (!isMapLoaded) {
      // API가 아직 로드되지 않은 경우 (정상적인 로딩 상태)
      return;
    }

    if (!mapRef.current) {
      // API는 로드되었지만 DOM이 아직 마운트되지 않은 경우
      console.log(
        "⏳ 지도 컨테이너 DOM이 아직 준비되지 않았습니다. 잠시 후 다시 시도합니다.",
      );
      return;
    }

    if (!window.naver?.maps) {
      // API는 로드되었다고 표시되었지만 실제로는 사용할 수 없는 경우
      // 이는 실제 문제일 수 있으므로 경고 출력
      console.warn(
        "⚠️ 지도 API가 로드되었다고 표시되었지만 window.naver.maps를 사용할 수 없습니다.",
      );
      return;
    }

    try {
      console.log("🗺️ 지도 초기화 시작, 관광지 개수:", tours.length);

      // 초기 중심 좌표 결정 (우선순위: 선택된 지역 > 첫 번째 관광지 > 서울)
      let center: any;

      // 1. 선택된 지역의 중심 좌표 사용
      if (areaCode && REGION_CENTER_COORDS[areaCode]) {
        const regionCenter = REGION_CENTER_COORDS[areaCode];
        center = new window.naver.maps.LatLng(
          regionCenter.lat,
          regionCenter.lng,
        );
        console.log("선택된 지역 중심 좌표로 설정:", areaCode, regionCenter);
      }
      // 2. 관광지가 있으면 첫 번째 유효한 관광지 위치를 중심으로 설정
      else if (tours.length > 0) {
        // 유효한 좌표를 가진 첫 번째 관광지 찾기
        const firstValidTour = tours.find(
          (tour) =>
            tour.mapx && tour.mapy && tour.mapx !== "" && tour.mapy !== "",
        );

        if (firstValidTour) {
          const coords = convertKATECToWGS84(
            firstValidTour.mapx,
            firstValidTour.mapy,
          );
          center = new window.naver.maps.LatLng(coords.lat, coords.lng);
        } else {
          // 유효한 좌표를 가진 관광지가 없으면 기본값 사용
          center = new window.naver.maps.LatLng(37.5665, 126.978);
          console.log(
            "유효한 좌표를 가진 관광지가 없어 기본 중심 좌표 사용 (서울)",
          );
        }
      }
      // 3. 기본값: 서울
      else {
        center = new window.naver.maps.LatLng(37.5665, 126.978);
        console.log("기본 중심 좌표 사용 (서울)");
      }

      // 지도 생성
      const map = new window.naver.maps.Map(mapRef.current, {
        center,
        zoom: tours.length > 0 ? 12 : 10,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
        },
        mapTypeId: window.naver.maps.MapTypeId.NORMAL,
      });

      mapInstanceRef.current = map;
      console.log("지도 초기화 완료");
    } catch (error) {
      console.error("지도 초기화 실패:", error);
      setMapError(
        `지도를 초기화할 수 없습니다: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }, [isMapLoaded, tours]);

  // 마커 표시
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !window.naver?.maps) return;

    const map = mapInstanceRef.current;

    // 기존 마커 및 인포윈도우 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    infoWindowsRef.current.forEach((infoWindow) => infoWindow.close());
    markersRef.current = [];
    infoWindowsRef.current = [];

    // 새 마커 생성
    tours.forEach((tour) => {
      try {
        // 좌표 유효성 검사
        if (!tour.mapx || !tour.mapy || tour.mapx === "" || tour.mapy === "") {
          console.warn(
            `⚠️ 관광지 좌표가 없어 마커를 생성하지 않습니다: ${tour.title} (${tour.contentid})`,
          );
          return;
        }

        const coords = convertKATECToWGS84(tour.mapx, tour.mapy);

        const position = new window.naver.maps.LatLng(coords.lat, coords.lng);

        // 마커 색상 결정 (우선순위: 선택 > 호버 > 타입별 > 기본)
        let markerColor = MARKER_COLOR_BY_TYPE[tour.contenttypeid] || "#ef4444"; // 타입별 색상 또는 기본 빨간색
        if (selectedTourId === tour.contentid) {
          markerColor = "#3b82f6"; // 선택: 파란색
        } else if (hoveredTourId === tour.contentid) {
          markerColor = "#eab308"; // 호버: 노란색
        }

        // 마커 생성
        const marker = new window.naver.maps.Marker({
          position,
          map,
          title: tour.title,
          icon: {
            content: `
              <div style="
                background-color: ${markerColor};
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                transition: background-color 0.2s ease;
              "></div>
            `,
            anchor: new window.naver.maps.Point(12, 12),
          },
        });

        // 간단한 설명 생성 (카테고리 정보 활용)
        const description =
          [tour.cat1, tour.cat2, tour.cat3].filter(Boolean).join(" · ") ||
          tour.addr1 ||
          "";

        // 인포윈도우 생성
        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="
              padding: 12px;
              min-width: 200px;
              max-width: 300px;
            ">
              <h3 style="
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 8px;
                line-height: 1.4;
              ">${tour.title}</h3>
              ${
                description && description !== tour.addr1
                  ? `
              <p style="
                font-size: 12px;
                color: #666;
                margin-bottom: 8px;
                line-height: 1.4;
              ">${description}</p>
              `
                  : ""
              }
              <p style="
                font-size: 12px;
                color: #666;
                margin-bottom: 12px;
                line-height: 1.4;
              ">${tour.addr1 || ""}</p>
              <a href="/places/${tour.contentid}" style="
                display: inline-block;
                padding: 6px 12px;
                background-color: #3b82f6;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
              ">상세보기</a>
            </div>
          `,
        });

        // 마커 클릭 이벤트
        window.naver.maps.Event.addListener(marker, "click", () => {
          // 다른 인포윈도우 닫기
          infoWindowsRef.current.forEach((iw) => iw.close());

          // 현재 인포윈도우 열기
          infoWindow.open(map, marker);

          // 리스트 연동
          if (onTourClick) {
            onTourClick(tour);
          }
        });

        markersRef.current.push(marker);
        infoWindowsRef.current.push(infoWindow);

        // 선택된 관광지인 경우 인포윈도우 자동 열기
        if (selectedTourId === tour.contentid) {
          infoWindow.open(map, marker);
          map.setCenter(position);
          map.setZoom(15);
        }
      } catch (error) {
        console.error(`마커 생성 실패 (${tour.contentid}):`, error);
      }
    });

    // 관광지가 있으면 지도 범위 조정
    if (tours.length > 0) {
      const bounds = new window.naver.maps.LatLngBounds();
      let hasValidBounds = false;

      tours.forEach((tour) => {
        try {
          // 좌표 유효성 검사
          if (
            !tour.mapx ||
            !tour.mapy ||
            tour.mapx === "" ||
            tour.mapy === ""
          ) {
            return; // 좌표가 없으면 건너뛰기
          }

          const coords = convertKATECToWGS84(tour.mapx, tour.mapy);
          bounds.extend(new window.naver.maps.LatLng(coords.lat, coords.lng));
          hasValidBounds = true;
        } catch (error) {
          console.error(`좌표 변환 실패 (${tour.contentid}):`, error);
        }
      });

      if (hasValidBounds) {
        map.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [isMapLoaded, tours, selectedTourId, hoveredTourId, onTourClick]);

  // 지도 유형 변경
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !window.naver?.maps) return;

    const map = mapInstanceRef.current;
    const targetMapTypeId =
      mapTypeId === "satellite"
        ? window.naver.maps.MapTypeId.SATELLITE
        : window.naver.maps.MapTypeId.NORMAL;

    try {
      map.setMapTypeId(targetMapTypeId);
    } catch (error) {
      console.error("지도 유형 변경 실패:", error);
    }
  }, [isMapLoaded, mapTypeId]);

  // 지도 유형 토글 핸들러
  const handleMapTypeToggle = () => {
    setMapTypeId((prev) => (prev === "normal" ? "satellite" : "normal"));
  };

  // 현재 위치 가져오기 핸들러
  const handleGetCurrentLocation = () => {
    if (!isMapLoaded || !mapInstanceRef.current || !window.naver?.maps) {
      toast.error(
        "지도가 아직 로드되지 않았습니다.",
        "지도를 불러올 수 없습니다",
      );
      return;
    }

    if (!navigator.geolocation) {
      toast.error(
        "이 브라우저는 위치 정보 기능을 지원하지 않습니다.",
        "위치 정보를 사용할 수 없습니다",
      );
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGettingLocation(false);
        const map = mapInstanceRef.current;
        const { latitude, longitude } = position.coords;
        const location = new window.naver.maps.LatLng(latitude, longitude);

        // 지도 중심 이동
        map.setCenter(location);
        map.setZoom(15);

        // 기존 현재 위치 마커 제거
        if (currentLocationMarkerRef.current) {
          currentLocationMarkerRef.current.setMap(null);
        }

        // 현재 위치 마커 생성 (초록색)
        const marker = new window.naver.maps.Marker({
          position: location,
          map,
          icon: {
            content: `
              <div style="
                background-color: #22c55e;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  width: 12px;
                  height: 12px;
                  background-color: white;
                  border-radius: 50%;
                "></div>
              </div>
            `,
            anchor: new window.naver.maps.Point(16, 16),
          },
          title: "현재 위치",
        });

        currentLocationMarkerRef.current = marker;

        toast.success(
          "지도가 현재 위치로 이동했습니다.",
          "현재 위치로 이동했습니다",
        );
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "위치 정보를 가져올 수 없습니다.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "위치 정보 사용 권한이 거부되었습니다.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "위치 정보를 사용할 수 없습니다.";
            break;
          case error.TIMEOUT:
            errorMessage = "위치 정보 요청 시간이 초과되었습니다.";
            break;
        }

        toast.error(errorMessage, "위치 정보 오류");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  if (mapError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-[400px] sm:h-[600px] bg-muted rounded-lg",
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">{mapError}</p>
      </div>
    );
  }

  if (!isMapLoaded) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-[400px] sm:h-[600px] bg-muted rounded-lg",
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">지도를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full h-[400px] sm:h-[600px] rounded-lg overflow-hidden",
        className,
      )}
    >
      <div ref={mapRef} className="w-full h-full" aria-label="네이버 지도" />
      {/* 지도 컨트롤 버튼 그룹 */}
      <div
        className="absolute top-2 right-2 flex flex-col gap-2 z-10"
        role="group"
        aria-label="지도 컨트롤"
      >
        {/* 지도 유형 선택 버튼 */}
        <button
          type="button"
          onClick={handleMapTypeToggle}
          className={cn(
            "w-10 h-10 sm:w-11 sm:h-11",
            "flex items-center justify-center",
            "bg-background/90 backdrop-blur-sm",
            "border border-border rounded-lg",
            "shadow-md",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "transition-colors duration-200",
            "text-foreground",
          )}
          aria-label={
            mapTypeId === "normal" ? "스카이뷰로 전환" : "일반 지도로 전환"
          }
          title={
            mapTypeId === "normal" ? "스카이뷰로 전환" : "일반 지도로 전환"
          }
        >
          {mapTypeId === "normal" ? (
            <Satellite className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Map className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
        {/* 현재 위치 버튼 */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation}
          className={cn(
            "w-10 h-10 sm:w-11 sm:h-11",
            "flex items-center justify-center",
            "bg-background/90 backdrop-blur-sm",
            "border border-border rounded-lg",
            "shadow-md",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "transition-colors duration-200",
            "text-foreground",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
          aria-label="현재 위치로 이동"
          title="현재 위치로 이동"
        >
          {isGettingLocation ? (
            <div
              className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Navigation className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

// 네이버 지도 타입 선언
declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (element: HTMLElement, options: any) => any;
        LatLng: new (lat: number, lng: number) => any;
        LatLngBounds: new () => any;
        Marker: new (options: any) => any;
        InfoWindow: new (options: any) => any;
        Point: new (x: number, y: number) => any;
        Position: {
          TOP_RIGHT: any;
        };
        MapTypeId: {
          NORMAL: any;
          SATELLITE: any;
        };
        Event: {
          addListener: (
            target: any,
            event: string,
            handler: () => void,
          ) => void;
        };
      };
    };
  }
}
