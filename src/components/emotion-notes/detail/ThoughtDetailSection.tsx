"use client";

import { useLayoutEffect, useRef } from "react";
import { Brain } from "lucide-react";
import type { EmotionNoteDetail } from "@/lib/types";
import EmotionDetailSectionCard from "./EmotionDetailSectionCard";
import DetailSectionItem from "@/components/common/DetailSectionItem";
import styles from "./EmotionNoteDetailPage.module.css";

type ThoughtDetailSectionProps = {
  details: EmotionNoteDetail[];
  editingThoughtId: number | null;
  editingThoughtText: string;
  editingEmotionText: string;
  onStartEditing: (detail: EmotionNoteDetail) => void;
  onCancelEditing: () => void;
  onUpdate: (detailId: number) => void;
  onDelete: (detailId: number) => void;
  onChangeEditingThoughtText: (value: string) => void;
  onChangeEditingEmotionText: (value: string) => void;
  formatDateTime: (value: string) => string;
  onSelectDetail?: (detailId: number) => void;
  selectedDetailId?: number | null;
  onCopyText?: (text: string) => void;
  onOpenModal?: (title: string, body: string, badgeText?: string | null) => void;
};

export default function ThoughtDetailSection({
  details,
  editingThoughtId,
  editingThoughtText,
  editingEmotionText,
  onStartEditing,
  onCancelEditing,
  onUpdate,
  onDelete,
  onChangeEditingThoughtText,
  onChangeEditingEmotionText,
  formatDateTime,
  onSelectDetail,
  selectedDetailId,
  onCopyText,
  onOpenModal,
}: ThoughtDetailSectionProps) {
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const resizeEditTextarea = () => {
    const element = editTextareaRef.current;
    if (!element) {
      return;
    }
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    if (editingThoughtId === null) {
      return;
    }
    resizeEditTextarea();
    const element = editTextareaRef.current;
    if (!element) {
      return;
    }
    requestAnimationFrame(() => {
      element.focus();
      element.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }, [editingThoughtId, editingThoughtText]);

  return (
    <EmotionDetailSectionCard
      className={`${styles.sectionThought} ${styles.sectionPastelThought}`}
      icon={<Brain size={18} />}
      title="자동 사고"
      hint="떠오른 생각과 감정"
    >
      {null}
      <div className={styles.detailList}>
        {details.length === 0 ? (
          <p className={styles.emptyText}>아직 작성된 내용이 없습니다.</p>
        ) : (
          details.map((detail) => (
            <div
              key={detail.id}
              className={`${styles.detailCard} ${
                selectedDetailId === detail.id ? styles.detailCardSelected : ""
              }`}
              onClick={(event) => {
                event.stopPropagation();
                onSelectDetail?.(detail.id);
              }}
              role={onSelectDetail ? "button" : undefined}
              tabIndex={onSelectDetail ? 0 : undefined}
            >
              {editingThoughtId === detail.id ? (
                    <div className={styles.detailEdit}>
                      <textarea
                        ref={editTextareaRef}
                        value={editingThoughtText}
                        onChange={(event) =>
                          onChangeEditingThoughtText(event.target.value)
                        }
                        onFocus={resizeEditTextarea}
                        onInput={resizeEditTextarea}
                        rows={2}
                        className={`${styles.textarea} ${styles.autoGrowTextarea}`}
                      />
                      <input
                        value={editingEmotionText}
                        onChange={(event) =>
                          onChangeEditingEmotionText(event.target.value)
                        }
                        className={styles.input}
                      />
                    </div>
              ) : (
                <>
                  {null}
                  <DetailSectionItem
                    body={detail.automatic_thought}
                    secondary={`감정: ${detail.emotion}`}
                    actions={{
                      copyText: `자동 사고: ${detail.automatic_thought}\n감정: ${detail.emotion}`,
                      modalTitle: "자동 사고",
                      modalBody: `${detail.automatic_thought}\n\n감정: ${detail.emotion}`,
                      modalBadgeText: null,
                      timeText: formatDateTime(detail.created_at),
                      onCopyText,
                      onOpenModal,
                    }}
                  />
                  {null}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </EmotionDetailSectionCard>
  );
}
