import styles from "../MinimalStyles.module.css";

interface CbtMinimalAlternativeThoughtBodySectionProps {
  thought: string;
  technique?: string;
  fallback: string;
}

export function CbtMinimalAlternativeThoughtBodySection({
  thought,
  technique,
  fallback,
}: CbtMinimalAlternativeThoughtBodySectionProps) {
  return (
    <div className={styles.formStack}>
      <div className={styles.textBlock}>{thought || fallback}</div>
      {technique && <div className={styles.tag}>{technique}</div>}
    </div>
  );
}
