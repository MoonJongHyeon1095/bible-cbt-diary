"use client";

import Link from "next/link";
import type { EmotionNote } from "@/lib/types";
import EmotionNoteListSection from "./EmotionNoteListSection";
import styles from "./EmotionNotesSection.module.css";

type EmotionNotesSectionProps = {
  notes: EmotionNote[];
  todayLabel: string;
  isLoading: boolean;
};

export default function EmotionNotesSection({
  notes,
  todayLabel,
  isLoading,
}: EmotionNotesSectionProps) {
  return (
    <>
      <div className={styles.todayCard}>
        <p className={styles.todayLabel}>{todayLabel}</p>
        <h2 className={styles.todayTitle}>오늘의 감정 기록</h2>
        <Link href="/session" className={styles.plusButton}>
          <span className={styles.plusIcon} aria-hidden>
            +
          </span>
          <span className={styles.plusText}>새 기록 추가</span>
        </Link>
        <p className={styles.todayHint}>오늘 무슨 일이 있었나요?</p>
      </div>

      <EmotionNoteListSection
        title={notes.length > 0 ? `오늘 ${notes.length}개의 기록이 있습니다` : ""}
        notes={notes}
        isLoading={isLoading}
      />
    </>
  );
}
