"use client";

import { useModalOpen } from "@/components/common/useModalOpen";
import Button from "@/components/ui/Button";
import type { EmotionNote } from "@/lib/types/types";
import styles from "./EmotionGraphSection.module.css";

type EmotionGraphDeepSelectModalProps = {
  isOpen: boolean;
  mainNote: EmotionNote | null;
  selectableNotes: EmotionNote[];
  selectedSubIds: string[];
  canConfirm: boolean;
  onToggleSub: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function EmotionGraphDeepSelectModal({
  isOpen,
  mainNote,
  selectableNotes,
  selectedSubIds,
  canConfirm,
  onToggleSub,
  onClose,
  onConfirm,
}: EmotionGraphDeepSelectModalProps) {
  useModalOpen(isOpen && Boolean(mainNote));

  if (!isOpen || !mainNote) {
    return null;
  }
  const note = mainNote;

  return (
    <div className={styles.deepOverlay} role="dialog" aria-modal="true">
      <div className={styles.deepOverlayCard}>
        <div className={styles.deepOverlayHeader}>
          <div>
            <p className={styles.deepOverlayLabel}>Go Deeper</p>
            <h3 className={styles.deepOverlayTitle}>
              함께 볼 노트를 선택하세요
            </h3>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            닫기
          </Button>
        </div>
        <div className={styles.deepOverlayBody}>
          <div className={styles.deepOverlaySection}>
            <p className={styles.deepOverlaySectionTitle}>Main</p>
            <div className={styles.deepNoteCard}>
              <span className={styles.deepNoteTitle}>
                {note.title || "감정 노트"}
              </span>
              <p className={styles.deepNoteText}>{note.trigger_text}</p>
              <span className={styles.deepNoteMeta}>#{note.id}</span>
            </div>
          </div>
          <div className={styles.deepOverlaySection}>
            <p className={styles.deepOverlaySectionTitle}>
              Sub (최대 2개 선택)
            </p>
            <div className={styles.deepNoteList}>
              {selectableNotes.map((note) => {
                const id = String(note.id);
                const checked = selectedSubIds.includes(id);
                return (
                  <button
                    key={note.id}
                    type="button"
                    className={`${styles.deepNotePick} ${
                      checked ? styles.deepNotePickActive : ""
                    }`}
                    onClick={() => onToggleSub(id)}
                  >
                    <div>
                      <span className={styles.deepNoteTitle}>
                        {note.title || "감정 노트"}
                      </span>
                      <p className={styles.deepNoteText}>{note.trigger_text}</p>
                    </div>
                    <span className={styles.deepNoteMeta}>#{note.id}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className={styles.deepOverlayFooter}>
          <span className={styles.deepOverlayHint}>
            최소 1개, 최대 2개를 선택해주세요.
          </span>
          <Button type="button" onClick={onConfirm} disabled={!canConfirm}>
            Deep Session 시작
          </Button>
        </div>
      </div>
    </div>
  );
}
