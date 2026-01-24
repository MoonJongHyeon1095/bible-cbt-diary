import { ArrowRight } from "lucide-react";
import { createPortal } from "react-dom";
import styles from "../MinimalStyles.module.css";
import Button from "@/components/ui/Button";

interface MinimalFloatingNextButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  disabled?: boolean;
}

export function MinimalFloatingNextButton({
  onClick,
  ariaLabel = "다음으로",
  disabled = false,
}: MinimalFloatingNextButtonProps) {
  const button = (
    <Button
      type="button"
      variant="unstyled"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={styles.floatingButton}
    >
      <ArrowRight className={styles.floatingIcon} />
    </Button>
  );

  if (typeof document === "undefined") {
    return button;
  }

  return createPortal(button, document.body);
}
