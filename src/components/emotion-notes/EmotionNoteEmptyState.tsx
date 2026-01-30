import styles from "./EmotionNoteSection.module.css";

type EmotionNoteEmptyStateProps = {
  title?: string;
  hint?: string;
};

export default function EmotionNoteEmptyState({
  title = "아직 오늘 기록이 없습니다",
  hint = "중앙의 + 버튼으로 오늘의 감정을 남겨보세요.",
}: EmotionNoteEmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyTitle}>{title}</p>
      <p className={styles.emptyHint}>{hint}</p>
    </div>
  );
}
