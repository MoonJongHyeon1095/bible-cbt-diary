"use client";

import AppHeader from "@/components/header/AppHeader";
import SessionHistorySection from "@/components/history/SessionHistorySection";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useStorageBlockedRedirect } from "@/lib/hooks/useStorageBlockedRedirect";
import { useMemo } from "react";
import styles from "@/app/page.module.css";

export default function SessionHistoryPage() {
  const { accessMode, accessToken, isLoading } = useAccessContext();
  const access = useMemo(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );
  useStorageBlockedRedirect({
    enabled: !isLoading && accessMode === "blocked",
  });

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          {isLoading || accessMode === "blocked" ? null : (
            <SessionHistorySection access={access} />
          )}
        </div>
      </main>
    </div>
  );
}
