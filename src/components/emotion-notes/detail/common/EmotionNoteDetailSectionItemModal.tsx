"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import SafeButton from "@/components/ui/SafeButton";
import { useModalOpen } from "@/components/common/useModalOpen";
import EmotionNoteDetailSectionBadge from "./EmotionNoteDetailSectionBadge";
import styles from "./EmotionNoteDetailSectionItemModal.module.css";

type EmotionNoteDetailSectionItemModalProps = {
  isOpen: boolean;
  title: string;
  body: string;
  accentColor: string;
  icon: ReactNode;
  badgeText?: string | null;
  onClose: () => void;
};

export default function EmotionNoteDetailSectionItemModal({
  isOpen,
  title,
  body,
  accentColor,
  icon,
  badgeText,
  onClose,
}: EmotionNoteDetailSectionItemModalProps) {
  useModalOpen(isOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div className={styles.card} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <span
            className={styles.icon}
            style={{ backgroundColor: accentColor }}
          >
            {icon}
          </span>
          <div className={styles.meta}>
            <p className={styles.title}>{title}</p>
          </div>
        </div>
        {badgeText ? (
          <div className={styles.bodyBadge}>
            <EmotionNoteDetailSectionBadge text={badgeText} />
          </div>
        ) : null}
        <p className={styles.body}>{body}</p>
        <SafeButton
          type="button"
          variant="unstyled"
          className={styles.close}
          onClick={onClose}
          aria-label="닫기"
        >
          <X size={18} />
        </SafeButton>
      </div>
    </div>
  );
}
