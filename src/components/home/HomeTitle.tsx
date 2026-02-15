import styles from "./EmotionNoteHomePage.module.css";

type HomeTitleProps = {
  text: string;
};

export function HomeTitle({ text }: HomeTitleProps) {
  return (
    <h2 className={styles.title}>
      <span className={styles.titleQuestion}>{text}</span>
    </h2>
  );
}
