import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { checkAiUsageLimit } from "@/lib/utils/aiUsageGuard";

type UseAiUsageGuardOptions = {
  enabled?: boolean;
  cache?: boolean;
  redirectTo?: string;
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
    if (cache && hasCheckedRef.current) {
      return lastAllowedRef.current ?? true;
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
    if (!allowed) {
      router.replace(redirectTo);
      return false;
    }
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
