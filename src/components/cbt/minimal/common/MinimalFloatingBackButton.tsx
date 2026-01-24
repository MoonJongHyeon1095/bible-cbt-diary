import { Undo2 } from "lucide-react";
import styles from "../MinimalStyles.module.css";

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
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={styles.floatingMiniButton}
    >
      <Undo2 className={styles.floatingMiniIcon} />
    </button>
  );
}
