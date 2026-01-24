import styles from "../../MinimalStyles.module.css";

interface MinimalAlternativeThoughtErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function MinimalAlternativeThoughtErrorState({
  error,
  onRetry,
}: MinimalAlternativeThoughtErrorStateProps) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.errorState}>
          <p>{error}</p>
          <button type="button" onClick={onRetry} className={styles.secondaryButton}>
            다시 불러오기
          </button>
        </div>
      </div>
    </div>
  );
}
