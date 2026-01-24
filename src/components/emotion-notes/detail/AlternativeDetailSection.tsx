"use client";

import { useLayoutEffect, useRef } from "react";
import { Lightbulb } from "lucide-react";
import type { EmotionNoteAlternativeDetail } from "@/lib/types";
import EmotionDetailSectionCard from "./EmotionDetailSectionCard";
import DetailSectionItem from "@/components/emotion-notes/detail/common/DetailSectionItem";
import styles from "./EmotionNoteDetailPage.module.css";

type AlternativeDetailSectionProps = {
  details: EmotionNoteAlternativeDetail[];
  editingAlternativeId: number | null;
  editingAlternativeText: string;
  onStartEditing: (detail: EmotionNoteAlternativeDetail) => void;
  onCancelEditing: () => void;
  onUpdate: (detailId: number) => void;
  onDelete: (detailId: number) => void;
  onChangeEditingAlternativeText: (value: string) => void;
  formatDateTime: (value: string) => string;
  onSelectDetail?: (detailId: number) => void;
  selectedDetailId?: number | null;
  onCopyText?: (text: string) => void;
  onOpenModal?: (title: string, body: string, badgeText?: string | null) => void;
};

export default function AlternativeDetailSection({
  details,
  editingAlternativeId,
  editingAlternativeText,
  onStartEditing,
  onCancelEditing,
  onUpdate,
  onDelete,
  onChangeEditingAlternativeText,
  formatDateTime,
  onSelectDetail,
  selectedDetailId,
  onCopyText,
  onOpenModal,
}: AlternativeDetailSectionProps) {
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
    if (editingAlternativeId === null) {
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
  }, [editingAlternativeId, editingAlternativeText]);

  return (
    <EmotionDetailSectionCard
      className={`${styles.sectionAlt} ${styles.sectionPastelAlt}`}
      icon={<Lightbulb size={18} />}
      title="대안 사고"
      hint="새로운 시각을 적어보세요"
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
                  {editingAlternativeId === detail.id ? (
                    <div className={styles.detailEdit}>
                      <textarea
                        ref={editTextareaRef}
                        value={editingAlternativeText}
                        onChange={(event) =>
                          onChangeEditingAlternativeText(event.target.value)
                        }
                        onFocus={resizeEditTextarea}
                        onInput={resizeEditTextarea}
                        rows={2}
                        className={`${styles.textarea} ${styles.autoGrowTextarea}`}
                      />
                    </div>
              ) : (
                <>
                  {null}
                  <DetailSectionItem
                    body={detail.alternative}
                    actions={{
                      copyText: `대안 사고: ${detail.alternative}`,
                      modalTitle: "대안 사고",
                      modalBody: detail.alternative,
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
