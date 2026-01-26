import type { EmotionNote } from "@/lib/types/types";
import EmotionNoteCard from "./EmotionNoteCard";
import EmotionNoteEmptyState from "./EmotionNoteEmptyState";
import styles from "./EmotionNotesSection.module.css";

type EmotionNoteListProps = {
  notes: EmotionNote[];
  emptyTitle?: string;
  emptyHint?: string;
};

export default function EmotionNoteList({
  notes,
  emptyTitle,
  emptyHint,
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
        />
      ))}
    </div>
  );
}
