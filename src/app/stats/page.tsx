"use client";

import AppHeader from "@/components/header/AppHeader";
import styles from "../page.module.css";

export default function StatsPage() {
  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          <div className={styles.emptyAuth}>
            <h2 className={styles.emptyAuthTitle}>통계 화면 준비 중</h2>
            <p className={styles.emptyAuthHint}>
              감정 흐름 통계를 정리하는 화면을 곧 제공합니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
