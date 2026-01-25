"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import styles from "./PatternAddSectionShell.module.css";

type Tone = "amber" | "rose" | "green" | "blue";

const toneMap: Record<Tone, string> = {
  amber: styles.toneAmber,
  rose: styles.toneRose,
  green: styles.toneGreen,
  blue: styles.toneBlue,
};

type PatternAddSectionShellProps = {
  tone: Tone;
  title: string;
  icon: LucideIcon;
  bodyClassName?: string;
  onClose?: () => void;
  children: ReactNode;
};

export function PatternAddSectionShell({
  tone,
  title,
  icon: Icon,
  bodyClassName,
  onClose,
  children,
}: PatternAddSectionShellProps) {
  const toneClass = toneMap[tone];

  return (
    <div className={[styles.shell, toneClass].join(" ")}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Icon size={16} />
          {title}
        </div>
        <button
          type="button"
          onClick={onClose}
          className={styles.closeButton}
          aria-label="닫기"
        >
          <X size={16} />
        </button>
      </div>
      <div className={[styles.body, bodyClassName].filter(Boolean).join(" ")}>
        {children}
      </div>
    </div>
  );
}
