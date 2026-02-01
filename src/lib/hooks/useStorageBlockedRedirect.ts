"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCbtToast } from "@/components/cbt/common/CbtToast";

type UseStorageBlockedRedirectOptions = {
  enabled: boolean;
  redirectTo?: string;
  message?: string;
};

export const useStorageBlockedRedirect = ({
  enabled,
  redirectTo = "/",
  message = "기기의 스토리지를 사용할 수 없습니다.",
}: UseStorageBlockedRedirectOptions) => {
  const router = useRouter();
  const { pushToast } = useCbtToast();
  const hasPromptedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (hasPromptedRef.current) return;
    hasPromptedRef.current = true;
    pushToast(message, "error");
    router.replace(redirectTo);
  }, [enabled, message, pushToast, redirectTo, router]);
};
