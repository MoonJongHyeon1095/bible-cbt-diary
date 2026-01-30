"use client";

import styles from "./EmotionNoteDetailSectionBadge.module.css";

type EmotionNoteDetailSectionBadgeProps = {
  text: string;
};

export default function EmotionNoteDetailSectionBadge({
  text,
}: EmotionNoteDetailSectionBadgeProps) {
  return <span className={styles.badge}>{text}</span>;
}
