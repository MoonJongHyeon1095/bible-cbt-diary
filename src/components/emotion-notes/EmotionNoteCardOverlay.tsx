"use client";

import { Download } from "lucide-react";
import styles from "./EmotionNoteSection.module.css";

type ImportOverlayProps = {
  mode: "import";
  isActive: boolean;
  isLoading: boolean;
};

type EmotionNoteCardOverlayProps = ImportOverlayProps;

export default function EmotionNoteCardOverlay(
  props: EmotionNoteCardOverlayProps,
) {
  const { isActive, isLoading } = props;

  return (
    <div
      className={`${styles.importOverlay} ${
        isActive ? styles.importOverlayActive : ""
      }`}
      aria-hidden="true"
    >
      <span className={styles.longPressIconWrap}>
        <span
          className={`${styles.longPressSpinner} ${
            isLoading ? styles.longPressSpinnerActive : ""
          }`}
        />
        <Download size={22} className={styles.longPressIcon} />
      </span>
      <span className={styles.longPressText}>Import</span>
    </div>
  );
}
