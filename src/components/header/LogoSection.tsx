import { NotebookPen } from "lucide-react";
import styles from "./AppHeader.module.css";

export default function LogoSection() {
  return (
    <div className={styles.brandBlock}>
      <div className={styles.brandRow}>
        <span className={styles.brandIcon} aria-hidden>
          <NotebookPen size={18} />
        </span>
        <h1 className={styles.brandTitle}>에디(EDi)와의 감정일기</h1>
      </div>
    </div>
  );
}
