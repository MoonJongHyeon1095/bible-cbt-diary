"use client";

import EmotionNoteForm from "./EmotionNoteForm";
import styles from "./EmotionNotesSection.module.css";
import type { CreateEmotionNoteState } from "@/lib/types";

type EmotionNoteCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  formState: CreateEmotionNoteState;
};

export default function EmotionNoteCreateModal({
  isOpen,
  onClose,
  onSubmit,
  formState,
}: EmotionNoteCreateModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={styles.modalCard}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.modalLabel}>오늘의 감정</p>
            <h4 className={styles.modalTitle}>새 기록 작성</h4>
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            닫기
          </button>
        </div>
        <EmotionNoteForm onSubmit={onSubmit} />
        {formState.message ? (
          <p
            className={
              formState.ok ? styles.formSuccess : styles.formError
            }
          >
            {formState.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
