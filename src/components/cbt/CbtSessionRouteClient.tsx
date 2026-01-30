"use client";

import CbtSessionPage from "@/components/cbt/CbtSessionPage";
import RequireLoginPrompt from "@/components/common/RequireLoginPrompt";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { Suspense } from "react";

export default function CbtSessionRouteClient() {
  const { accessMode, isLoading } = useAccessContext();

  if (isLoading) {
    return null;
  }

  if (accessMode === "blocked") {
    return (
      <RequireLoginPrompt
        title="로그인이 필요합니다"
        subtitle="세션을 시작하려면 먼저 로그인해주세요."
      />
    );
  }

  return (
    <Suspense fallback={<div />}>
      <CbtSessionPage />
    </Suspense>
  );
}
