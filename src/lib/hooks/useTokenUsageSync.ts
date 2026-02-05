"use client";

import { useCallback, useEffect, useRef } from "react";
import { fetchTokenUsageStatus } from "@/lib/api/token-usage/getTokenUsageStatus";
import { getAiUsageDecision } from "@/lib/utils/aiUsageGuard";
import {
  AI_USAGE_GUARD_CACHE_KEY,
  writeAiUsageGuardCache,
} from "@/lib/utils/aiUsageGuardCache";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getDeviceId } from "@/lib/utils/deviceId";

const FOCUS_DEBOUNCE_MS = 3000;

export const useTokenUsageSync = () => {
  const lastSyncAtRef = useRef(0);
  const deviceId = getDeviceId();

  const usageQuery = useQuery({
    queryKey: queryKeys.tokenUsage.byDevice(deviceId),
    queryFn: fetchTokenUsageStatus,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: true,
  });

  const syncOnce = useCallback(async () => {
    const now = Date.now();
    if (now - lastSyncAtRef.current < FOCUS_DEBOUNCE_MS) {
      return;
    }
    lastSyncAtRef.current = now;

    try {
      const result = await usageQuery.refetch();
      if (!result.data) {
        return;
      }
      const decision = getAiUsageDecision(result.data);
      writeAiUsageGuardCache({
        allowed: decision.allowed,
        checkedAt: Date.now(),
        message: decision.message,
      });
    } catch (error) {
      console.error("token usage sync failed:", error);
    }
  }, [usageQuery]);

  useEffect(() => {
    void syncOnce();
  }, [syncOnce]);

  useEffect(() => {
    const onFocus = () => {
      void syncOnce();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void syncOnce();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncOnce]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== AI_USAGE_GUARD_CACHE_KEY) return;
      if (event.newValue !== null) return;
      void syncOnce();
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [syncOnce]);
};
