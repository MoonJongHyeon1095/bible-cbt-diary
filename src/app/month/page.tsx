"use client";

import AppHeader from "@/components/header/AppHeader";
import EmotionCalendarSection from "@/components/calendar/EmotionCalendarSection";
import RequireLoginPrompt from "@/components/common/RequireLoginPrompt";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import styles from "../page.module.css";

export default function EmotionCalendarPage() {
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

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          {isLoading ? null : accessMode === "blocked" ? (
            <RequireLoginPrompt />
          ) : (
            <EmotionCalendarSection
              access={access}
              initialSelectedDate={initialSelectedDate}
            />
          )}
        </div>
      </main>
    </div>
  );
}
