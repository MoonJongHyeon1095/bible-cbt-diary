"use client";

import type { EmotionNote } from "@/lib/types/types";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { Lock, Waypoints } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./EmotionNotesSection.module.css";

type EmotionNoteCardProps = {
  note: EmotionNote;
  isTourTarget?: boolean;
  canGoDeeper?: boolean;
  detailHref?: string;
};

export default function EmotionNoteCard({
  note,
  isTourTarget = false,
  canGoDeeper = true,
  detailHref,
}: EmotionNoteCardProps) {
  const router = useRouter();
  const longPressTimeoutRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const longPressStartRef = useRef<number | null>(null);
  const longPressRafRef = useRef<number | null>(null);
  const longPressOverlayDelayRef = useRef<number | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);

  const longPressDuration = 800;
  const longPressOverlayDelay = 120;
  const timeLabel = formatKoreanDateTime(note.created_at, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const emotionTags = note.emotion_labels ?? [];
  const errorTags = note.error_labels ?? [];
  const behaviorTags = note.behavior_labels ?? [];
  const graphHref = note.group_id
    ? `/graph?groupId=${note.group_id}&noteId=${note.id}`
    : `/session/deep?mainId=${note.id}`;

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
      if (!canGoDeeper) {
        return;
      }
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(20);
      }
      router.push(graphHref);
    }, longPressDuration);
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (longPressTriggeredRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const resolvedDetailHref = detailHref ?? `/detail/${note.id}`;

  return (
    <Link
      href={resolvedDetailHref}
      className={styles.noteCard}
      data-tour={isTourTarget ? "note-card" : undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onPointerCancel={clearLongPress}
      onClick={handleClick}
    >
      <div className={styles.noteHeader}>
        <h4 className={styles.noteTitle}>{note.title}</h4>
        <span className={styles.noteTime}>{timeLabel}</span>
      </div>
      {(emotionTags.length > 0 ||
        errorTags.length > 0 ||
        behaviorTags.length > 0) && (
        <div className={styles.noteTags}>
          {emotionTags.map((tag) => (
            <span key={`emotion-${tag}`} className={styles.tagEmotion}>
              {tag}
            </span>
          ))}
          {errorTags.map((tag) => (
            <span key={`error-${tag}`} className={styles.tagError}>
              {tag}
            </span>
          ))}
          {behaviorTags.map((tag) => (
            <span key={`behavior-${tag}`} className={styles.tagBehavior}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className={styles.noteTrigger}>{note.trigger_text}</p>
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
            <Waypoints size={22} className={styles.longPressIcon} />
            <span className={styles.longPressText}>Go Deeper</span>
          </>
        ) : (
          <>
            <Lock size={20} className={styles.longPressIcon} />
            <span className={styles.longPressText}>로그인이 필요합니다</span>
          </>
        )}
      </div>
    </Link>
  );
}
