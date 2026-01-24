import EmotionNoteList from "./EmotionNoteList";
import styles from "./EmotionNotesSection.module.css";
import type { EmotionNote } from "@/lib/types";

type EmotionNoteListSectionProps = {
  title: string;
  notes: EmotionNote[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
};

export default function EmotionNoteListSection({
  title,
  notes,
  isLoading = false,
  emptyTitle,
  emptyHint,
}: EmotionNoteListSectionProps) {
  return (
    <div>
      <div className={styles.notesHeader}>
        <h3 className={styles.notesTitle}>
          {isLoading ? "불러오는 중..." : title}
        </h3>
      </div>
      <EmotionNoteList
        notes={notes}
        emptyTitle={emptyTitle}
        emptyHint={emptyHint}
      />
    </div>
  );
}
