import { Undo2 } from "lucide-react";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import SafeButton from "@/components/ui/SafeButton";

interface CbtFloatingBackButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  disabled?: boolean;
}

export function CbtFloatingBackButton({
  onClick,
  ariaLabel = "이전으로",
  disabled = false,
}: CbtFloatingBackButtonProps) {
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
