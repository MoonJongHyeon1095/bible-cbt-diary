"use client";

import type { ReactNode } from "react";
import styles from "./EmotionNoteAddPage.module.css";

type EmotionNoteAddSummaryItemProps = {
  label: string;
  body: ReactNode;
  tone?: "default" | "soft";
};

export default function EmotionNoteAddSummaryItem({
  label,
  body,
  tone = "default",
}: EmotionNoteAddSummaryItemProps) {
  return (
    <div
      className={styles.summaryCard}
      data-tone={tone}
    >
      <div className={styles.summaryCardHeader}>
        <span className={styles.summaryCardLabel}>{label}</span>
      </div>
      <div className={styles.summaryCardBody}>{body}</div>
    </div>
  );
}
