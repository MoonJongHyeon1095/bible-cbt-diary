import styles from "../../MinimalStyles.module.css";

interface MinimalCognitiveErrorCardProps {
  title: string;
  infoDescription?: string;
  evidenceQuote?: string;
  reason: string;
  detail?: string;
}

export function MinimalCognitiveErrorCard({
  title,
  infoDescription,
  evidenceQuote,
  reason,
  detail,
}: MinimalCognitiveErrorCardProps) {
  return (
    <div className={styles.inlineCard}>
      <div>
        <p className={styles.detailTitle}>{title}</p>
        {infoDescription && (
          <p className={styles.detailSubtext}>{infoDescription}</p>
        )}
      </div>
      {evidenceQuote && (
        <p className={styles.detailSubtext}>“{evidenceQuote}”</p>
      )}
      <p className={styles.helperText}>{reason}</p>
      {detail ? (
        <p className={styles.textBlock}>{detail}</p>
      ) : (
        <div className={styles.loadingFooter}>
          <span className={styles.spinner} />
          <span>설명을 불러오는 중입니다.</span>
        </div>
      )}
    </div>
  );
}
