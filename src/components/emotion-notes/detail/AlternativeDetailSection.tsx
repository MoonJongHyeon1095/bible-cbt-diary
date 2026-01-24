"use client";

import { Lightbulb } from "lucide-react";
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
            <div key={detail.id} className={styles.detailCard}>
              {editingAlternativeId === detail.id ? (
                <div className={styles.detailEdit}>
                  <textarea
                    value={editingAlternativeText}
                    onChange={(event) =>
                      onChangeEditingAlternativeText(event.target.value)
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
                    <span className={styles.detailTag}>대안 사고</span>
                    <span className={styles.detailTime}>
                      {formatDateTime(detail.created_at)}
                    </span>
                  </div>
                  <p className={styles.detailText}>{detail.alternative}</p>
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
