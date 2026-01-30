import { CbtMinimalStepHeaderSection } from "./CbtMinimalStepHeaderSection";
import styles from "../MinimalStyles.module.css";

type CbtMinimalLoadingStateProps = {
  message: string;
  title?: string;
  description?: string;
  variant?: "inline" | "page";
};

export function CbtMinimalLoadingState({
  message,
  title,
  description,
  variant = "inline",
}: CbtMinimalLoadingStateProps) {
  const skeleton = (
    <div className={styles.loadingCard}>
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} style={{ width: "85%" }} />
      <div className={styles.skeletonLine} style={{ width: "70%" }} />
      <div className={styles.loadingFooter}>
        <span className={styles.spinner} />
        <span>{message}</span>
      </div>
    </div>
  );

  if (variant === "page") {
    return (
      <div className={styles.section}>
        <div className={styles.sectionInner}>
          {(title || description) && (
            <CbtMinimalStepHeaderSection title={title} description={description} />
          )}
          {skeleton}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.inlineCard}>
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} style={{ width: "80%" }} />
      <div className={styles.loadingFooter}>
        <span className={styles.spinner} />
        <span>{message}</span>
      </div>
    </div>
  );
}
