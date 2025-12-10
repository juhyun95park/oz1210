/**
 * @file toast.tsx
 * @description 토스트 알림 컴포넌트
 *
 * 이 컴포넌트는 사용자에게 알림 메시지를 표시합니다.
 *
 * 주요 기능:
 * - 성공/에러/정보/경고 메시지 표시
 * - 자동 사라짐 (기본 3초)
 * - 수동 닫기 가능
 *
 * @dependencies
 * - lucide-react: CheckCircle2, XCircle, Info, AlertTriangle, X 아이콘
 * - components/ui/button: Button 컴포넌트
 */

"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const toastStyles = {
  success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
  error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
  info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
};

const iconStyles = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
  warning: "text-yellow-600 dark:text-yellow-400",
};

export function ToastComponent({ toast, onClose }: ToastProps) {
  const Icon = toastIcons[toast.type];

  React.useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 shadow-lg",
        toastStyles[toast.type]
      )}
      role="alert"
    >
      <Icon className={cn("h-5 w-5 shrink-0", iconStyles[toast.type])} />
      <div className="flex-1 space-y-1">
        {toast.title && (
          <p className="font-semibold">{toast.title}</p>
        )}
        <p className="text-sm">{toast.message}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 shrink-0 p-0"
        onClick={() => onClose(toast.id)}
        aria-label="닫기"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[420px]"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

