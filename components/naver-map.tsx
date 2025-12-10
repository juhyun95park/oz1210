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
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { TourItem } from "@/lib/types/tour";
import { cn } from "@/lib/utils";

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
   * 관광지 클릭 핸들러
   */
  onTourClick?: (tour: TourItem) => void;
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
 * 네이버 지도 컴포넌트
 */
export function NaverMap({
  tours,
  selectedTourId,
  onTourClick,
  className,
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const infoWindowsRef = useRef<naver.maps.InfoWindow[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

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

  // 지도 초기화
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !window.naver?.maps) return;

    try {
      // 초기 중심 좌표 (서울)
      const defaultCenter = new window.naver.maps.LatLng(37.5665, 126.978);

      // 관광지가 있으면 첫 번째 관광지 위치를 중심으로 설정
      let center = defaultCenter;
      if (tours.length > 0) {
        const firstTour = tours[0];
        const coords = convertKATECToWGS84(firstTour.mapx, firstTour.mapy);
        center = new window.naver.maps.LatLng(coords.lat, coords.lng);
      }

      // 지도 생성
      const map = new window.naver.maps.Map(mapRef.current, {
        center,
        zoom: tours.length > 0 ? 12 : 10,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
        },
      });

      mapInstanceRef.current = map;
    } catch (error) {
      console.error("지도 초기화 실패:", error);
      setMapError("지도를 초기화할 수 없습니다.");
    }
  }, [isMapLoaded, tours.length]);

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
        const coords = convertKATECToWGS84(tour.mapx, tour.mapy);
        const position = new window.naver.maps.LatLng(coords.lat, coords.lng);

        // 마커 생성
        const marker = new window.naver.maps.Marker({
          position,
          map,
          title: tour.title,
          icon: {
            content: `
              <div style="
                background-color: ${selectedTourId === tour.contentid ? "#3b82f6" : "#ef4444"};
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              "></div>
            `,
            anchor: new window.naver.maps.Point(12, 12),
          },
        });

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
  }, [isMapLoaded, tours, selectedTourId, onTourClick]);

  if (mapError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-64 sm:h-96 bg-muted rounded-lg",
          className
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
          "flex items-center justify-center h-64 sm:h-96 bg-muted rounded-lg",
          className
        )}
      >
        <p className="text-sm text-muted-foreground">지도를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={cn("w-full h-64 sm:h-96 rounded-lg overflow-hidden", className)}
      aria-label="네이버 지도"
    />
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
        Event: {
          addListener: (target: any, event: string, handler: () => void) => void;
        };
      };
    };
  }
}

