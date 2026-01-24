"use client";

import AppHeader from "@/components/header/AppHeader";
import styles from "../page.module.css";

export default function RecordsPage() {
  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          <div className={styles.emptyAuth}>
            <h2 className={styles.emptyAuthTitle}>기록 화면 준비 중</h2>
            <p className={styles.emptyAuthHint}>
              기록 목록을 정리하는 화면을 곧 제공합니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
