import { Undo2 } from "lucide-react";
import styles from "../MinimalStyles.module.css";
import Button from "@/components/ui/Button";

interface MinimalFloatingBackButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  disabled?: boolean;
}

export function MinimalFloatingBackButton({
  onClick,
  ariaLabel = "이전으로",
  disabled = false,
}: MinimalFloatingBackButtonProps) {
  return (
    <Button
      type="button"
      variant="unstyled"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={styles.floatingMiniButton}
    >
      <Undo2 className={styles.floatingMiniIcon} />
    </Button>
  );
}
