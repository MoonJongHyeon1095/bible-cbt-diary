import styles from "./SessionHistorySection.module.css";

type SessionHistorySectionCardProps = {
  title: string;
  children: React.ReactNode;
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
  children: React.ReactNode;
}) {
  return <p className={styles.sectionText}>{children}</p>;
}

export function SessionHistorySectionItalic({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className={`${styles.sectionText} ${styles.sectionItalic}`}>{children}</p>
  );
}

export function SessionHistoryChipRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.chipRow}>{children}</div>;
}

export function SessionHistoryChip({ children }: { children: React.ReactNode }) {
  return <span className={styles.chip}>{children}</span>;
}
