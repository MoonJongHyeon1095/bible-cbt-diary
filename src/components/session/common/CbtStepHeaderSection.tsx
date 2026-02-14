import type { ReactNode } from "react";
import styles from "@/components/session/minimal/MinimalStyles.module.css";

interface CbtStepHeaderSectionProps {
  title?: ReactNode;
  description?: ReactNode;
  titleClassName?: string;
  center?: boolean;
  children?: ReactNode;
}

export function CbtStepHeaderSection({
  title,
  description,
  titleClassName,
  center,
  children,
}: CbtStepHeaderSectionProps) {
  return (
    <div className={`${styles.header} ${center ? styles.center : ""}`}>
      {title && (
        <h1 className={`${styles.title} ${titleClassName ?? ""}`}>
          {title}
        </h1>
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
