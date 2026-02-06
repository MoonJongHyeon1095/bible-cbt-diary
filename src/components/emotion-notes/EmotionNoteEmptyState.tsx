import styles from "./EmotionNoteSection.module.css";

type EmotionNoteEmptyStateProps = {
  title?: string;
  hint?: string;
};

export default function EmotionNoteEmptyState({
  title = "이야기를 남기고 하루를 기록해볼까요?",
  hint = "마음이 훨씬 편해질 거예요.",
}: EmotionNoteEmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyTitle}>{title}</p>
      <p className={styles.emptyHint}>{hint}</p>
    </div>
  );
}
