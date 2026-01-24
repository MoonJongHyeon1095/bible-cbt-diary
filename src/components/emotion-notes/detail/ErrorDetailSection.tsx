"use client";

import { AlertCircle } from "lucide-react";
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
}: ErrorDetailSectionProps) {
  return (
    <EmotionDetailSectionCard
      className={`${styles.sectionError} ${styles.sectionPastelError}`}
      icon={<AlertCircle size={18} />}
      title="인지 오류"
      hint="왜곡된 생각을 정리하세요"
    >
      <div className={styles.sectionForm}>
        <input
          value={errorLabel}
          onChange={(event) => onChangeErrorLabel(event.target.value)}
          placeholder="오류 이름"
          className={styles.input}
          disabled={!noteId}
        />
        <textarea
          value={errorDescription}
          onChange={(event) => onChangeErrorDescription(event.target.value)}
          rows={2}
          placeholder="어떤 오류인지 설명"
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
            인지 오류 추가
          </button>
        </div>
      ) : null}
      <div className={styles.detailList}>
        {details.length === 0 ? (
          <p className={styles.emptyText}>아직 작성된 내용이 없습니다.</p>
        ) : (
          details.map((detail) => (
            <div key={detail.id} className={styles.detailCard}>
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
                    rows={2}
                    className={styles.textarea}
                  />
                  <div className={styles.detailActions}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => onUpdate(detail.id)}
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={onCancelEditing}
                    >
                      취소
                    </button>
                  </div>
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
                  <div className={styles.detailActions}>
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={() => onStartEditing(detail)}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => onDelete(detail.id)}
                    >
                      삭제
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
