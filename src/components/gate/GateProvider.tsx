"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type GateStatus = {
  update: {
    ready: boolean;
    blocking: boolean;
    failed: boolean;
  };
  terms: {
    ready: boolean;
    blocking: boolean;
  };
  notice: {
    ready: boolean;
    open: boolean;
  };
};

type GateContextValue = {
  status: GateStatus;
  blocker: "update" | "updateNotice" | "terms" | "notice" | null;
  canShowOnboarding: boolean;
  setUpdateStatus: (next: Partial<GateStatus["update"]>) => void;
  setTermsStatus: (next: Partial<GateStatus["terms"]>) => void;
  setNoticeStatus: (next: Partial<GateStatus["notice"]>) => void;
  setNoticeState: (next: GateStatus["notice"]) => void;
};

const initialStatus: GateStatus = {
  update: { ready: false, blocking: false, failed: false },
  terms: { ready: false, blocking: false },
  notice: { ready: false, open: false },
};

const GateContext = createContext<GateContextValue | null>(null);

export function GateProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>(initialStatus);

  const setUpdateStatus = useCallback((next: Partial<GateStatus["update"]>) => {
    setStatus((prev) => ({
      ...prev,
      update: { ...prev.update, ...next },
    }));
  }, []);

  const setTermsStatus = useCallback((next: Partial<GateStatus["terms"]>) => {
    setStatus((prev) => ({
      ...prev,
      terms: { ...prev.terms, ...next },
    }));
  }, []);

  const setNoticeStatus = useCallback((next: Partial<GateStatus["notice"]>) => {
    setStatus((prev) => ({
      ...prev,
      notice: { ...prev.notice, ...next },
    }));
  }, []);

  const setNoticeState = useCallback((next: GateStatus["notice"]) => {
    setStatus((prev) => ({
      ...prev,
      notice: next,
    }));
  }, []);

  const blocker = useMemo<GateContextValue["blocker"]>(() => {
    if (status.update.blocking) return "update";
    if (status.update.failed) return "updateNotice";
    if (status.terms.blocking) return "terms";
    if (status.notice.open) return "notice";
    return null;
  }, [
    status.notice.open,
    status.terms.blocking,
    status.update.blocking,
    status.update.failed,
  ]);

  const canShowOnboarding = useMemo(() => {
    return (
      status.update.ready &&
      status.terms.ready &&
      status.notice.ready &&
      blocker === null
    );
  }, [
    status.update.ready,
    status.terms.ready,
    status.notice.ready,
    blocker,
  ]);

  const value = useMemo(
    () => ({
      status,
      blocker,
      canShowOnboarding,
      setUpdateStatus,
      setTermsStatus,
      setNoticeStatus,
      setNoticeState,
    }),
    [
      status,
      blocker,
      canShowOnboarding,
      setUpdateStatus,
      setTermsStatus,
      setNoticeStatus,
      setNoticeState,
    ],
  );

  return <GateContext.Provider value={value}>{children}</GateContext.Provider>;
}

export function useGate() {
  const ctx = useContext(GateContext);
  if (!ctx) {
    throw new Error("useGate must be used within GateProvider");
  }
  return ctx;
}
