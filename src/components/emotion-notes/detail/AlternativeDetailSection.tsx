"use client";

import { Lightbulb, Pencil, Trash2 } from "lucide-react";
import type { EmotionNoteAlternativeDetail } from "@/lib/types";
import EmotionDetailSectionCard from "./EmotionDetailSectionCard";
import styles from "./EmotionNoteDetailPage.module.css";

type AlternativeDetailSectionProps = {
  noteId?: number | null;
  alternativeText: string;
  details: EmotionNoteAlternativeDetail[];
  editingAlternativeId: number | null;
  editingAlternativeText: string;
  onChangeAlternativeText: (value: string) => void;
  onAdd: () => void;
  onStartEditing: (detail: EmotionNoteAlternativeDetail) => void;
  onCancelEditing: () => void;
  onUpdate: (detailId: number) => void;
  onDelete: (detailId: number) => void;
  onChangeEditingAlternativeText: (value: string) => void;
  formatDateTime: (value: string) => string;
  showAddButton?: boolean;
  onSelectDetail?: (detailId: number) => void;
  selectedDetailId?: number | null;
};

export default function AlternativeDetailSection({
  noteId,
  alternativeText,
  details,
  editingAlternativeId,
  editingAlternativeText,
  onChangeAlternativeText,
  onAdd,
  onStartEditing,
  onCancelEditing,
  onUpdate,
  onDelete,
  onChangeEditingAlternativeText,
  formatDateTime,
  showAddButton = true,
  onSelectDetail,
  selectedDetailId,
}: AlternativeDetailSectionProps) {
  return (
    <EmotionDetailSectionCard
      className={`${styles.sectionAlt} ${styles.sectionPastelAlt}`}
      icon={<Lightbulb size={18} />}
      title="대안 사고"
      hint="새로운 시각을 적어보세요"
    >
      <div className={styles.sectionForm}>
        <textarea
          value={alternativeText}
          onChange={(event) => onChangeAlternativeText(event.target.value)}
          rows={2}
          placeholder="더 균형 잡힌 생각"
          className={styles.textarea}
          disabled={!noteId}
        />
      </div>
      {showAddButton ? (
        <div className={styles.sectionActions}>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={onAdd}
            disabled={!noteId}
          >
            대안 사고 추가
          </button>
        </div>
      ) : null}
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
              onClick={() => onSelectDetail?.(detail.id)}
              role={onSelectDetail ? "button" : undefined}
              tabIndex={onSelectDetail ? 0 : undefined}
            >
              {editingAlternativeId === detail.id ? (
                    <div className={styles.detailEdit}>
                      <textarea
                        value={editingAlternativeText}
                        onChange={(event) =>
                          onChangeEditingAlternativeText(event.target.value)
                        }
                        onFocus={(event) => {
                          const element = event.currentTarget;
                          element.style.height = "auto";
                          element.style.height = `${element.scrollHeight}px`;
                        }}
                        onInput={(event) => {
                          const element = event.currentTarget;
                          element.style.height = "auto";
                          element.style.height = `${element.scrollHeight}px`;
                        }}
                        rows={2}
                        className={`${styles.textarea} ${styles.autoGrowTextarea}`}
                      />
                    </div>
              ) : (
                <>
                  <div className={styles.detailHeader}>
                    <span className={styles.detailTag}>대안 사고</span>
                    <span className={styles.detailTime}>
                      {formatDateTime(detail.created_at)}
                    </span>
                  </div>
                  <p className={styles.detailText}>{detail.alternative}</p>
                  <div className={styles.detailActions}>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        onStartEditing(detail);
                      }}
                      aria-label="수정"
                    >
                      <Pencil size={16} />
                      <span className={styles.srOnly}>수정</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.iconDanger}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(detail.id);
                      }}
                      aria-label="삭제"
                    >
                      <Trash2 size={16} />
                      <span className={styles.srOnly}>삭제</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </EmotionDetailSectionCard>
  );
}
