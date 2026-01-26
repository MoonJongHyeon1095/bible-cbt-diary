"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { Lock } from "lucide-react";
import styles from "./AiActionBar.module.css";

type AiActionBarProps = {
  aiLabel: ReactNode;
  onAiClick: () => void;
  aiDisabled?: boolean;
  aiLocked?: boolean;
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
  aiLocked,
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
  const resolvedAiLabel = aiLocked ? (
    <span className={styles.lockedLabel}>
      <Lock size={14} aria-hidden="true" />
      {aiLabel}
    </span>
  ) : (
    aiLabel
  );

  return (
    <div className={styles.bar}>
      <div className={styles.actions}>
        <Button
          size="sm"
          variant="outline"
          onClick={onAiClick}
          disabled={aiDisabled || aiLocked}
          className={aiClassName}
        >
          {resolvedAiLabel}
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
