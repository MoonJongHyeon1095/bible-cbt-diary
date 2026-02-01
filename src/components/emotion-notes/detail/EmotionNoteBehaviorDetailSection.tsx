"use client";

import EmotionNoteDetailSectionBadge from "@/components/emotion-notes/detail/common/EmotionNoteDetailSectionBadge";
import EmotionNoteDetailSectionItem from "@/components/emotion-notes/detail/common/EmotionNoteDetailSectionItem";
import type { EmotionNoteBehaviorDetail } from "@/lib/types/emotionNoteTypes";
import { Footprints } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import styles from "./EmotionNoteDetailPage.module.css";
import EmotionNoteDetailSectionCard from "./EmotionNoteDetailSectionCard";

type EmotionNoteBehaviorDetailSectionProps = {
  details: EmotionNoteBehaviorDetail[];
  editingBehaviorId: number | null;
  editingBehaviorLabel: string;
  editingBehaviorDescription: string;
  onStartEditing: (detail: EmotionNoteBehaviorDetail) => void;
  onCancelEditing: () => void;
  onUpdate: (detailId: number) => void;
  onDelete: (detailId: number) => void;
  onChangeEditingBehaviorDescription: (value: string) => void;
  formatDateTime: (value: string) => string;
  onSelectDetail?: (detailId: number) => void;
  selectedDetailId?: number | null;
  onCopyText?: (text: string) => void;
  onOpenModal?: (
    title: string,
    body: string,
    badgeText?: string | null,
  ) => void;
};

export default function EmotionNoteBehaviorDetailSection(
  props: EmotionNoteBehaviorDetailSectionProps,
) {
  const {
    details,
    editingBehaviorId,
    editingBehaviorLabel,
    editingBehaviorDescription,
    onChangeEditingBehaviorDescription,
    formatDateTime,
    onSelectDetail,
    selectedDetailId,
    onCopyText,
    onOpenModal,
  } = props;
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
    if (editingBehaviorId === null) {
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
  }, [editingBehaviorDescription, editingBehaviorId]);

  return (
    <EmotionNoteDetailSectionCard
      className={`${styles.sectionBehavior} ${styles.sectionPastelBehavior}`}
      icon={<Footprints size={18} />}
      title="행동 반응"
      hint="실제 행동의 기록"
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
              {editingBehaviorId === detail.id ? (
                <div className={styles.detailEdit}>
                  {editingBehaviorLabel ? (
                    <div className={styles.detailEditBadge}>
                      <EmotionNoteDetailSectionBadge
                        text={editingBehaviorLabel}
                      />
                    </div>
                  ) : null}
                  <textarea
                    ref={editTextareaRef}
                    value={editingBehaviorDescription}
                    onChange={(event) =>
                      onChangeEditingBehaviorDescription(event.target.value)
                    }
                    onFocus={resizeEditTextarea}
                    onInput={resizeEditTextarea}
                    rows={2}
                    className={`${styles.textarea} ${styles.autoGrowTextarea}`}
                  />
                </div>
              ) : (
                <>
                  <EmotionNoteDetailSectionItem
                    badgeText={detail.behavior_label}
                    body={detail.behavior_description}
                    actions={{
                      copyText: `행동 반응: ${detail.behavior_label}\n${detail.behavior_description}`,
                      modalTitle: "행동 반응",
                      modalBody: detail.behavior_description,
                      modalBadgeText: detail.behavior_label,
                      timeText: formatDateTime(detail.created_at),
                      onCopyText,
                      onOpenModal,
                    }}
                  />
                  {detail.error_tags && detail.error_tags.length > 0 ? (
                    <div className={styles.detailTagList}>
                      {detail.error_tags.map((tag) => (
                        <span
                          key={`${detail.id}-${tag}`}
                          className={styles.detailErrorTag}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {null}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </EmotionNoteDetailSectionCard>
  );
}
