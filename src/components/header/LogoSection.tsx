import { NotebookPen } from "lucide-react";
import styles from "./AppHeader.module.css";

export default function LogoSection() {
  return (
    <div className={styles.brandBlock}>
      <div className={styles.brandRow}>
        <span className={styles.brandIcon} aria-hidden>
          <NotebookPen size={18} />
        </span>
        <h1 className={styles.brandTitle}>Emotion Notes</h1>
      </div>
      <p className={styles.brandSubtitle}>
        오늘의 감정을 짧게 기록하고 흐름을 확인하세요.
      </p>
    </div>
  );
}
