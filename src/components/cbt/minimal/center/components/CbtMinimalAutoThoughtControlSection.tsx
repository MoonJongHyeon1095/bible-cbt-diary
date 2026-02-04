import styles from "../../MinimalStyles.module.css";
import SafeButton from "@/components/ui/SafeButton";
import CbtCarouselDots from "@/components/cbt/common/CbtCarouselDots";

interface CbtMinimalAutoThoughtControlSectionProps {
  disabled: boolean;
  dotsCount: number;
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onEnableCustom: () => void;
}

export function CbtMinimalAutoThoughtControlSection({
  disabled,
  dotsCount,
  currentIndex,
  onSelectIndex,
  onEnableCustom,
}: CbtMinimalAutoThoughtControlSectionProps) {
  return (
    <div className={styles.carouselControlStack}>
      <CbtCarouselDots
        count={dotsCount}
        currentIndex={currentIndex}
        onSelect={onSelectIndex}
        disabled={disabled}
      />

      <SafeButton
        type="button"
        variant="unstyled"
        onClick={onEnableCustom}
        data-tour="minimal-thought-custom"
        className={`${styles.secondaryButton} ${styles.carouselCustomPrompt}`}
      >
        또는 직접 생각을 작성해보세요
      </SafeButton>
    </div>
  );
}
