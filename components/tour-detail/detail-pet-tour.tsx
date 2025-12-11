/**
 * @file detail-pet-tour.tsx
 * @description 반려동물 동반 여행 정보 섹션 컴포넌트
 *
 * 이 컴포넌트는 관광지의 반려동물 동반 여행 정보를 표시합니다.
 *
 * 주요 기능:
 * 1. 반려동물 동반 가능 여부 표시 (뱃지)
 * 2. 반려동물 크기 제한 정보 표시 (색상별 뱃지)
 * 3. 입장 가능 장소 정보 표시 (실내/실외 구분)
 * 4. 반려동물 동반 추가 요금 표시
 * 5. 반려동물 전용 시설 정보 표시
 * 6. 주차장 정보 표시
 * 7. 주의사항 강조 표시
 * 8. 정보 없는 항목 숨김 처리
 *
 * @dependencies
 * - lib/types/tour.ts: PetTourInfo 타입
 * - lucide-react: PawPrint, Ruler, Home, MapPin, DollarSign, Info, Car, AlertTriangle 아이콘
 *
 * @see {@link /docs/PRD.MD} - 반려동물 동반 여행 섹션 요구사항 참고
 */

import {
  PawPrint,
  Ruler,
  Home,
  MapPin,
  DollarSign,
  Info,
  Car,
  AlertTriangle,
} from "lucide-react";
import type { PetTourInfo } from "@/lib/types/tour";
import { cn } from "@/lib/utils";

interface DetailPetTourProps {
  /**
   * 반려동물 동반 정보
   */
  petInfo: PetTourInfo;
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
  chkpetleash: { label: "반려동물 동반 여부", icon: PawPrint },
  chkpetsize: { label: "반려동물 크기 제한", icon: Ruler },
  chkpetplace: { label: "입장 가능 장소", icon: Home },
  chkpetfee: { label: "추가 요금", icon: DollarSign },
  petinfo: { label: "기타 반려동물 정보", icon: Info },
  parking: { label: "주차장 정보", icon: Car },
};

/**
 * 필드 값이 유효한지 확인
 */
function hasValue(value: string | undefined | null): boolean {
  return value !== undefined && value !== null && value.trim() !== "";
}

/**
 * 반려동물 동반 가능 여부를 뱃지로 표시
 */
function PetAllowedBadge({ value }: { value: string }) {
  const isAllowed = value.includes("가능") || value.includes("예") || value.toLowerCase().includes("yes");
  const isNotAllowed = value.includes("불가능") || value.includes("불가") || value.includes("아니오") || value.toLowerCase().includes("no");

  if (isAllowed) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <PawPrint className="h-4 w-4" aria-hidden="true" />
        반려동물 동반 가능
      </span>
    );
  }

  if (isNotAllowed) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        반려동물 동반 불가능
      </span>
    );
  }

  // 기본값: 텍스트 그대로 표시
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
      <PawPrint className="h-4 w-4" aria-hidden="true" />
      {value}
    </span>
  );
}

/**
 * 반려동물 크기 제한을 색상별 뱃지로 표시
 */
function PetSizeBadge({ value }: { value: string }) {
  const isSmall = value.includes("소형") || value.includes("소");
  const isMedium = value.includes("중형") || value.includes("중");
  const isLarge = value.includes("대형") || value.includes("대");

  if (isSmall) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <Ruler className="h-4 w-4" aria-hidden="true" />
        소형견 가능
      </span>
    );
  }

  if (isMedium) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
        <Ruler className="h-4 w-4" aria-hidden="true" />
        중형견 가능
      </span>
    );
  }

  if (isLarge) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
        <Ruler className="h-4 w-4" aria-hidden="true" />
        대형견 가능
      </span>
    );
  }

  // 기본값: 텍스트 그대로 표시
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
      <Ruler className="h-4 w-4" aria-hidden="true" />
      {value}
    </span>
  );
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

  // 반려동물 동반 여부는 뱃지로 표시
  if (fieldKey === "chkpetleash") {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">
          {fieldInfo.label}
        </p>
        <PetAllowedBadge value={value} />
      </div>
    );
  }

  // 반려동물 크기 제한은 뱃지로 표시
  if (fieldKey === "chkpetsize") {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">
          {fieldInfo.label}
        </p>
        <PetSizeBadge value={value} />
      </div>
    );
  }

  // 추가 요금은 강조 표시
  if (fieldKey === "chkpetfee") {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          {fieldInfo.label}
        </p>
        <div className="flex items-start gap-2">
          <Icon className="h-4 w-4 mt-1 flex-shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <p className="text-base font-medium text-amber-600 dark:text-amber-400 whitespace-pre-line leading-relaxed">
            {value}
          </p>
        </div>
      </div>
    );
  }

  // 입장 가능 장소는 아이콘과 함께 표시
  if (fieldKey === "chkpetplace") {
    const isIndoor = value.includes("실내") || value.includes("내부");
    const isOutdoor = value.includes("실외") || value.includes("외부");
    const PlaceIcon = isIndoor ? Home : isOutdoor ? MapPin : Home;

    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          {fieldInfo.label}
        </p>
        <div className="flex items-start gap-2">
          <PlaceIcon className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-base text-foreground whitespace-pre-line leading-relaxed">
            {value}
          </p>
        </div>
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
 * 반려동물 동반 여행 정보 섹션 컴포넌트
 */
export function DetailPetTour({ petInfo, className }: DetailPetTourProps) {
  // 표시할 필드 목록 (우선순위 순서)
  const fields: string[] = [
    "chkpetleash", // 반려동물 동반 여부 (가장 중요)
    "chkpetsize", // 반려동물 크기 제한
    "chkpetplace", // 입장 가능 장소
    "chkpetfee", // 추가 요금
    "petinfo", // 기타 반려동물 정보
    "parking", // 주차장 정보
  ];

  // 표시할 필드 필터링 (값이 있는 필드만)
  const displayFields = fields.filter((field) => {
    const value = petInfo[field as keyof PetTourInfo] as string | undefined;
    return hasValue(value);
  });

  // 표시할 정보가 없는 경우
  if (displayFields.length === 0) {
    return null;
  }

  // 반려동물 동반 불가능 여부 확인
  const petAllowedValue = petInfo.chkpetleash;
  const isNotAllowed = petAllowedValue && (
    petAllowedValue.includes("불가능") ||
    petAllowedValue.includes("불가") ||
    petAllowedValue.includes("아니오") ||
    petAllowedValue.toLowerCase().includes("no")
  );

  return (
    <section
      className={cn("space-y-6 sm:space-y-8 pt-8 sm:pt-12 border-t", className)}
      aria-label="반려동물 동반 여행 정보"
    >
      {/* 섹션 제목 */}
      <div className="flex items-center gap-2">
        <PawPrint className="h-6 w-6 sm:h-7 sm:w-7 text-primary" aria-hidden="true" />
        <h2 className="text-2xl sm:text-3xl font-bold">반려동물 동반 여행 정보</h2>
      </div>

      {/* 주의사항 (반려동물 동반 불가능인 경우) */}
      {isNotAllowed && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-200 mb-1">
                반려동물 동반 불가능
              </p>
              <p className="text-sm text-red-800 dark:text-red-300">
                이 관광지는 반려동물 동반이 불가능합니다. 반려동물을 동반하지 않고 방문해주세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 반려동물 정보 필드 */}
      {displayFields.length > 0 && (
        <div className="space-y-4">
          {displayFields.map((field) => {
            const value = petInfo[field as keyof PetTourInfo] as string | undefined;
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

