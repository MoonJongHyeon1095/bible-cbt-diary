"use client";

import styles from "./DetailSectionBadge.module.css";

type DetailSectionBadgeProps = {
  text: string;
};

export default function DetailSectionBadge({ text }: DetailSectionBadgeProps) {
  return <span className={styles.badge}>{text}</span>;
}
