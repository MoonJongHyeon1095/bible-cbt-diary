import styles from "./EmotionNotesSection.module.css";
import type { EmotionNote } from "@/lib/types";

type EmotionNoteCardProps = {
  note: EmotionNote;
};

export default function EmotionNoteCard({ note }: EmotionNoteCardProps) {
  const timeLabel = new Date(note.created_at).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className={styles.noteCard}>
      <div className={styles.noteHeader}>
        <h4 className={styles.noteTitle}>{note.title}</h4>
        <span className={styles.noteTime}>{timeLabel}</span>
      </div>
      <p className={styles.noteTrigger}>{note.trigger_text}</p>
      {note.behavior ? (
        <p className={styles.noteBehavior}>반응: {note.behavior}</p>
      ) : null}
      <div className={styles.noteMeta}>
        <span>빈도 {note.frequency}</span>
      </div>
    </article>
  );
}
