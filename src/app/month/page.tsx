"use client";

import AppHeader from "@/components/header/AppHeader";
import EmotionCalendarSection from "@/components/calendar/EmotionCalendarSection";
import styles from "../page.module.css";

export default function EmotionCalendarPage() {
  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          <EmotionCalendarSection />
        </div>
      </main>
    </div>
  );
}
