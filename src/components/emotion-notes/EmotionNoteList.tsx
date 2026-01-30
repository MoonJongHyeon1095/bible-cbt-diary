import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import EmotionNoteCard from "./EmotionNoteCard";
import EmotionNoteEmptyState from "./EmotionNoteEmptyState";
import styles from "./EmotionNoteSection.module.css";

type EmotionNoteListProps = {
  notes: EmotionNote[];
  emptyTitle?: string;
  emptyHint?: string;
  canGoDeeper?: boolean;
  getDetailHref?: (note: EmotionNote) => string;
};

export default function EmotionNoteList({
  notes,
  emptyTitle,
  emptyHint,
  canGoDeeper = true,
  getDetailHref,
}: EmotionNoteListProps) {
  if (notes.length === 0) {
    return <EmotionNoteEmptyState title={emptyTitle} hint={emptyHint} />;
  }

  return (
    <div className={styles.noteList}>
      {notes.map((note, index) => (
        <EmotionNoteCard
          key={note.id}
          note={note}
          isTourTarget={index === 0}
          canGoDeeper={canGoDeeper}
          detailHref={getDetailHref?.(note)}
        />
      ))}
    </div>
  );
}
