import EmotionNoteCard from "./EmotionNoteCard";
import EmotionNoteEmptyState from "./EmotionNoteEmptyState";
import styles from "./EmotionNotesSection.module.css";
import type { EmotionNote } from "@/lib/types";

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
      {notes.map((note) => (
        <EmotionNoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
