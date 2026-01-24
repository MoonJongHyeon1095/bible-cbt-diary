"use client";

import type { ReactNode } from "react";
import styles from "./EmotionNoteDetailPage.module.css";

type EmotionDetailSectionCardProps = {
  className?: string;
  icon: ReactNode;
  title: string;
  hint: string;
  children: ReactNode;
};

export default function EmotionDetailSectionCard({
  className,
  icon,
  title,
  hint,
  children,
}: EmotionDetailSectionCardProps) {
  return (
    <div className={`${styles.sectionCard} ${className ?? ""}`.trim()}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon} aria-hidden>
            {icon}
          </span>
          <h3>{title}</h3>
        </div>
        <p className={styles.sectionHint}>{hint}</p>
      </div>
      {children}
    </div>
  );
}
