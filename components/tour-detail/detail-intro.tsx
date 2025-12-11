/**
 * @file detail-intro.tsx
 * @description 관광지 운영 정보 섹션 컴포넌트
 *
 * 이 컴포넌트는 관광지의 운영 정보를 표시합니다.
 *
 * 주요 기능:
 * 1. 운영시간/개장시간 표시
 * 2. 휴무일 표시
 * 3. 이용요금 표시
 * 4. 주차 가능 여부 표시
 * 5. 수용인원 표시
 * 6. 체험 프로그램 표시
 * 7. 유모차/반려동물 동반 가능 여부 표시
 * 8. 타입별 특화 정보 표시
 * 9. 정보 없는 항목 숨김 처리
 *
 * @dependencies
 * - lib/types/tour.ts: TourIntro 타입, CONTENT_TYPE 상수
 * - lucide-react: Clock, Calendar, DollarSign, Car, Users, Baby, Phone, ExternalLink 아이콘
 *
 * @see {@link /docs/PRD.MD} - 운영 정보 섹션 요구사항 참고
 */

import {
  Clock,
  Calendar,
  DollarSign,
  Car,
  Baby,
  Phone,
  ExternalLink,
  Users,
  Activity,
  CalendarX,
  MapPin,
  Home,
  CalendarCheck,
  Bed,
  UtensilsCrossed,
} from "lucide-react";
import { CONTENT_TYPE } from "@/lib/types/tour";
import type { TourIntro } from "@/lib/types/tour";
import { cn } from "@/lib/utils";

interface DetailIntroProps {
  /**
   * 관광지 운영 정보
   */
  intro: TourIntro;
  /**
   * 추가 클래스명
   */
  className?: string;
}

/**
 * 필드 라벨 매핑
 */
interface FieldLabel {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const fieldLabels: Record<string, FieldLabel> = {
  // 공통 필드
  usetime: { label: "운영시간", icon: Clock },
  restdate: { label: "휴무일", icon: CalendarX },
  infocenter: { label: "문의처", icon: Phone },
  parking: { label: "주차 가능 여부", icon: Car },
  chkpet: { label: "반려동물 동반 가능 여부", icon: Baby },
  // 관광지(12) 필드
  expguide: { label: "체험안내", icon: Activity },
  expagerange: { label: "체험가능연령", icon: Users },
  // 문화시설(14) 필드
  usefee: { label: "이용요금", icon: DollarSign },
  usetimeculture: { label: "관람시간", icon: Clock },
  restdateculture: { label: "휴관일", icon: CalendarX },
  // 축제/행사(15) 필드
  playtime: { label: "공연시간", icon: Clock },
  eventplace: { label: "행사장소", icon: MapPin },
  eventhomepage: { label: "행사홈페이지", icon: ExternalLink },
  // 레포츠(28) 필드
  openperiod: { label: "개장기간", icon: CalendarCheck },
  reservation: { label: "예약안내", icon: Phone },
  // 숙박(32) 필드
  checkintime: { label: "체크인", icon: Clock },
  checkouttime: { label: "체크아웃", icon: Clock },
  roomcount: { label: "객실수", icon: Bed },
  // 음식점(39) 필드
  firstmenu: { label: "대표메뉴", icon: UtensilsCrossed },
  treatmenu: { label: "취급메뉴", icon: UtensilsCrossed },
  opentimefood: { label: "영업시간", icon: Clock },
};

/**
 * 타입별 표시할 필드 목록
 */
function getTypeSpecificFields(contentTypeId: string): string[] {
  switch (contentTypeId) {
    case CONTENT_TYPE.TOURIST_SPOT: // 관광지(12)
      return ["expguide", "expagerange"];
    case CONTENT_TYPE.CULTURAL_FACILITY: // 문화시설(14)
      return ["usefee", "usetimeculture", "restdateculture"];
    case CONTENT_TYPE.FESTIVAL: // 축제/행사(15)
      return ["playtime", "eventplace", "eventhomepage"];
    case CONTENT_TYPE.LEISURE_SPORTS: // 레포츠(28)
      return ["openperiod", "reservation"];
    case CONTENT_TYPE.ACCOMMODATION: // 숙박(32)
      return ["checkintime", "checkouttime", "roomcount"];
    case CONTENT_TYPE.RESTAURANT: // 음식점(39)
      return ["firstmenu", "treatmenu", "opentimefood"];
    default:
      return [];
  }
}

/**
 * 필드 값이 유효한지 확인
 */
function hasValue(value: string | undefined | null): boolean {
  return value !== undefined && value !== null && value.trim() !== "";
}

/**
 * 정보 항목 컴포넌트
 */
function InfoItem({
  fieldKey,
  value,
}: {
  fieldKey: string;
  value: string;
}) {
  const fieldInfo = fieldLabels[fieldKey];
  if (!fieldInfo) return null;

  const Icon = fieldInfo.icon;
  const isExternalLink = fieldKey === "eventhomepage";

  // 외부 링크인 경우
  if (isExternalLink) {
    const url = value.startsWith("http") ? value : `https://${value}`;
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          {fieldInfo.label}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-base hover:text-primary transition-colors break-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md px-2 py-1"
          aria-label={`${fieldInfo.label} 열기 (새 창)`}
        >
          <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="break-all">{value}</span>
        </a>
      </div>
    );
  }

  // 일반 텍스트인 경우
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-1">
        {fieldInfo.label}
      </p>
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-base text-foreground whitespace-pre-line leading-relaxed">
          {value}
        </p>
      </div>
    </div>
  );
}

/**
 * 관광지 운영 정보 섹션 컴포넌트
 */
export function DetailIntro({ intro, className }: DetailIntroProps) {
  // 공통 필드 목록
  const commonFields: string[] = [
    "usetime",
    "restdate",
    "infocenter",
    "parking",
    "chkpet",
  ];

  // 타입별 필드 목록
  const typeSpecificFields = getTypeSpecificFields(intro.contenttypeid);

  // 표시할 필드 필터링 (값이 있는 필드만)
  const displayCommonFields = commonFields.filter((field) => {
    const value = intro[field as keyof TourIntro] as string | undefined;
    return hasValue(value);
  });

  const displayTypeFields = typeSpecificFields.filter((field) => {
    const value = intro[field as keyof TourIntro] as string | undefined;
    return hasValue(value);
  });

  // 표시할 정보가 없는 경우
  if (displayCommonFields.length === 0 && displayTypeFields.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t", className)}
      aria-label="운영 정보"
    >
      {/* 섹션 제목 */}
      <h2 className="text-2xl sm:text-3xl font-bold">운영 정보</h2>

      {/* 공통 필드 */}
      {displayCommonFields.length > 0 && (
        <div className="space-y-4">
          {displayCommonFields.map((field) => {
            const value = intro[field as keyof TourIntro] as string | undefined;
            if (!hasValue(value)) return null;
            return (
              <InfoItem key={field} fieldKey={field} value={value!} />
            );
          })}
        </div>
      )}

      {/* 타입별 필드 */}
      {displayTypeFields.length > 0 && (
        <div className="space-y-4">
          {displayTypeFields.map((field) => {
            const value = intro[field as keyof TourIntro] as string | undefined;
            if (!hasValue(value)) return null;
            return (
              <InfoItem key={field} fieldKey={field} value={value!} />
            );
          })}
        </div>
      )}
    </section>
  );
}

