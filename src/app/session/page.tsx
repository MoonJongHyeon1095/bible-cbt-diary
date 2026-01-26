"use client";

import { useAccessContext } from "@/lib/hooks/useAccessContext";
import SessionPage from "@/components/cbt/SessionPage";
import RequireLoginPrompt from "@/components/common/RequireLoginPrompt";

export default function SessionRoutePage() {
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

  return <SessionPage />;
}
