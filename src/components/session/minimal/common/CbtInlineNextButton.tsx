import { ArrowRight } from "lucide-react";
import styles from "../MinimalStyles.module.css";
import SafeButton from "@/components/ui/SafeButton";

interface CbtInlineNextButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  dataTour?: string;
}

export function CbtInlineNextButton({
  onClick,
  ariaLabel = "다음으로",
  disabled = false,
  className,
  dataTour,
}: CbtInlineNextButtonProps) {
  return (
    <SafeButton
      type="button"
      variant="unstyled"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      data-tour={dataTour}
      className={`${styles.inlineNextButton} ${className ?? ""}`.trim()}
    >
      <ArrowRight className={styles.inlineNextIcon} />
    </SafeButton>
  );
}
