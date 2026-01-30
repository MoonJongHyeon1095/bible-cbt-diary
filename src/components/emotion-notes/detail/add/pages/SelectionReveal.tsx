"use client";

import type { ReactNode } from "react";
import styles from "./EmotionNoteAddPage.module.css";

type SelectionRevealProps = {
  isVisible: boolean;
  children: ReactNode;
};

export default function SelectionReveal({
  isVisible,
  children,
}: SelectionRevealProps) {
  return (
    <div
      className={styles.reveal}
      style={{
        maxHeight: isVisible ? "900px" : "0px",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(-6px)",
      }}
    >
      {isVisible ? children : null}
    </div>
  );
}
