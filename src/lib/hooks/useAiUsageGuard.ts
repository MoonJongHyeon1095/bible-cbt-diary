import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { checkAiUsageLimit } from "@/lib/utils/aiUsageGuard";
import { startPerf } from "@/lib/utils/perf";

type UseAiUsageGuardOptions = {
  enabled?: boolean;
  cache?: boolean;
  redirectTo?: string;
};

type UsageCacheEntry = {
  allowed: boolean;
  checkedAt: number;
};

const CACHE_TTL_MS = 60_000;
const CACHE_KEY = "aiUsageGuard:last";
let cachedUsage: UsageCacheEntry | null = null;

const readCachedUsage = (): UsageCacheEntry | null => {
  if (cachedUsage) return cachedUsage;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UsageCacheEntry;
    if (
      typeof parsed?.allowed !== "boolean" ||
      typeof parsed?.checkedAt !== "number"
    ) {
      return null;
    }
    cachedUsage = parsed;
    return parsed;
  } catch {
    return null;
  }
};

const writeCachedUsage = (entry: UsageCacheEntry) => {
  cachedUsage = entry;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore storage errors (private mode, quota, etc.).
  }
};

export function useAiUsageGuard({
  enabled = true,
  cache = false,
  redirectTo = "/",
}: UseAiUsageGuardOptions = {}) {
  const { pushToast } = useCbtToast();
  const router = useRouter();
  const hasCheckedRef = useRef(false);
  const lastAllowedRef = useRef<boolean | null>(null);
  const [gateReady, setGateReady] = useState(!enabled);

  const checkUsage = useCallback(async () => {
    const endPerf = startPerf("ai:usageGuard");
    if (cache && hasCheckedRef.current) {
      endPerf();
      return lastAllowedRef.current ?? true;
    }
    if (cache) {
      const cached = readCachedUsage();
      if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
        hasCheckedRef.current = true;
        lastAllowedRef.current = cached.allowed;
        endPerf();
        return cached.allowed;
      }
    }
    if (cache) {
      hasCheckedRef.current = true;
    }
    let allowed = true;
    try {
      allowed = await checkAiUsageLimit(pushToast);
    } catch (error) {
      console.error("ai usage guard failed:", error);
      pushToast("토큰 사용량 확인 중 서버 오류가 발생했습니다.", "error");
      allowed = false;
    }
    lastAllowedRef.current = allowed;
    if (cache) {
      writeCachedUsage({ allowed, checkedAt: Date.now() });
    }
    if (!allowed) {
      router.replace(redirectTo);
      endPerf();
      return false;
    }
    endPerf();
    return true;
  }, [cache, pushToast, redirectTo, router]);

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
