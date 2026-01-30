"use client";

import type { ReactNode } from "react";
import styles from "./CommonLoadingState.module.css";

type CommonLoadingStateProps = {
  message: string;
  title?: string;
  description?: string;
  variant?: "inline" | "page";
  footerSlot?: ReactNode;
};

export function CommonLoadingState({
  message,
  title,
  description,
  variant = "inline",
  footerSlot,
}: CommonLoadingStateProps) {
  const skeleton = (
    <div className={styles.card}>
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} style={{ width: "85%" }} />
      <div className={styles.skeletonLine} style={{ width: "70%" }} />
      <div className={styles.footer}>
        <span className={styles.spinner} />
        <span>{message}</span>
      </div>
      {footerSlot ? <div className={styles.footerSlot}>{footerSlot}</div> : null}
    </div>
  );

  if (variant === "page") {
    return (
      <div className={styles.page}>
        <div className={styles.pageInner}>
          {(title || description) && (
            <div className={styles.header}>
              {title && <p className={styles.title}>{title}</p>}
              {description && (
                <p className={styles.description}>{description}</p>
              )}
            </div>
          )}
          {skeleton}
        </div>
      </div>
    );
  }

  return skeleton;
}
