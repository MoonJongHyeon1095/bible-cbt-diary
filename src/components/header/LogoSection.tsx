import { NotebookPen } from "lucide-react";
import styles from "./AppHeader.module.css";

export default function LogoSection() {
  return (
    <div className={styles.brandBlock}>
      <div className={styles.brandRow}>
        <span className={styles.brandIcon} aria-hidden>
          <NotebookPen size={18} />
        </span>
        <h1 className={styles.brandTitle}>Flow : AI 일기 · 감정 그래프</h1>
      </div>
    </div>
  );
}
