"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import DetailSectionBadge from "./DetailSectionBadge";
import styles from "./DetailSectionItemModal.module.css";

type DetailSectionItemModalProps = {
  isOpen: boolean;
  title: string;
  body: string;
  accentColor: string;
  icon: ReactNode;
  badgeText?: string | null;
  onClose: () => void;
};

export default function DetailSectionItemModal({
  isOpen,
  title,
  body,
  accentColor,
  icon,
  badgeText,
  onClose,
}: DetailSectionItemModalProps) {
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
            <DetailSectionBadge text={badgeText} />
          </div>
        ) : null}
        <p className={styles.body}>{body}</p>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="닫기"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
