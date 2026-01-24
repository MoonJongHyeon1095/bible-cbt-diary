import { RefreshCw } from "lucide-react";
import styles from "../../MinimalStyles.module.css";

interface MinimalAutoThoughtControlSectionProps {
  disabled: boolean;
  showCustomButton: boolean;
  onNextThought: () => void;
  onEnableCustom: () => void;
}

export function MinimalAutoThoughtControlSection({
  disabled,
  showCustomButton,
  onNextThought,
  onEnableCustom,
}: MinimalAutoThoughtControlSectionProps) {
  return (
    <div className={styles.controlRow}>
      <button
        type="button"
        onClick={onNextThought}
        aria-label="다른 생각 보기"
        disabled={disabled}
        className={styles.smallIconButton}
      >
        <RefreshCw size={18} strokeWidth={2.5} />
      </button>

      {showCustomButton && (
        <button
          type="button"
          onClick={onEnableCustom}
          className={styles.secondaryButton}
        >
          또는 직접 생각을 작성해보세요
        </button>
      )}
    </div>
  );
}
