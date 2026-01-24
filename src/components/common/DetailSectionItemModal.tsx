"use client";

import type { ReactNode } from "react";
import styles from "./DetailSectionItemModal.module.css";

type DetailSectionItemModalProps = {
  isOpen: boolean;
  title: string;
  body: string;
  accentColor: string;
  icon: ReactNode;
  onClose: () => void;
};

export default function DetailSectionItemModal({
  isOpen,
  title,
  body,
  accentColor,
  icon,
  onClose,
}: DetailSectionItemModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div className={styles.card} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.icon} style={{ backgroundColor: accentColor }}>
            {icon}
          </span>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <p className={styles.body}>{body}</p>
        <button type="button" className={styles.close} onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
