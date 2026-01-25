"use client";

import { formatKoreanDateTime } from "@/lib/time";
import type { EmotionNote } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect, useRef } from "react";
import styles from "./EmotionNotesSection.module.css";

type EmotionNoteCardProps = {
  note: EmotionNote;
};

export default function EmotionNoteCard({ note }: EmotionNoteCardProps) {
  const router = useRouter();
  const longPressTimeoutRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const timeLabel = formatKoreanDateTime(note.created_at, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const emotionTags = note.emotion_labels ?? [];
  const errorTags = note.error_labels ?? [];
  const behaviorTags = note.behavior_labels ?? [];
  const graphHref = note.group_id
    ? `/graph?groupId=${note.group_id}`
    : `/graph?noteId=${note.id}`;

  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current !== null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  const clearLongPress = () => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handlePointerDown = () => {
    clearLongPress();
    longPressTriggeredRef.current = false;
    longPressTimeoutRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      router.push(graphHref);
    }, 600);
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (longPressTriggeredRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <Link
      href={`/detail/${note.id}`}
      className={styles.noteCard}
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
    </Link>
  );
}
