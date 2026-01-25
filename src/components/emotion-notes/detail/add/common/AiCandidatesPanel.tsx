"use client";

import type { ReactNode } from "react";
import styles from "./AiCandidatesPanel.module.css";

interface AiCandidatesPanelProps {
  title: string;
  description?: string;
  countText?: string;
  tone?: "blue" | "green" | "amber" | "rose";
  children: ReactNode;
}

const toneStyles: Record<"blue" | "green" | "amber" | "rose", string> = {
  blue: styles.toneBlue,
  green: styles.toneGreen,
  amber: styles.toneAmber,
  rose: styles.toneRose,
};

export function AiCandidatesPanel({
  title,
  description,
  countText,
  tone = "blue",
  children,
}: AiCandidatesPanelProps) {
  const toneClass = toneStyles[tone];
  return (
    <div className={[styles.panel, toneClass].join(" ")}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>{title}</p>
          {description && (
            <p className={styles.description}>{description}</p>
          )}
        </div>
        {countText && (
          <span className={styles.badge}>{countText}</span>
        )}
      </div>
      <div className={styles.list}>{children}</div>
    </div>
  );
}
