"use client";

import AppHeader from "@/components/header/AppHeader";
import EmotionNoteSearchSection from "@/components/search/EmotionNoteSearchSection";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useStorageBlockedRedirect } from "@/lib/hooks/useStorageBlockedRedirect";
import { useMemo } from "react";
import styles from "@/app/page.module.css";

export default function EmotionNoteSearchPage() {
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
            <EmotionNoteSearchSection access={access} />
          )}
        </div>
      </main>
    </div>
  );
}
