import styles from "./EmotionNotesSection.module.css";

export default function EmotionNoteEmptyState() {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyTitle}>아직 오늘 기록이 없습니다</p>
      <p className={styles.emptyHint}>
        중앙의 + 버튼으로 오늘의 감정을 남겨보세요.
      </p>
    </div>
  );
}
