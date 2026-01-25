import type { ReactNode } from "react";
import styles from "../MinimalStyles.module.css";

interface MinimalStepHeaderSectionProps {
  title?: ReactNode;
  description?: ReactNode;
  titleClassName?: string;
  center?: boolean;
  children?: ReactNode;
}

export function MinimalStepHeaderSection({
  title,
  description,
  titleClassName,
  center,
  children,
}: MinimalStepHeaderSectionProps) {
  return (
    <div className={`${styles.header} ${center ? styles.center : ""}`}>
      {title && (
        <h1 className={`${styles.title} ${titleClassName ?? ""}`}>{title}</h1>
      )}
      {description &&
        (typeof description === "string" ? (
          <p className={styles.description}>{description}</p>
        ) : (
          <div className={styles.description}>{description}</div>
        ))}
      {children}
    </div>
  );
}
