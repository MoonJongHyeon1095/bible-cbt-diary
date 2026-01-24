"use client";

import { useLayoutEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import type { EmotionNoteErrorDetail } from "@/lib/types";
import EmotionDetailSectionCard from "./EmotionDetailSectionCard";
import DetailSectionItem from "@/components/emotion-notes/detail/common/DetailSectionItem";
import DetailSectionBadge from "@/components/emotion-notes/detail/common/DetailSectionBadge";
import styles from "./EmotionNoteDetailPage.module.css";

type ErrorDetailSectionProps = {
  details: EmotionNoteErrorDetail[];
  editingErrorId: number | null;
  editingErrorLabel: string;
  editingErrorDescription: string;
  onStartEditing: (detail: EmotionNoteErrorDetail) => void;
  onCancelEditing: () => void;
  onUpdate: (detailId: number) => void;
  onDelete: (detailId: number) => void;
  onChangeEditingErrorDescription: (value: string) => void;
  formatDateTime: (value: string) => string;
  onSelectDetail?: (detailId: number) => void;
  selectedDetailId?: number | null;
  onCopyText?: (text: string) => void;
  onOpenModal?: (title: string, body: string, badgeText?: string | null) => void;
};

export default function ErrorDetailSection({
  details,
  editingErrorId,
  editingErrorLabel,
  editingErrorDescription,
  onStartEditing,
  onCancelEditing,
  onUpdate,
  onDelete,
  onChangeEditingErrorDescription,
  formatDateTime,
  onSelectDetail,
  selectedDetailId,
  onCopyText,
  onOpenModal,
}: ErrorDetailSectionProps) {
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
    if (editingErrorId === null) {
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
  }, [editingErrorDescription, editingErrorId]);

  return (
    <EmotionDetailSectionCard
      className={`${styles.sectionError} ${styles.sectionPastelError}`}
      icon={<AlertCircle size={18} />}
      title="인지 오류"
      hint="왜곡된 생각을 정리하세요"
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
              {editingErrorId === detail.id ? (
                    <div className={styles.detailEdit}>
                      {editingErrorLabel ? (
                        <div className={styles.detailEditBadge}>
                          <DetailSectionBadge text={editingErrorLabel} />
                        </div>
                      ) : null}
                      <textarea
                        ref={editTextareaRef}
                        value={editingErrorDescription}
                        onChange={(event) =>
                          onChangeEditingErrorDescription(event.target.value)
                        }
                        onFocus={resizeEditTextarea}
                        onInput={resizeEditTextarea}
                        rows={2}
                        className={`${styles.textarea} ${styles.autoGrowTextarea}`}
                      />
                    </div>
              ) : (
                <>
                  <DetailSectionItem
                    badgeText={detail.error_label}
                    body={detail.error_description}
                    actions={{
                      copyText: `인지 오류: ${detail.error_label}\n${detail.error_description}`,
                      modalTitle: "인지 오류",
                      modalBody: detail.error_description,
                      modalBadgeText: detail.error_label,
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
