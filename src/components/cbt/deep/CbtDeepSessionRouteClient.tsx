"use client";

import CbtDeepSessionPage from "@/components/cbt/deep/CbtDeepSessionPage";
import RequireLoginPrompt from "@/components/common/RequireLoginPrompt";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { Suspense } from "react";

export default function CbtDeepSessionRouteClient() {
  const { accessMode, isLoading } = useAccessContext();
  const { gateReady } = useAiUsageGuard({
    enabled: !isLoading && accessMode === "auth",
    cache: true,
  });

  if (isLoading) {
    return null;
  }

  if (accessMode !== "auth") {
    return (
      <RequireLoginPrompt
        title="로그인이 필요합니다"
        subtitle="세션을 시작하려면 먼저 로그인해주세요."
      />
    );
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
