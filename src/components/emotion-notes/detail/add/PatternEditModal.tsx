"use client";

import { useModalOpen } from "@/components/common/useModalOpen";
import styles from "./PatternEditModal.module.css";

interface PatternEditModalProps {
  open: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  hideClose?: boolean;
  chromeless?: boolean;
}

export function PatternEditModal({
  open,
  title,
  onOpenChange,
  children,
  hideClose = false,
  chromeless = false,
}: PatternEditModalProps) {
  useModalOpen(open);
  if (!open) return null;
  const contentClassName = chromeless
    ? styles.contentChromeless
    : styles.content;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={() => onOpenChange(false)}
    >
      <div
        className={[styles.modal, contentClassName].join(" ")}
        onClick={(event) => event.stopPropagation()}
      >
        {!hideClose ? (
          <button
            type="button"
            className={styles.close}
            onClick={() => onOpenChange(false)}
            aria-label="닫기"
          >
            닫기
          </button>
        ) : null}
        <div className={styles.body}>
          <div className={styles.bodyInner}>{children}</div>
        </div>
        <div className={styles.floatingRoot} data-floating-root="pattern-edit" />
      </div>
    </div>
  );
}
