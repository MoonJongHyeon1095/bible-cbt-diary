"use client";

import EmotionNoteCalendarSection from "@/components/month/EmotionNoteCalendarSection";
import AppHeader from "@/components/header/AppHeader";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useStorageBlockedRedirect } from "@/lib/hooks/useStorageBlockedRedirect";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import styles from "@/app/page.module.css";

export default function EmotionNoteCalendarPage() {
  const { accessMode, accessToken, isLoading } = useAccessContext();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const initialSelectedDate = useMemo(() => {
    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return null;
    }
    const parsed = new Date(`${dateParam}T00:00:00+09:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [dateParam]);
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
            <EmotionNoteCalendarSection
              access={access}
              initialSelectedDate={initialSelectedDate}
            />
          )}
        </div>
      </main>
    </div>
  );
}
