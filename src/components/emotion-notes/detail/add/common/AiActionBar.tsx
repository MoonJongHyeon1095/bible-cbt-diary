"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import styles from "./AiActionBar.module.css";

type AiActionBarProps = {
  aiLabel: ReactNode;
  onAiClick: () => void;
  aiDisabled?: boolean;
  aiClassName?: string;
  saveLabel: ReactNode;
  onSave: () => void;
  saveDisabled?: boolean;
  saveClassName?: string;
  isSaving?: boolean;
  saveIcon?: ReactNode;
  savingIcon?: ReactNode;
};

export function AiActionBar({
  aiLabel,
  onAiClick,
  aiDisabled,
  aiClassName,
  saveLabel,
  onSave,
  saveDisabled,
  saveClassName,
  isSaving,
  saveIcon,
  savingIcon,
}: AiActionBarProps) {
  const resolvedSaveIcon = isSaving ? savingIcon ?? saveIcon : saveIcon;

  return (
    <div className={styles.bar}>
      <div className={styles.actions}>
        <Button
          size="sm"
          variant="outline"
          onClick={onAiClick}
          disabled={aiDisabled}
          className={aiClassName}
        >
          {aiLabel}
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={saveDisabled}
          className={saveClassName}
        >
          {resolvedSaveIcon}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
