import styles from "../MinimalStyles.module.css";

interface CbtMinimalAutoThoughtTextSectionProps {
  belief: string;
  emotionReason: string;
  fallback: string;
}

export function CbtMinimalAutoThoughtTextSection({
  belief,
  emotionReason,
  fallback,
}: CbtMinimalAutoThoughtTextSectionProps) {
  if (!belief && !emotionReason) {
    return <p className={styles.textBlock}>{fallback}</p>;
  }

  return (
    <div className={styles.textBlock}>
      {belief ? <p>{belief}</p> : null}
    </div>
  );
}
