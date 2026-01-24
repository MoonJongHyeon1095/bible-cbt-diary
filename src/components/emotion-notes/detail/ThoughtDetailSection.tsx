"use client";

import { Brain, Pencil, Trash2 } from "lucide-react";
import type { EmotionNoteDetail } from "@/lib/types";
import EmotionDetailSectionCard from "./EmotionDetailSectionCard";
import styles from "./EmotionNoteDetailPage.module.css";

type ThoughtDetailSectionProps = {
  noteId?: number | null;
  detailThought: string;
  detailEmotion: string;
  details: EmotionNoteDetail[];
  editingThoughtId: number | null;
  editingThoughtText: string;
  editingEmotionText: string;
  onChangeDetailThought: (value: string) => void;
  onChangeDetailEmotion: (value: string) => void;
  onAdd: () => void;
  onStartEditing: (detail: EmotionNoteDetail) => void;
  onCancelEditing: () => void;
  onUpdate: (detailId: number) => void;
  onDelete: (detailId: number) => void;
  onChangeEditingThoughtText: (value: string) => void;
  onChangeEditingEmotionText: (value: string) => void;
  formatDateTime: (value: string) => string;
  showAddButton?: boolean;
  onSelectDetail?: (detailId: number) => void;
  selectedDetailId?: number | null;
};

export default function ThoughtDetailSection({
  noteId,
  detailThought,
  detailEmotion,
  details,
  editingThoughtId,
  editingThoughtText,
  editingEmotionText,
  onChangeDetailThought,
  onChangeDetailEmotion,
  onAdd,
  onStartEditing,
  onCancelEditing,
  onUpdate,
  onDelete,
  onChangeEditingThoughtText,
  onChangeEditingEmotionText,
  formatDateTime,
  showAddButton = true,
  onSelectDetail,
  selectedDetailId,
}: ThoughtDetailSectionProps) {
  return (
    <EmotionDetailSectionCard
      className={`${styles.sectionThought} ${styles.sectionPastelThought}`}
      icon={<Brain size={18} />}
      title="자동 사고"
      hint="떠오른 생각과 감정"
    >
      <div className={styles.sectionForm}>
        <input
          value={detailThought}
          onChange={(event) => onChangeDetailThought(event.target.value)}
          placeholder="떠오른 생각을 적어주세요"
          className={styles.input}
          disabled={!noteId}
        />
        <input
          value={detailEmotion}
          onChange={(event) => onChangeDetailEmotion(event.target.value)}
          placeholder="감정을 적어주세요"
          className={styles.input}
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
            자동 사고 추가
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
              {editingThoughtId === detail.id ? (
                    <div className={styles.detailEdit}>
                      <textarea
                        value={editingThoughtText}
                        onChange={(event) =>
                          onChangeEditingThoughtText(event.target.value)
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
                  <div className={styles.detailHeader}>
                    <span className={styles.detailTag}>{detail.emotion}</span>
                    <span className={styles.detailTime}>
                      {formatDateTime(detail.created_at)}
                    </span>
                  </div>
                  <p className={styles.detailText}>{detail.automatic_thought}</p>
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
