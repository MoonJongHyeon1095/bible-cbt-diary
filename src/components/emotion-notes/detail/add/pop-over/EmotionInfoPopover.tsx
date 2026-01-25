"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { getEmotionMeta } from "./InfoPopoverMeta";
import styles from "./InfoPopover.module.css";

type EmotionInfoPopoverProps = {
  emotionLabel?: string;
  children: ReactNode;
};

export function EmotionInfoPopover({
  emotionLabel,
  children,
}: EmotionInfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const emotion = getEmotionMeta(emotionLabel);
  if (!emotion) return <>{children}</>;

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
                <span className={[styles.chip, styles.chipBlue].join(" ")}>
                  감정
                </span>
              </div>
              <p className={styles.title}>{emotion.label}</p>
              <div className={styles.panel}>
                <p className={[styles.panelTitle, styles.blueLabel].join(" ")}>
                  긍정적인 면
                </p>
                <ul className={styles.list}>
                  {emotion.positive.map((item, index) => (
                    <li key={`${emotion.id}-positive-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.panel}>
                <p className={[styles.panelTitle, styles.blueLabel].join(" ")}>
                  주의할 점
                </p>
                <ul className={styles.list}>
                  {emotion.caution.map((item, index) => (
                    <li key={`${emotion.id}-caution-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
