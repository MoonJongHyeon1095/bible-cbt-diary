import { ArrowRight } from "lucide-react";
import { createPortal } from "react-dom";
import styles from "../MinimalStyles.module.css";
import SafeButton from "@/components/ui/SafeButton";

interface CbtMinimalFloatingNextButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  disabled?: boolean;
  dataTour?: string;
  className?: string;
}

export function CbtMinimalFloatingNextButton({
  onClick,
  ariaLabel = "다음으로",
  disabled = false,
  dataTour,
  className,
}: CbtMinimalFloatingNextButtonProps) {
  const button = (
    <SafeButton
      type="button"
      variant="unstyled"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      data-tour={dataTour}
      className={`${styles.floatingButton} ${className ?? ""}`.trim()}
    >
      <ArrowRight className={styles.floatingIcon} />
    </SafeButton>
  );

  if (typeof document === "undefined") {
    return button;
  }

  return createPortal(button, document.body);
}
