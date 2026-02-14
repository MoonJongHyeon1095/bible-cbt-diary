import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { checkAiUsageLimit } from "@/lib/utils/aiUsageGuard";
import { startPerf } from "@/lib/utils/perf";
import {
  clearAiUsageGuardCache,
  readAiUsageGuardCache,
  writeAiUsageGuardCache,
} from "@/lib/storage/ai-usage/cache";
import type { UsageCacheEntry } from "@/lib/storage/ai-usage/cache";

type UseAiUsageGuardOptions = {
  enabled?: boolean;
  cache?: boolean;
  redirectTo?: string | null;
};

const DEFAULT_DENIED_MESSAGE =
  "토큰 사용량을 초과했습니다. (KST 09:00 초기화)";

export function useAiUsageGuard({
  enabled = true,
  cache = false,
  redirectTo = "/",
}: UseAiUsageGuardOptions = {}) {
  const { pushToast } = useCbtToast();
  const { accessMode, accessToken } = useAccessContext();
  const router = useRouter();
  const hasCheckedRef = useRef(false);
  const lastAllowedRef = useRef<boolean | null>(null);
  const lastMessageRef = useRef<string | null>(null);
  const hasNotifiedRef = useRef(false);
  const [gateReady, setGateReady] = useState(!enabled);
  const lastAccessKeyRef = useRef<string | null>(null);

  const notifyDenied = useCallback(
    (message?: string | null) => {
      if (hasNotifiedRef.current) return;
      hasNotifiedRef.current = true;
      pushToast(message ?? DEFAULT_DENIED_MESSAGE, "error");
    },
    [pushToast],
  );

  const handleDenied = useCallback(
    (message?: string | null) => {
      notifyDenied(message);
      if (redirectTo) {
        router.replace(redirectTo);
      }
    },
    [notifyDenied, redirectTo, router],
  );

  const hydrateFromCache = useCallback(
    (cached: UsageCacheEntry) => {
      hasCheckedRef.current = true;
      lastAllowedRef.current = cached.allowed;
      lastMessageRef.current = cached.message ?? null;
    },
    [],
  );

  const checkUsage = useCallback(async () => {
    const endPerf = startPerf("ai:usageGuard");
    if (cache && hasCheckedRef.current) {
      endPerf();
      const lastAllowed = lastAllowedRef.current ?? true;
      if (!lastAllowed) {
        handleDenied(lastMessageRef.current);
      }
      return lastAllowed;
    }

    if (cache) {
      const cached = readAiUsageGuardCache();
      if (cached) {
        hydrateFromCache(cached);
        endPerf();
        if (!cached.allowed) {
          handleDenied(cached.message ?? null);
        }
        return cached.allowed;
      }
      hasCheckedRef.current = true;
    }

    let allowed = true;
    let lastMessage: string | null = null;
    const captureToast: typeof pushToast = (message, variant) => {
      if (variant === "error") {
        lastMessage = message;
      }
      pushToast(message, variant);
    };
    try {
      const decision = await checkAiUsageLimit({ pushToast: captureToast });
      allowed = decision.allowed;
      lastMessage = decision.message ?? lastMessage;
    } catch (error) {
      console.error("ai usage guard failed:", error);
      pushToast("토큰 사용량 확인 중 서버 오류가 발생했습니다.", "error");
      lastMessage = "토큰 사용량 확인 중 서버 오류가 발생했습니다.";
      allowed = false;
    }
    lastAllowedRef.current = allowed;
    lastMessageRef.current = lastMessage;
    if (cache) {
      writeAiUsageGuardCache({
        allowed,
        checkedAt: Date.now(),
        message: lastMessage ?? undefined,
      });
    }
    if (!allowed) {
      handleDenied(lastMessage);
      endPerf();
      return false;
    }
    endPerf();
    return true;
  }, [cache, handleDenied, hydrateFromCache, pushToast]);

  useEffect(() => {
    const accessKey = `${accessMode}:${accessToken ?? "none"}`;
    if (lastAccessKeyRef.current === accessKey) return;
    lastAccessKeyRef.current = accessKey;
    hasCheckedRef.current = false;
    lastAllowedRef.current = null;
    lastMessageRef.current = null;
    hasNotifiedRef.current = false;
    if (cache) {
      clearAiUsageGuardCache();
    }
  }, [accessMode, accessToken, cache]);

  useEffect(() => {
    if (!enabled) {
      setGateReady(true);
      return;
    }
    setGateReady(false);
    let active = true;
    (async () => {
      const allowed = await checkUsage();
      if (!active) return;
      if (allowed) {
        setGateReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [checkUsage, enabled]);

  return { gateReady, checkUsage };
}
