"use client";

import { Waypoints } from "lucide-react";
import type { ReactNode } from "react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import styles from "../EmotionGraphSection.module.css";

export type EmotionNoteDetailSection =
  | "emotion"
  | "error"
  | "alternative"
  | "behavior";

export type EmotionNoteChip = {
  id: string;
  label: string;
  body: string;
  section: EmotionNoteDetailSection;
};

export type EmotionNoteNodeData = {
  label: ReactNode;
  size: number;
  chips: EmotionNoteChip[];
  onLongPress?: (nodeId: string) => void;
};

export default function EmotionNoteNode({
  data,
  id,
}: NodeProps<EmotionNoteNodeData>) {
  const longPressTimeoutRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const longPressStartRef = useRef<number | null>(null);
  const longPressRafRef = useRef<number | null>(null);
  const longPressOverlayDelayRef = useRef<number | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);

  const longPressDuration = 800;
  const longPressOverlayDelay = 120;

  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current !== null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }
      if (longPressOverlayDelayRef.current !== null) {
        window.clearTimeout(longPressOverlayDelayRef.current);
      }
      if (longPressRafRef.current !== null) {
        window.cancelAnimationFrame(longPressRafRef.current);
      }
    };
  }, []);

  const clearLongPressProgress = () => {
    if (longPressRafRef.current !== null) {
      window.cancelAnimationFrame(longPressRafRef.current);
      longPressRafRef.current = null;
    }
    longPressStartRef.current = null;
    setPressProgress(0);
    setIsPressing(false);
  };

  const clearLongPress = () => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    if (longPressOverlayDelayRef.current !== null) {
      window.clearTimeout(longPressOverlayDelayRef.current);
      longPressOverlayDelayRef.current = null;
    }
    clearLongPressProgress();
  };

  const handlePointerDown = () => {
    clearLongPress();
    longPressTriggeredRef.current = false;
    longPressOverlayDelayRef.current = window.setTimeout(() => {
      setIsPressing(true);
    }, longPressOverlayDelay);
    longPressStartRef.current = null;
    const tick = (timestamp: number) => {
      if (longPressStartRef.current === null) {
        longPressStartRef.current = timestamp;
      }
      const elapsed = timestamp - longPressStartRef.current;
      const progress = Math.min(elapsed / longPressDuration, 1);
      setPressProgress(progress);
      if (progress < 1 && longPressTimeoutRef.current !== null) {
        longPressRafRef.current = window.requestAnimationFrame(tick);
      }
    };
    longPressRafRef.current = window.requestAnimationFrame(tick);
    longPressTimeoutRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setPressProgress(1);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(20);
      }
      data.onLongPress?.(id);
    }, longPressDuration);
  };

  return (
    <div
      className={styles.nodeContent}
      onPointerDown={handlePointerDown}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onPointerCancel={clearLongPress}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={styles.graphHandle}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={styles.graphHandle}
      />
      {data.label}
      <div
        className={`${styles.nodeLongPressOverlay} ${
          isPressing ? styles.nodeLongPressOverlayActive : ""
        }`}
        style={
          {
            "--press-progress": pressProgress,
            "--press-fill": 0.25 + pressProgress * 0.35,
          } as CSSProperties
        }
        aria-hidden="true"
      >
        <Waypoints size={20} className={styles.nodeLongPressIcon} />
        <span className={styles.nodeLongPressText}>Go Deeper</span>
      </div>
    </div>
  );
}
