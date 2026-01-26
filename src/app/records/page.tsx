"use client";

import AppHeader from "@/components/header/AppHeader";
import RequireLoginPrompt from "@/components/common/RequireLoginPrompt";
import SessionHistorySection from "@/components/history/SessionHistorySection";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useMemo } from "react";
import styles from "../page.module.css";

export default function RecordsPage() {
  const { accessMode, accessToken, isLoading } = useAccessContext();
  const access = useMemo(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          {isLoading ? null : accessMode === "blocked" ? (
            <RequireLoginPrompt
              title="로그인이 필요합니다"
              subtitle="저장된 기록을 보려면 먼저 로그인해주세요."
            />
          ) : (
            <SessionHistorySection access={access} />
          )}
        </div>
      </main>
    </div>
  );
}
