"use client";

import SafeButton from "@/components/ui/SafeButton";
import { NotebookPen } from "lucide-react";
import styles from "./RestoreModal.module.css";

type ResumePromptModalProps = {
  open: boolean;
  onDismiss: () => void;
  onResume: () => void;
};

export default function ResumePromptModal({
  open,
  onDismiss,
  onResume,
}: ResumePromptModalProps) {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div className={styles.card} onClick={(event) => event.stopPropagation()}>
        <div className={styles.titleRow}>
          <span className={styles.titleIcon} aria-hidden>
            <NotebookPen size={16} />
          </span>
          <p className={styles.title}>중단된 기록이 있어요.</p>
        </div>
        <p className={styles.body}>입력한 감정과 사건으로 이어서 작성할까요?</p>
        <div className={`${styles.actions} ${styles.actionsSplit}`}>
          <SafeButton
            type="button"
            variant="ghost"
            onClick={onDismiss}
            className={styles.actionButton}
          >
            아니오
          </SafeButton>
          <SafeButton
            type="button"
            variant="primary"
            onClick={onResume}
            className={styles.actionButton}
          >
            이어할게요
          </SafeButton>
        </div>
      </div>
    </div>
  );
}
