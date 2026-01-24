import styles from "../../MinimalStyles.module.css";

interface MinimalAutoThoughtTextSectionProps {
  belief: string;
  emotionReason: string;
  fallback: string;
}

export function MinimalAutoThoughtTextSection({
  belief,
  emotionReason,
  fallback,
}: MinimalAutoThoughtTextSectionProps) {
  if (!belief && !emotionReason) {
    return <p className={styles.textBlock}>{fallback}</p>;
  }

  return (
    <div className={styles.textBlock}>
      {belief ? <p>{belief}</p> : null}
    </div>
  );
}
