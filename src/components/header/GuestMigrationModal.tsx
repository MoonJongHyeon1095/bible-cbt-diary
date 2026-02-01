"use client";

import { useModalOpen } from "@/components/common/useModalOpen";
import Button from "@/components/ui/Button";
import styles from "./GuestMigrationModal.module.css";

type GuestMigrationModalProps = {
  isOpen: boolean;
  isUploading: boolean;
  error?: string | null;
  onConfirm: () => void;
  onDecline: () => void;
};

export default function GuestMigrationModal({
  isOpen,
  isUploading,
  error,
  onConfirm,
  onDecline,
}: GuestMigrationModalProps) {
  useModalOpen(isOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.backdrop} role="presentation">
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>
            기기에 저장된 사용 기록이 있습니다.
            <span className={styles.mobileBreak} aria-hidden="true" />
            회원 계정으로 이전하시겠습니까?
          </h2>
          <p className={styles.body}>
            로그인 전 작성한 감정노트 기록 등이 회원 기록으로 통합됩니다.
          </p>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            onClick={onDecline}
            disabled={isUploading}
            className={`${styles.actionButton} ${styles.declineButton}`}
          >
            아니오
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            loading={isUploading}
            loadingText="이전 중..."
            className={styles.actionButton}
          >
            이전합니다
          </Button>
        </div>
      </div>
    </div>
  );
}
