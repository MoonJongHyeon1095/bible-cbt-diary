import { Home } from "lucide-react";
import styles from "../MinimalStyles.module.css";
import Button from "@/components/ui/Button";

interface CbtMinimalFloatingHomeButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  disabled?: boolean;
}

export function CbtMinimalFloatingHomeButton({
  onClick,
  ariaLabel = "홈으로",
  disabled = false,
}: CbtMinimalFloatingHomeButtonProps) {
  return (
    <Button
      type="button"
      variant="unstyled"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={styles.floatingMiniButton}
    >
      <Home className={styles.floatingMiniIcon} />
    </Button>
  );
}
