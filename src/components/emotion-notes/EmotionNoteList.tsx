import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import EmotionNoteCard from "./EmotionNoteCard";
import EmotionNoteEmptyState from "./EmotionNoteEmptyState";
import styles from "./EmotionNoteSection.module.css";

type EmotionNoteListProps = {
  notes: EmotionNote[];
  emptyTitle?: string;
  emptyHint?: string | null;
  showEmptyState?: boolean;
  canGoDeeper?: boolean;
  getDetailHref?: (note: EmotionNote) => string;
  onImportNote?: (note: EmotionNote) => void;
  importingNoteId?: number | null;
};

export default function EmotionNoteList({
  notes,
  emptyTitle,
  emptyHint,
  showEmptyState = true,
  canGoDeeper = true,
  getDetailHref,
  onImportNote,
  importingNoteId,
}: EmotionNoteListProps) {
  if (notes.length === 0) {
    if (!showEmptyState) return null;
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
          onImport={onImportNote}
          isImporting={importingNoteId === note.id}
        />
      ))}
    </div>
  );
}
