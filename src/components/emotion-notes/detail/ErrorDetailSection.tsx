"use client";

import { AlertCircle, Copy, Maximize2 } from "lucide-react";
import type { EmotionNoteErrorDetail } from "@/lib/types";
import EmotionDetailSectionCard from "./EmotionDetailSectionCard";
import styles from "./EmotionNoteDetailPage.module.css";

type ErrorDetailSectionProps = {
  noteId?: number | null;
  errorLabel: string;
  errorDescription: string;
  details: EmotionNoteErrorDetail[];
  editingErrorId: number | null;
  editingErrorLabel: string;
  editingErrorDescription: string;
  onChangeErrorLabel: (value: string) => void;
  onChangeErrorDescription: (value: string) => void;
  onAdd: () => void;
  onStartEditing: (detail: EmotionNoteErrorDetail) => void;
  onCancelEditing: () => void;
  onUpdate: (detailId: number) => void;
  onDelete: (detailId: number) => void;
  onChangeEditingErrorLabel: (value: string) => void;
  onChangeEditingErrorDescription: (value: string) => void;
  formatDateTime: (value: string) => string;
  showAddButton?: boolean;
  onSelectDetail?: (detailId: number) => void;
  selectedDetailId?: number | null;
  onCopyText?: (text: string) => void;
  onOpenModal?: (title: string, body: string) => void;
};

export default function ErrorDetailSection({
  noteId,
  errorLabel,
  errorDescription,
  details,
  editingErrorId,
  editingErrorLabel,
  editingErrorDescription,
  onChangeErrorLabel,
  onChangeErrorDescription,
  onAdd,
  onStartEditing,
  onCancelEditing,
  onUpdate,
  onDelete,
  onChangeEditingErrorLabel,
  onChangeEditingErrorDescription,
  formatDateTime,
  showAddButton = true,
  onSelectDetail,
  selectedDetailId,
  onCopyText,
  onOpenModal,
}: ErrorDetailSectionProps) {
  return (
    <EmotionDetailSectionCard
      className={`${styles.sectionError} ${styles.sectionPastelError}`}
      icon={<AlertCircle size={18} />}
      title="인지 오류"
      hint="왜곡된 생각을 정리하세요"
    >
      {null}
      {showAddButton ? (
        <div className={styles.sectionActions}>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={onAdd}
            disabled={!noteId}
          >
            인지 오류 추가
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
              {editingErrorId === detail.id ? (
                    <div className={styles.detailEdit}>
                      <input
                        value={editingErrorLabel}
                        onChange={(event) =>
                          onChangeEditingErrorLabel(event.target.value)
                        }
                        className={styles.input}
                      />
                      <textarea
                        value={editingErrorDescription}
                        onChange={(event) =>
                          onChangeEditingErrorDescription(event.target.value)
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
                    <span className={styles.detailTag}>인지 오류</span>
                    <span className={styles.detailTime}>
                      {formatDateTime(detail.created_at)}
                    </span>
                  </div>
                  <p className={styles.detailText}>{detail.error_label}</p>
                  <p className={styles.detailEmotion}>
                    {detail.error_description}
                  </p>
                  <div className={styles.detailFooter}>
                    <button
                      type="button"
                      className={styles.miniIconButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        onCopyText?.(
                          `인지 오류: ${detail.error_label}\n${detail.error_description}`,
                        );
                      }}
                      aria-label="복사"
                    >
                      <Copy size={16} />
                      <span className={styles.srOnly}>복사</span>
                    </button>
                    <button
                      type="button"
                      className={styles.miniIconButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenModal?.(
                          "인지 오류",
                          `${detail.error_label}\n\n${detail.error_description}`,
                        );
                      }}
                      aria-label="확대"
                    >
                      <Maximize2 size={16} />
                      <span className={styles.srOnly}>확대</span>
                    </button>
                  </div>
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
