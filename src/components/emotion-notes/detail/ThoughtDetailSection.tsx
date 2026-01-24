"use client";

import { Brain } from "lucide-react";
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
            <div key={detail.id} className={styles.detailCard}>
              {editingThoughtId === detail.id ? (
                <div className={styles.detailEdit}>
                  <input
                    value={editingThoughtText}
                    onChange={(event) =>
                      onChangeEditingThoughtText(event.target.value)
                    }
                    className={styles.input}
                  />
                  <input
                    value={editingEmotionText}
                    onChange={(event) =>
                      onChangeEditingEmotionText(event.target.value)
                    }
                    className={styles.input}
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
                    <span className={styles.detailTag}>자동 사고</span>
                    <span className={styles.detailTime}>
                      {formatDateTime(detail.created_at)}
                    </span>
                  </div>
                  <p className={styles.detailText}>{detail.automatic_thought}</p>
                  <p className={styles.detailEmotion}>
                    감정: {detail.emotion}
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
