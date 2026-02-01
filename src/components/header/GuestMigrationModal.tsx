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
            기기에 저장된 사용 기록을
            <span className={styles.mobileBreak} aria-hidden="true" />
            회원 계정으로 옮길 수 있습니다.
          </h2>
          <p className={styles.body}>
            로그인 전의 감정 노트 기록 등이 회원 기록으로 통합됩니다.
          </p>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            onClick={onDecline}
            disabled={isUploading}
            className={styles.declineButton}
          >
            이전하지 않습니다
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            loading={isUploading}
            loadingText="이전 중..."
          >
            이전합니다
          </Button>
        </div>
      </div>
    </div>
  );
}
