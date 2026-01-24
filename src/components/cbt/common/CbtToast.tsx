"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import styles from "./CbtToast.module.css";

export type CbtToastVariant = "success" | "error" | "info";

type ToastState = {
  message: string;
  variant: CbtToastVariant;
} | null;

type ToastContextValue = {
  pushToast: (message: string, variant?: CbtToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useCbtToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useCbtToast must be used within CbtToastProvider");
  }
  return context;
}

export function CbtToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);

  const pushToast = useCallback((message: string, variant: CbtToastVariant = "info") => {
    setToast({ message, variant });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 2400);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div className={styles.toastArea} role="status" aria-live="polite">
          <div className={`${styles.toast} ${styles[toast.variant]}`}>
            {toast.message}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
