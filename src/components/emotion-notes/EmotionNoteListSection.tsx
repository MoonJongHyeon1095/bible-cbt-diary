import type { EmotionNote } from "@/lib/types/types";
import type { Ref } from "react";
import EmotionNoteList from "./EmotionNoteList";
import styles from "./EmotionNotesSection.module.css";

type EmotionNoteListSectionProps = {
  title?: string | null;
  notes: EmotionNote[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  headerRef?: Ref<HTMLDivElement>;
};

export default function EmotionNoteListSection({
  title,
  notes,
  isLoading = false,
  emptyTitle,
  emptyHint,
  headerRef,
}: EmotionNoteListSectionProps) {
  return (
    <div data-tour="notes-list">
      {title ? (
        <div ref={headerRef} className={styles.notesHeader}>
          <h3 className={styles.notesTitle}>
            {isLoading ? "불러오는 중..." : title}
          </h3>
        </div>
      ) : null}
      <EmotionNoteList
        notes={notes}
        emptyTitle={emptyTitle}
        emptyHint={emptyHint}
      />
    </div>
  );
}
