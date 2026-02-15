import styles from "./EmotionNoteHomePage.module.css";

type HomeDateProps = {
  label: string;
};

export function HomeDate({ label }: HomeDateProps) {
  return (
    <div className={styles.dateDock}>
      <p className={styles.dateHint}>{label}</p>
    </div>
  );
}
