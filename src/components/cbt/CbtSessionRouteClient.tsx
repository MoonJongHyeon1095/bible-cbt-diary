"use client";

import CbtSessionPage from "@/components/cbt/CbtSessionPage";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { useStorageBlockedRedirect } from "@/lib/hooks/useStorageBlockedRedirect";
import { Suspense } from "react";

export default function CbtSessionRouteClient() {
  const { accessMode, isLoading } = useAccessContext();
  const { gateReady } = useAiUsageGuard({
    enabled: !isLoading && accessMode !== "blocked",
    cache: true,
  });

  useStorageBlockedRedirect({
    enabled: !isLoading && accessMode === "blocked",
  });

  if (isLoading) {
    return null;
  }

  if (accessMode === "blocked") {
    return null;
  }

  if (!gateReady) {
    return null;
  }

  return (
    <Suspense fallback={<div />}>
      <CbtSessionPage />
    </Suspense>
  );
}
