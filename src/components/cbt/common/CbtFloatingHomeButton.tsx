import { House } from "lucide-react";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import SafeButton from "@/components/ui/SafeButton";

interface CbtFloatingHomeButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  disabled?: boolean;
}

export function CbtFloatingHomeButton({
  onClick,
  ariaLabel = "홈으로",
  disabled = false,
}: CbtFloatingHomeButtonProps) {
  return (
    <SafeButton
      type="button"
      variant="unstyled"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={styles.floatingMiniButton}
    >
      <House className={styles.floatingMiniIcon} />
    </SafeButton>
  );
}
