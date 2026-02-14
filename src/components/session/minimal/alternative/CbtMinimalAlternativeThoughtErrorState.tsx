import styles from "../MinimalStyles.module.css";
import SafeButton from "@/components/ui/SafeButton";

interface CbtMinimalAlternativeThoughtErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function CbtMinimalAlternativeThoughtErrorState({
  error,
  onRetry,
}: CbtMinimalAlternativeThoughtErrorStateProps) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.errorState}>
          <p>{error}</p>
        <SafeButton
          type="button"
          variant="unstyled"
          onClick={onRetry}
          className={styles.secondaryButton}
        >
          다시 불러오기
        </SafeButton>
        </div>
      </div>
    </div>
  );
}
