import styles from "../MinimalStyles.module.css";

interface CbtMinimalCognitiveErrorCardProps {
  title: string;
  infoDescription?: string;
  evidenceQuote?: string;
  reason: string;
  detail?: string;
}

export function CbtMinimalCognitiveErrorCard({
  title,
  infoDescription,
  evidenceQuote,
  reason,
  detail,
}: CbtMinimalCognitiveErrorCardProps) {
  return (
    <div className={`${styles.inlineCard} ${styles.errorCard}`}>
      <div>
        <p className={styles.detailTitle}>{title}</p>
        {infoDescription && (
          <p className={styles.detailSubtext}>{infoDescription}</p>
        )}
      </div>
      {evidenceQuote && (
        <div className={styles.sectionBlock}>
          <span className={styles.sectionLabel}>CLUE</span>
          <p className={styles.quoteText}>“{evidenceQuote}”</p>
        </div>
      )}
      <div className={styles.sectionBlock}>
        <span className={styles.sectionLabel}>REASON</span>
        <p className={styles.reasonBlock}>{reason}</p>
      </div>
      {detail ? (
        <div className={styles.sectionBlock}>
          <span className={styles.sectionLabel}>INSIGHT</span>
          <p className={styles.textBlock}>{detail}</p>
        </div>
      ) : (
        <div className={styles.loadingFooter}>
          <span className={styles.spinner} />
          <span>더 자세한 내용을 준비중이에요.</span>
        </div>
      )}
    </div>
  );
}
