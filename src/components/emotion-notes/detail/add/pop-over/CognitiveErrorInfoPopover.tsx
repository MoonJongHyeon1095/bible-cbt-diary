"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { getCognitiveErrorMeta } from "./InfoPopoverMeta";
import styles from "./InfoPopover.module.css";

type CognitiveErrorInfoPopoverProps = {
  errorLabel?: string;
  caption?: string;
  tone?: "rose" | "blue";
  children: ReactNode;
};

export function CognitiveErrorInfoPopover({
  errorLabel,
  caption = "핵심 설명",
  tone = "rose",
  children,
}: CognitiveErrorInfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const error = getCognitiveErrorMeta(errorLabel);
  if (!error) return <>{children}</>;

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            setOpen(true);
          }
        }}
      >
        {children}
      </span>
      {open ? (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div
            className={[
              styles.card,
              tone === "blue" ? styles.cardBlue : styles.cardRose,
            ].join(" ")}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.stack}>
              <div className={styles.row}>
                <span
                  className={[
                    styles.chip,
                    tone === "blue" ? styles.chipBlue : styles.chipRose,
                  ].join(" ")}
                >
                  인지오류
                </span>
                <span className={styles.caption}>{caption}</span>
              </div>
              <div className={styles.stack}>
                <p className={styles.title}>{error.title}</p>
                <div className={styles.panel}>
                  <p className={styles.panelText}>{error.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
