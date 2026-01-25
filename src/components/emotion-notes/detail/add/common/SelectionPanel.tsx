"use client";

import type { ReactNode } from "react";
import styles from "./SelectionPanel.module.css";

type Tone = "blue" | "green" | "amber" | "rose";

const toneStyles: Record<Tone, string> = {
  blue: styles.toneBlue,
  green: styles.toneGreen,
  amber: styles.toneAmber,
  rose: styles.toneRose,
};

interface SelectionPanelProps {
  title: string;
  description?: string;
  countText?: string;
  emptyText?: string;
  emptyTextClassName?: string;
  tone?: Tone;
  children?: ReactNode;
}

export function SelectionPanel({
  title,
  description,
  countText,
  emptyText,
  emptyTextClassName,
  tone = "blue",
  children,
}: SelectionPanelProps) {
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
      {emptyText ? (
        <p
          className={[styles.empty, emptyTextClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {emptyText}
        </p>
      ) : (
        <div className={styles.list}>{children}</div>
      )}
    </div>
  );
}
