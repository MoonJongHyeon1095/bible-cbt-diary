"use client";

import styles from "@/components/emotion-notes/detail/EmotionNoteDetailPage.module.css";

export type DetailItemActionConfig = {
  timeText?: string;
};

type EmotionNoteDetailItemActionsProps = {
  actions: DetailItemActionConfig;
};

export default function EmotionNoteDetailItemActions({ actions }: EmotionNoteDetailItemActionsProps) {
  const { timeText } = actions;

  return (
    <div className={styles.detailFooter}>
      <div className={styles.detailFooterLeft} />
      {timeText ? <span className={styles.detailTime}>{timeText}</span> : null}
    </div>
  );
}
