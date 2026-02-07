"use client";

import { Download, Lock, Waypoints } from "lucide-react";
import type { CSSProperties } from "react";
import styles from "./EmotionNoteSection.module.css";

type LongPressOverlayProps = {
  mode: "longPress";
  isPressing: boolean;
  pressProgress: number;
  isTriggered: boolean;
  canGoDeeper: boolean;
};

type ImportOverlayProps = {
  mode: "import";
  isActive: boolean;
  isLoading: boolean;
};

type EmotionNoteCardOverlayProps = LongPressOverlayProps | ImportOverlayProps;

export default function EmotionNoteCardOverlay(
  props: EmotionNoteCardOverlayProps,
) {
  if (props.mode === "import") {
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

  const { isPressing, pressProgress, isTriggered, canGoDeeper } = props;

  return (
    <div
      className={`${styles.longPressOverlay} ${
        isPressing ? styles.longPressOverlayActive : ""
      }`}
      style={
        {
          "--press-progress": pressProgress,
          "--press-fill": 0.35 + pressProgress * 0.35,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {canGoDeeper ? (
        <>
          <span className={styles.longPressIconWrap}>
            <span
              className={`${styles.longPressSpinner} ${
                isTriggered ? styles.longPressSpinnerActive : ""
              }`}
            />
            <Waypoints size={22} className={styles.longPressIcon} />
          </span>
          <span className={styles.longPressText}>Flow</span>
        </>
      ) : (
        <>
          <span className={styles.longPressIconWrap}>
            <span
              className={`${styles.longPressSpinner} ${
                isTriggered ? styles.longPressSpinnerActive : ""
              }`}
            />
            <Lock size={20} className={styles.longPressIcon} />
          </span>
          <span className={styles.longPressText}>로그인이 필요합니다</span>
        </>
      )}
    </div>
  );
}
