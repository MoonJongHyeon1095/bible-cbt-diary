import styles from "../../MinimalStyles.module.css";
import Button from "@/components/ui/Button";

interface MinimalCognitiveErrorErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function MinimalCognitiveErrorErrorState({
  error,
  onRetry,
}: MinimalCognitiveErrorErrorStateProps) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.errorState}>
          <p>{error}</p>
        <Button
          type="button"
          variant="unstyled"
          onClick={onRetry}
          className={styles.secondaryButton}
        >
          다시 불러오기
        </Button>
        </div>
      </div>
    </div>
  );
}
