import { MinimalStepHeaderSection } from "./MinimalStepHeaderSection";
import styles from "../MinimalStyles.module.css";

type MinimalLoadingStateProps = {
  message: string;
  title?: string;
  description?: string;
  variant?: "inline" | "page";
};

export function MinimalLoadingState({
  message,
  title,
  description,
  variant = "inline",
}: MinimalLoadingStateProps) {
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
            <MinimalStepHeaderSection title={title} description={description} />
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
