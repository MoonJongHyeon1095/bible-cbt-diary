import { PenLine } from "lucide-react";
import { createPortal } from "react-dom";
import SafeButton from "@/components/ui/SafeButton";
import styles from "../MinimalStyles.module.css";

interface CbtMinimalFloatingCustomThoughtButtonProps {
  onClick: () => void;
  disabled?: boolean;
  dataTour?: string;
}

export function CbtMinimalFloatingCustomThoughtButton({
  onClick,
  disabled = false,
  dataTour,
}: CbtMinimalFloatingCustomThoughtButtonProps) {
  const content = (
    <div className={styles.floatingLabelWrap}>
      <SafeButton
        type="button"
        variant="unstyled"
        onClick={onClick}
        disabled={disabled}
        data-tour={dataTour}
        className={styles.floatingLabelButton}
      >
        <PenLine className={styles.floatingLabelIcon} />
      </SafeButton>
      <span className={styles.floatingLabelText}>직접 작성</span>
    </div>
  );

  if (typeof document === "undefined") {
    return content;
  }

  return createPortal(content, document.body);
}
