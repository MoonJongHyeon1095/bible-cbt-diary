"use client";

import { Check } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import styles from "./SelectionCard.module.css";

type Tone = "blue" | "green" | "amber" | "rose";

const toneStyles: Record<Tone, string> = {
  blue: styles.toneBlue,
  green: styles.toneGreen,
  amber: styles.toneAmber,
  rose: styles.toneRose,
};

interface SelectionCardProps {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  tone?: Tone;
  contentClassName?: string;
  saved?: boolean;
}

export function SelectionCard({
  selected,
  onSelect,
  children,
  tone = "blue",
  contentClassName,
  saved = false,
}: SelectionCardProps) {
  const toneClass = toneStyles[tone];
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      aria-pressed={selected}
      className={[
        styles.card,
        toneClass,
        selected ? styles.selected : "",
        saved ? styles.saved : "",
      ].join(" ")}
    >
      <span
        className={[
          styles.indicator,
          selected ? styles.indicatorSelected : "",
        ].join(" ")}
      >
        {selected ? <Check size={12} /> : ""}
      </span>
      <div className={contentClassName ? `${styles.content} ${contentClassName}` : styles.content}>
        {children}
      </div>
      <span
        className={[
          styles.status,
          selected ? styles.statusSelected : "",
          saved ? styles.statusSaved : "",
        ].join(" ")}
      >
        {saved ? "저장됨" : selected ? "선택됨" : "선택"}
      </span>
    </div>
  );
}
