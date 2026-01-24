import type { ReactNode } from "react";
import styles from "./SessionHistorySection.module.css";

type SessionHistorySectionCardProps = {
  title: string;
  children: ReactNode;
};

export default function SessionHistorySectionCard({
  title,
  children,
}: SessionHistorySectionCardProps) {
  return (
    <div className={styles.sectionCard}>
      <span className={styles.sectionTitle}>{title}</span>
      {children}
    </div>
  );
}

export function SessionHistorySectionText({
  children,
}: {
  children: ReactNode;
}) {
  return <p className={styles.sectionText}>{children}</p>;
}

export function SessionHistorySectionItalic({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <p className={`${styles.sectionText} ${styles.sectionItalic}`}>{children}</p>
  );
}

export function SessionHistoryChipRow({
  children,
}: {
  children: ReactNode;
}) {
  return <div className={styles.chipRow}>{children}</div>;
}

export function SessionHistoryChip({ children }: { children: ReactNode }) {
  return <span className={styles.chip}>{children}</span>;
}
