import styles from "../../MinimalStyles.module.css";

interface MinimalAlternativeThoughtBodySectionProps {
  thought: string;
  technique?: string;
  fallback: string;
}

export function MinimalAlternativeThoughtBodySection({
  thought,
  technique,
  fallback,
}: MinimalAlternativeThoughtBodySectionProps) {
  return (
    <div className={styles.formStack}>
      <div className={styles.textBlock}>{thought || fallback}</div>
      {technique && <div className={styles.tag}>{technique}</div>}
    </div>
  );
}
