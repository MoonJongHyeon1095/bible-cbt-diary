"use client";

import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import styles from "./EmotionNoteSection.module.css";
import SafeButton from "@/components/ui/SafeButton";
import EmotionNoteCardOverlay from "./EmotionNoteCardOverlay";

type EmotionNoteCardProps = {
  note: EmotionNote;
  isTourTarget?: boolean;
  canGoDeeper?: boolean;
  detailHref?: string;
  onImport?: (note: EmotionNote) => void;
  isImporting?: boolean;
};

export default function EmotionNoteCard({
  note,
  isTourTarget = false,
  canGoDeeper = true,
  detailHref,
  onImport,
  isImporting = false,
}: EmotionNoteCardProps) {
  const router = useRouter();
  void canGoDeeper;
  const isImportMode = Boolean(onImport);

  const timeLabel = formatKoreanDateTime(note.created_at, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const emotionTags = note.emotion_labels ?? [];
  const errorTags = note.error_labels ?? [];
  const sdtTags = note.sdt_labels ?? [];

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (isImportMode) {
      event.preventDefault();
      event.stopPropagation();
      if (!isImporting) {
        onImport?.(note);
      }
      return;
    }
    router.push(resolvedDetailHref);
  };

  const resolvedDetailHref = detailHref ?? `/detail?id=${note.id}`;

  return (
    <SafeButton
      mode="native"
      type="button"
      className={styles.noteCard}
      data-tour={isTourTarget ? "note-card" : undefined}
      onClick={handleClick}
    >
      <div className={styles.noteHeader}>
        <h4 className={styles.noteTitle}>{note.title}</h4>
        <div className={styles.noteMeta}>
          <span className={styles.noteTime}>{timeLabel}</span>
        </div>
      </div>
      {(emotionTags.length > 0 || errorTags.length > 0 || sdtTags.length > 0) && (
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
          {sdtTags.map((tag) => (
            <span key={`sdt-${tag}`} className={styles.tagError}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className={styles.noteTrigger}>{note.trigger_text}</p>
      {isImportMode ? (
        <EmotionNoteCardOverlay
          mode="import"
          isActive={isImporting}
          isLoading={isImporting}
        />
      ) : null}
    </SafeButton>
  );
}
