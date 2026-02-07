import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import type { Ref } from "react";
import EmotionNoteList from "./EmotionNoteList";
import styles from "./EmotionNoteSection.module.css";

type EmotionNoteListSectionProps = {
  title?: string | null;
  notes: EmotionNote[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyHint?: string | null;
  headerRef?: Ref<HTMLDivElement>;
  canGoDeeper?: boolean;
  getDetailHref?: (note: EmotionNote) => string;
  onImportNote?: (note: EmotionNote) => void;
  importingNoteId?: number | null;
};

export default function EmotionNoteListSection({
  title,
  notes,
  isLoading = false,
  emptyTitle,
  emptyHint,
  headerRef,
  canGoDeeper = true,
  getDetailHref,
  onImportNote,
  importingNoteId,
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
        canGoDeeper={canGoDeeper}
        getDetailHref={getDetailHref}
        onImportNote={onImportNote}
        importingNoteId={importingNoteId}
      />
    </div>
  );
}
