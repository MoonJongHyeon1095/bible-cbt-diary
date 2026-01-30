"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
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

type EmotionNoteDetailSectionToggleListProps = {
  items: SectionToggleItem[];
};

export default function EmotionNoteDetailSectionToggleList({
  items,
}: EmotionNoteDetailSectionToggleListProps) {
  return (
    <div className={styles.toggleList}>
      {items.map((item) => (
        <div key={item.key} className={styles.toggleCard}>
          <Button
            type="button"
            variant="unstyled"
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
          </Button>
          {item.isActive ? (
            <div className={styles.toggleContent}>{item.content}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
