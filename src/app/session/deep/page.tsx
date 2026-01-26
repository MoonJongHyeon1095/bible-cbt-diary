"use client";

import RequireLoginPrompt from "@/components/common/RequireLoginPrompt";
import DeepSessionPage from "@/components/cbt/deep/DeepSessionPage";
import { useAccessContext } from "@/lib/hooks/useAccessContext";

export default function DeepSessionRoutePage() {
  const { accessMode, isLoading } = useAccessContext();

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

  return <DeepSessionPage />;
}
