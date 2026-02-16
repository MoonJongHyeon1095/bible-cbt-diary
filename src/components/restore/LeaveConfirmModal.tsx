"use client";

import SafeButton from "@/components/ui/SafeButton";
import { Save } from "lucide-react";
import styles from "./RestoreModal.module.css";

type LeaveConfirmModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function LeaveConfirmModal({
  open,
  onCancel,
  onConfirm,
}: LeaveConfirmModalProps) {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.card} onClick={(event) => event.stopPropagation()}>
        <div className={styles.titleRow}>
          <span className={styles.titleIcon} aria-hidden>
            <Save size={16} />
          </span>
          <p className={styles.title}>이 감정과 사건을 저장해둘까요?</p>
        </div>
        <p className={styles.body}>AI 응답 내용은 저장되지 않습니다.</p>
        <div className={`${styles.actions} ${styles.actionsSplit}`}>
          <SafeButton
            type="button"
            variant="ghost"
            onClick={onCancel}
            className={styles.actionButton}
          >
            계속 작성하기
          </SafeButton>
          <SafeButton
            type="button"
            variant="primary"
            onClick={onConfirm}
            className={styles.actionButton}
          >
            저장 후 나가기
          </SafeButton>
        </div>
      </div>
    </div>
  );
}
