/**
 * @file toast-provider.tsx
 * @description 토스트 알림 Provider
 *
 * 이 Provider는 전역 토스트 알림 상태를 관리합니다.
 *
 * @dependencies
 * - components/ui/toast: ToastContainer, Toast 타입
 */

"use client";

import * as React from "react";
import { ToastContainer, type Toast } from "@/components/ui/toast";

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = React.useCallback(
    (message: string, title?: string) => {
      addToast({ type: "success", message, title });
    },
    [addToast]
  );

  const error = React.useCallback(
    (message: string, title?: string) => {
      addToast({ type: "error", message, title });
    },
    [addToast]
  );

  const info = React.useCallback(
    (message: string, title?: string) => {
      addToast({ type: "info", message, title });
    },
    [addToast]
  );

  const warning = React.useCallback(
    (message: string, title?: string) => {
      addToast({ type: "warning", message, title });
    },
    [addToast]
  );

  const value = React.useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      success,
      error,
      info,
      warning,
    }),
    [toasts, addToast, removeToast, success, error, info, warning]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

