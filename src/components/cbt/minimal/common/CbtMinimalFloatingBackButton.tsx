import { Undo2 } from "lucide-react";
import styles from "../MinimalStyles.module.css";
import SafeButton from "@/components/ui/SafeButton";

interface CbtMinimalFloatingBackButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  disabled?: boolean;
}

export function CbtMinimalFloatingBackButton({
  onClick,
  ariaLabel = "이전으로",
  disabled = false,
}: CbtMinimalFloatingBackButtonProps) {
  return (
    <SafeButton
      type="button"
      variant="unstyled"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={styles.floatingMiniButton}
    >
      <Undo2 className={styles.floatingMiniIcon} />
    </SafeButton>
  );
}
