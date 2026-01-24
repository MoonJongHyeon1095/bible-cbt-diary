import { CalendarDays, ChartColumn, ListChecks } from "lucide-react";
import styles from "./AppTabs.module.css";

export default function AppTabs() {
  return (
    <>
      <nav className={styles.topNav}>
        <button type="button" className={styles.tabButton} aria-current="page">
          오늘
        </button>
        <button type="button" className={styles.tabButton}>
          기록
        </button>
        <button type="button" className={styles.tabButton}>
          통계
        </button>
      </nav>
      <nav className={styles.bottomNav}>
        <button type="button" className={styles.tabButton} aria-current="page">
          <CalendarDays size={18} aria-hidden />
          <span>오늘</span>
        </button>
        <button type="button" className={styles.tabButton}>
          <ListChecks size={18} aria-hidden />
          <span>기록</span>
        </button>
        <button type="button" className={styles.tabButton}>
          <ChartColumn size={18} aria-hidden />
          <span>통계</span>
        </button>
      </nav>
    </>
  );
}
