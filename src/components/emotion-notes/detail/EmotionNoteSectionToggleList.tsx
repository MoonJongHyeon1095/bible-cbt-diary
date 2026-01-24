"use client";

import type { ReactNode } from "react";
import styles from "./EmotionNoteDetailPage.module.css";

type SectionToggleItem = {
  key: string;
  label: string;
  color: string;
  count: number;
  content?: ReactNode;
  isActive: boolean;
  onToggle: () => void;
};

type EmotionNoteSectionToggleListProps = {
  items: SectionToggleItem[];
};

export default function EmotionNoteSectionToggleList({
  items,
}: EmotionNoteSectionToggleListProps) {
  return (
    <div className={styles.toggleList}>
      {items.map((item) => (
        <div key={item.key} className={styles.toggleCard}>
          <button
            type="button"
            className={`${styles.chartLegendButton} ${
              item.isActive ? styles.chartLegendActive : ""
            }`}
            onClick={item.onToggle}
          >
            <span>
              <span
                className={styles.legendDot}
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
            <span>{item.count}</span>
          </button>
          {item.isActive ? (
            <div className={styles.toggleContent}>{item.content}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
