"use client";

import CbtDeepSessionPage from "@/components/cbt/deep/CbtDeepSessionPage";
import { useAuthModal } from "@/components/header/AuthModalProvider";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { Suspense, useEffect, useRef } from "react";

export default function CbtDeepSessionRouteClient() {
  const { accessMode, isLoading } = useAccessContext();
  const { openAuthModal } = useAuthModal();
  const hasPromptedRef = useRef(false);
  const { gateReady } = useAiUsageGuard({
    enabled: !isLoading && accessMode === "auth",
    cache: true,
  });

  useEffect(() => {
    if (isLoading) return;
    if (accessMode === "auth") return;
    if (hasPromptedRef.current) return;
    hasPromptedRef.current = true;
    openAuthModal();
  }, [accessMode, isLoading, openAuthModal]);

  if (isLoading) {
    return null;
  }

  if (accessMode !== "auth") {
    return null;
  }

  if (!gateReady) {
    return null;
  }

  return (
    <Suspense fallback={<div />}>
      <CbtDeepSessionPage />
    </Suspense>
  );
}
