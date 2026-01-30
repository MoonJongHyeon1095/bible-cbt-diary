"use client";

import { Copy, Maximize2 } from "lucide-react";
import Button from "@/components/ui/Button";
import styles from "@/components/emotion-notes/detail/EmotionNoteDetailPage.module.css";

export type DetailItemActionConfig = {
  copyText: string;
  modalTitle: string;
  modalBody: string;
  modalBadgeText?: string | null;
  timeText?: string;
  onCopyText?: (text: string) => void;
  onOpenModal?: (title: string, body: string, badgeText?: string | null) => void;
};

type EmotionNoteDetailItemActionsProps = {
  actions: DetailItemActionConfig;
};

export default function EmotionNoteDetailItemActions({ actions }: EmotionNoteDetailItemActionsProps) {
  const {
    copyText,
    modalTitle,
    modalBody,
    modalBadgeText,
    timeText,
    onCopyText,
    onOpenModal,
  } = actions;

  return (
    <div className={styles.detailFooter}>
      <div className={styles.detailFooterLeft}>
        <Button
          type="button"
          variant="unstyled"
          className={styles.miniIconButton}
          onClick={(event) => {
            event.stopPropagation();
            onCopyText?.(copyText);
          }}
          aria-label="복사"
        >
          <Copy size={16} />
          <span className={styles.srOnly}>복사</span>
        </Button>
        <Button
          type="button"
          variant="unstyled"
          className={styles.miniIconButton}
          onClick={(event) => {
            event.stopPropagation();
            onOpenModal?.(modalTitle, modalBody, modalBadgeText);
          }}
          aria-label="확대"
        >
          <Maximize2 size={16} />
          <span className={styles.srOnly}>확대</span>
        </Button>
      </div>
      {timeText ? <span className={styles.detailTime}>{timeText}</span> : null}
    </div>
  );
}
