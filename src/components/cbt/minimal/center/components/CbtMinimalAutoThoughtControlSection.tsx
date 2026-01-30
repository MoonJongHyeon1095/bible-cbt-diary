import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "../../MinimalStyles.module.css";
import Button from "@/components/ui/Button";

interface CbtMinimalAutoThoughtControlSectionProps {
  disabled: boolean;
  showCustomButton: boolean;
  onNextThought: () => void;
  onPrevThought: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  onEnableCustom: () => void;
}

export function CbtMinimalAutoThoughtControlSection({
  disabled,
  showCustomButton,
  onNextThought,
  onPrevThought,
  canGoPrev,
  canGoNext,
  onEnableCustom,
}: CbtMinimalAutoThoughtControlSectionProps) {
  return (
    <div className={styles.controlRow}>
      <Button
        type="button"
        variant="unstyled"
        onClick={onPrevThought}
        aria-label="이전 생각 보기"
        disabled={disabled || !canGoPrev}
        className={styles.smallIconButton}
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
      </Button>
      <Button
        type="button"
        variant="unstyled"
        onClick={onNextThought}
        aria-label="다음 생각 보기"
        disabled={disabled || !canGoNext}
        className={styles.smallIconButton}
      >
        <ChevronRight size={18} strokeWidth={2.5} />
      </Button>

      {showCustomButton && (
        <Button
          type="button"
          variant="unstyled"
          onClick={onEnableCustom}
          className={styles.secondaryButton}
        >
          또는 직접 생각을 작성해보세요
        </Button>
      )}
    </div>
  );
}
