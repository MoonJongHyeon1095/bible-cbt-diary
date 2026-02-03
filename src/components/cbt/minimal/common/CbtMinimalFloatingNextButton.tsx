import { ArrowRight } from "lucide-react";
import { createPortal } from "react-dom";
import styles from "../MinimalStyles.module.css";
import Button from "@/components/ui/Button";

interface CbtMinimalFloatingNextButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  disabled?: boolean;
  dataTour?: string;
}

export function CbtMinimalFloatingNextButton({
  onClick,
  ariaLabel = "다음으로",
  disabled = false,
  dataTour,
}: CbtMinimalFloatingNextButtonProps) {
  const button = (
    <Button
      type="button"
      variant="unstyled"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      data-tour={dataTour}
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
