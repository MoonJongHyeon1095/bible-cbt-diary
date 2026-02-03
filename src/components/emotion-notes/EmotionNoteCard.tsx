"use client";

import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { Lock, Waypoints } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CSSProperties, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./EmotionNoteSection.module.css";
import { useAuthModal } from "@/components/header/AuthModalProvider";

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
  const longPressOverlayHoldRef = useRef<number | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const { checkUsage } = useAiUsageGuard({ enabled: false, cache: true });
  const { openAuthModal } = useAuthModal();

  const longPressDuration = 800;
  const longPressOverlayDelay = 120;
  const timeLabel = formatKoreanDateTime(note.created_at, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const emotionTags = note.emotion_labels ?? [];
  const errorTags = note.error_labels ?? [];
  const behaviorTags = note.behavior_labels ?? [];
  const groupId = note.group_id ?? null;
  const graphHref = groupId
    ? `/graph?groupId=${groupId}&noteId=${note.id}`
    : `/session/deep?mainId=${note.id}`;

  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current !== null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }
      if (longPressOverlayDelayRef.current !== null) {
        window.clearTimeout(longPressOverlayDelayRef.current);
      }
      if (longPressOverlayHoldRef.current !== null) {
        window.clearTimeout(longPressOverlayHoldRef.current);
      }
      if (longPressRafRef.current !== null) {
        window.cancelAnimationFrame(longPressRafRef.current);
      }
    };
  }, []);

  const clearLongPressProgress = (hold = true) => {
    if (longPressRafRef.current !== null) {
      window.cancelAnimationFrame(longPressRafRef.current);
      longPressRafRef.current = null;
    }
    longPressStartRef.current = null;
    if (longPressOverlayHoldRef.current !== null) {
      window.clearTimeout(longPressOverlayHoldRef.current);
    }
    if (!hold) {
      setPressProgress(0);
      setIsPressing(false);
      return;
    }
    longPressOverlayHoldRef.current = window.setTimeout(() => {
      setPressProgress(0);
      setIsPressing(false);
    }, 220);
  };

  const clearLongPress = (hold = true) => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    if (longPressOverlayDelayRef.current !== null) {
      window.clearTimeout(longPressOverlayDelayRef.current);
      longPressOverlayDelayRef.current = null;
    }
    clearLongPressProgress(hold);
  };

  const handlePointerDown = () => {
    clearLongPress(false);
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
        openAuthModal();
        return;
      }
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(20);
      }
      const go = async () => {
        const allowed = await checkUsage();
        if (!allowed) {
          return;
        }
        router.push(graphHref);
      };
      void go();
    }, longPressDuration);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (longPressTriggeredRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    router.push(resolvedDetailHref);
  };

  const resolvedDetailHref = detailHref ?? `/detail?id=${note.id}`;

  return (
    <button
      type="button"
      className={styles.noteCard}
      data-tour={isTourTarget ? "note-card" : undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={() => clearLongPress()}
      onPointerLeave={() => clearLongPress()}
      onPointerCancel={() => clearLongPress()}
      onClick={handleClick}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className={styles.noteHeader}>
        <h4 className={styles.noteTitle}>{note.title}</h4>
        <div className={styles.noteMeta}>
          {groupId && (
            <span className={styles.groupBadge}>
              <Waypoints size={12} className={styles.groupBadgeIcon} />
              그룹 {groupId}
            </span>
          )}
          <span className={styles.noteTime}>{timeLabel}</span>
        </div>
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
    </button>
  );
}
