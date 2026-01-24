import EmotionNoteCard from "./EmotionNoteCard";
import EmotionNoteEmptyState from "./EmotionNoteEmptyState";
import styles from "./EmotionNotesSection.module.css";
import type { EmotionNote } from "@/lib/types";

type EmotionNoteListProps = {
  notes: EmotionNote[];
};

export default function EmotionNoteList({ notes }: EmotionNoteListProps) {
  if (notes.length === 0) {
    return <EmotionNoteEmptyState />;
  }

  return (
    <div className={styles.noteList}>
      {notes.map((note) => (
        <EmotionNoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
