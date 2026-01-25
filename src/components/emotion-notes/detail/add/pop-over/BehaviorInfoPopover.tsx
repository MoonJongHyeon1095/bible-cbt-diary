"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { getBehaviorMeta } from "./InfoPopoverMeta";
import styles from "./InfoPopover.module.css";

type BehaviorInfoPopoverProps = {
  behaviorLabel?: string;
  children: ReactNode;
};

export function BehaviorInfoPopover({
  behaviorLabel,
  children,
}: BehaviorInfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const behavior = getBehaviorMeta(behaviorLabel);
  if (!behavior) return <>{children}</>;

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
            className={[styles.card, styles.cardBlue].join(" ")}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.stack}>
              <div className={styles.row}>
                <span
                  className={[styles.chip, styles.chipBlue].join(" ")}
                >
                  행동 반응
                </span>
                <span className={styles.caption}>실천 가이드</span>
              </div>
              <p className={styles.title}>{behavior.replacement_title}</p>
              <div className={styles.panel}>
                <p className={styles.panelTitle}>설명</p>
                <p className={styles.panelText}>{behavior.description}</p>
              </div>
              <div className={styles.panel}>
                <p className={styles.panelTitle}>사용법</p>
                <p className={styles.panelText}>{behavior.usage_description}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
