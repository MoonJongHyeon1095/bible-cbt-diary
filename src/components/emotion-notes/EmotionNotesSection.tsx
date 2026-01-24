"use client";

import { useEffect, useState } from "react";
import EmotionNoteCreateModal from "./EmotionNoteCreateModal";
import EmotionNoteList from "./EmotionNoteList";
import styles from "./EmotionNotesSection.module.css";
import type { CreateEmotionNoteState, EmotionNote } from "@/lib/types";

type EmotionNotesSectionProps = {
  notes: EmotionNote[];
  todayLabel: string;
  userEmail: string | null;
  onCreateEmotionNote: (formData: FormData) => Promise<void>;
  formState: CreateEmotionNoteState;
  isLoading: boolean;
};

export default function EmotionNotesSection({
  notes,
  todayLabel,
  userEmail,
  onCreateEmotionNote,
  formState,
  isLoading,
}: EmotionNotesSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!formState.ok) {
      return;
    }

    setIsOpen(false);
  }, [formState.ok]);

  return (
    <>
      <div className={styles.todayCard}>
        <p className={styles.todayLabel}>{todayLabel}</p>
        <h2 className={styles.todayTitle}>오늘의 감정 기록</h2>
        <button
          type="button"
          className={styles.plusButton}
          onClick={() => setIsOpen(true)}
        >
          <span className={styles.plusIcon} aria-hidden>
            +
          </span>
          <span className={styles.plusText}>새 기록 추가</span>
        </button>
        <p className={styles.todayHint}>
          작은 감정도 기록하면 나중에 더 선명해집니다.
        </p>
      </div>

      <div className={styles.notesHeader}>
        <div>
          <h3 className={styles.notesTitle}>오늘의 노트</h3>
          <p className={styles.notesSubtitle}>
            {isLoading ? "불러오는 중..." : `${notes.length}개의 기록이 있습니다`}
          </p>
        </div>
        {userEmail ? <span className={styles.userChip}>{userEmail}</span> : null}
      </div>

      <EmotionNoteList notes={notes} />

      <EmotionNoteCreateModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={onCreateEmotionNote}
        formState={formState}
      />
    </>
  );
}
