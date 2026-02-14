import type { ReactNode } from "react";
import { CbtStepHeaderSection } from "@/components/session/common/CbtStepHeaderSection";
import styles from "@/components/session/minimal/MinimalStyles.module.css";

type CbtLoadingStateProps = {
  message: string;
  title?: string;
  description?: ReactNode;
  variant?: "inline" | "page";
  prompt?: ReactNode;
};

export function CbtLoadingState({
  message,
  title,
  description,
  variant = "inline",
  prompt,
}: CbtLoadingStateProps) {
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
          {prompt ? <div className={styles.headerPrompt}>{prompt}</div> : null}
          {(title || description) && (
            <CbtStepHeaderSection
              title={title}
              description={description}
            />
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
