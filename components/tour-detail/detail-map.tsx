/**
 * @file detail-map.tsx
 * @description 관광지 상세페이지 지도 컴포넌트
 *
 * 이 컴포넌트는 관광지 상세페이지에 해당 관광지의 위치를 네이버 지도로 표시합니다.
 *
 * 주요 기능:
 * 1. Naver Maps API v3 (NCP) 초기화
 * 2. 단일 관광지 마커 표시
 * 3. 좌표 변환 (KATEC → WGS84)
 * 4. 길찾기 버튼 (네이버 지도 앱/웹 연동)
 * 5. 좌표 정보 표시
 *
 * @dependencies
 * - Naver Maps JavaScript API v3 (NCP)
 * - lib/types/tour.ts: TourDetail 타입
 * - components/ui/button.tsx: Button 컴포넌트
 * - lucide-react: Navigation, Copy, Check 아이콘
 * - components/providers/toast-provider.tsx: useToast hook
 *
 * @see {@link /docs/PRD.MD} - 지도 섹션 요구사항 참고
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import type { TourDetail } from "@/lib/types/tour";
import { cn } from "@/lib/utils";

interface DetailMapProps {
  /**
   * 관광지 상세 정보
   */
  detail: TourDetail;
  /**
   * 추가 클래스명
   */
  className?: string;
}

/**
 * KATEC 좌표를 WGS84로 변환
 * @param mapx KATEC 경도 (정수형)
 * @param mapy KATEC 위도 (정수형)
 * @returns WGS84 좌표 {lng, lat}
 */
function convertKATECToWGS84(
  mapx: string | number,
  mapy: string | number
): { lng: number; lat: number } {
  const x = typeof mapx === "string" ? parseFloat(mapx) : mapx;
  const y = typeof mapy === "string" ? parseFloat(mapy) : mapy;

  // KATEC 좌표를 10000000으로 나누어 변환
  return {
    lng: x / 10000000,
    lat: y / 10000000,
  };
}

/**
 * 관광지 상세페이지 지도 컴포넌트
 */
export function DetailMap({ detail, className }: DetailMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  // 좌표 변환
  const coords = convertKATECToWGS84(detail.mapx, detail.mapy);

  // 네이버 지도 API 로드
  useEffect(() => {
    const scriptId = "naver-maps-script";

    // 이미 로드된 경우 스킵
    if (document.getElementById(scriptId)) {
      if (window.naver && window.naver.maps) {
        setIsMapLoaded(true);
      }
      return;
    }

    const ncpKeyId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    if (!ncpKeyId) {
      setMapError("네이버 지도 API 키가 설정되지 않았습니다.");
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${ncpKeyId}`;
    script.async = true;
    script.onload = () => {
      if (window.naver && window.naver.maps) {
        setIsMapLoaded(true);
      } else {
        setMapError("네이버 지도 API를 로드할 수 없습니다.");
      }
    };
    script.onerror = () => {
      setMapError("네이버 지도 API 스크립트를 로드하는 중 오류가 발생했습니다.");
    };

    document.head.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거하지 않음 (다른 컴포넌트에서 사용 가능)
    };
  }, []);

  // 지도 초기화 및 마커 표시
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !window.naver?.maps) return;

    try {
      const position = new window.naver.maps.LatLng(coords.lat, coords.lng);

      // 지도 생성
      const map = new window.naver.maps.Map(mapRef.current, {
        center: position,
        zoom: 15,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
        },
      });

      mapInstanceRef.current = map;

      // 기존 마커 및 인포윈도우 제거
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }

      // 마커 생성
      const marker = new window.naver.maps.Marker({
        position,
        map,
        title: detail.title,
        icon: {
          content: `
            <div style="
              background-color: #3b82f6;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>
          `,
          anchor: new window.naver.maps.Point(16, 16),
        },
      });

      markerRef.current = marker;

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
            ">${detail.title}</h3>
            <p style="
              font-size: 12px;
              color: #666;
              margin-bottom: 12px;
              line-height: 1.4;
            ">${detail.addr1 || ""}</p>
          </div>
        `,
      });

      infoWindowRef.current = infoWindow;

      // 마커 클릭 시 인포윈도우 열기
      window.naver.maps.Event.addListener(marker, "click", () => {
        infoWindow.open(map, marker);
      });

      // 마커 클릭 시 인포윈도우 자동 열기
      infoWindow.open(map, marker);
    } catch (error) {
      console.error("지도 초기화 실패:", error);
      setMapError("지도를 초기화할 수 없습니다.");
    }
  }, [isMapLoaded, coords.lat, coords.lng, detail.title, detail.addr1]);

  // 좌표 복사 기능
  const handleCopyCoordinates = async () => {
    const coordinatesText = `위도: ${coords.lat.toFixed(6)}, 경도: ${coords.lng.toFixed(6)}`;

    try {
      // HTTPS 환경 확인
      if (typeof window !== "undefined" && window.isSecureContext) {
        await navigator.clipboard.writeText(coordinatesText);
        setCopied(true);
        success("좌표가 복사되었습니다.");
        setTimeout(() => setCopied(false), 2000);
      } else {
        // HTTPS가 아닌 경우 fallback
        const textArea = document.createElement("textarea");
        textArea.value = coordinatesText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        success("좌표가 복사되었습니다.");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("좌표 복사 실패:", error);
    }
  };

  // 길찾기 URL 생성
  const directionsUrl = `https://map.naver.com/v5/directions/${coords.lng},${coords.lat}`;

  if (mapError) {
    return (
      <section
        className={cn("space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t", className)}
        aria-label="지도"
      >
        <h2 className="text-2xl sm:text-3xl font-bold">위치</h2>
        <div className="flex items-center justify-center h-64 sm:h-96 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">{mapError}</p>
        </div>
      </section>
    );
  }

  if (!isMapLoaded) {
    return (
      <section
        className={cn("space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t", className)}
        aria-label="지도"
      >
        <h2 className="text-2xl sm:text-3xl font-bold">위치</h2>
        <div className="flex items-center justify-center h-64 sm:h-96 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">지도를 불러오는 중...</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn("space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t", className)}
      aria-label="지도"
    >
      <h2 className="text-2xl sm:text-3xl font-bold">위치</h2>

      {/* 지도 컨테이너 */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-64 sm:h-96 rounded-lg overflow-hidden"
          aria-label="네이버 지도"
        />

        {/* 길찾기 버튼 (지도 위 오버레이) */}
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            asChild
            size="sm"
            className="min-h-[44px] shadow-lg"
            aria-label="길찾기"
          >
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              <span>길찾기</span>
            </a>
          </Button>
        </div>
      </div>

      {/* 좌표 정보 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-4 bg-muted rounded-lg">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            좌표
          </p>
          <p className="text-sm">
            위도: {coords.lat.toFixed(6)}, 경도: {coords.lng.toFixed(6)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyCoordinates}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCopyCoordinates();
            }
          }}
          className="min-h-[44px] min-w-[44px] sm:min-w-[100px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="좌표 복사"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">복사됨</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">복사</span>
            </>
          )}
        </Button>
      </div>
    </section>
  );
}

// 네이버 지도 타입 선언
declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (element: HTMLElement, options: any) => any;
        LatLng: new (lat: number, lng: number) => any;
        Marker: new (options: any) => any;
        InfoWindow: new (options: any) => any;
        Point: new (x: number, y: number) => any;
        Position: {
          TOP_RIGHT: any;
        };
        Event: {
          addListener: (target: any, event: string, handler: () => void) => void;
        };
      };
    };
  }
}

