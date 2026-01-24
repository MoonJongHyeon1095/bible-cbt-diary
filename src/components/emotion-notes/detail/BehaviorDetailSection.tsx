"use client";

import { Footprints } from "lucide-react";
import type { EmotionNoteBehaviorDetail } from "@/lib/types";
import EmotionDetailSectionCard from "./EmotionDetailSectionCard";
import styles from "./EmotionNoteDetailPage.module.css";

type BehaviorDetailSectionProps = {
  noteId?: number | null;
  behaviorLabel: string;
  behaviorDescription: string;
  details: EmotionNoteBehaviorDetail[];
  editingBehaviorId: number | null;
  editingBehaviorLabel: string;
  editingBehaviorDescription: string;
  onChangeBehaviorLabel: (value: string) => void;
  onChangeBehaviorDescription: (value: string) => void;
  onAdd: () => void;
  onStartEditing: (detail: EmotionNoteBehaviorDetail) => void;
  onCancelEditing: () => void;
  onUpdate: (detailId: number) => void;
  onDelete: (detailId: number) => void;
  onChangeEditingBehaviorLabel: (value: string) => void;
  onChangeEditingBehaviorDescription: (value: string) => void;
  formatDateTime: (value: string) => string;
  showAddButton?: boolean;
};

export default function BehaviorDetailSection({
  noteId,
  behaviorLabel,
  behaviorDescription,
  details,
  editingBehaviorId,
  editingBehaviorLabel,
  editingBehaviorDescription,
  onChangeBehaviorLabel,
  onChangeBehaviorDescription,
  onAdd,
  onStartEditing,
  onCancelEditing,
  onUpdate,
  onDelete,
  onChangeEditingBehaviorLabel,
  onChangeEditingBehaviorDescription,
  formatDateTime,
  showAddButton = true,
}: BehaviorDetailSectionProps) {
  return (
    <EmotionDetailSectionCard
      className={`${styles.sectionBehavior} ${styles.sectionPastelBehavior}`}
      icon={<Footprints size={18} />}
      title="행동 반응"
      hint="실제 행동을 기록하세요"
    >
      <div className={styles.sectionForm}>
        <input
          value={behaviorLabel}
          onChange={(event) => onChangeBehaviorLabel(event.target.value)}
          placeholder="행동 이름"
          className={styles.input}
          disabled={!noteId}
        />
        <textarea
          value={behaviorDescription}
          onChange={(event) => onChangeBehaviorDescription(event.target.value)}
          rows={2}
          placeholder="어떤 행동이었나요?"
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
            행동 반응 추가
          </button>
        </div>
      ) : null}
      <div className={styles.detailList}>
        {details.length === 0 ? (
          <p className={styles.emptyText}>아직 작성된 내용이 없습니다.</p>
        ) : (
          details.map((detail) => (
            <div key={detail.id} className={styles.detailCard}>
              {editingBehaviorId === detail.id ? (
                <div className={styles.detailEdit}>
                  <input
                    value={editingBehaviorLabel}
                    onChange={(event) =>
                      onChangeEditingBehaviorLabel(event.target.value)
                    }
                    className={styles.input}
                  />
                  <textarea
                    value={editingBehaviorDescription}
                    onChange={(event) =>
                      onChangeEditingBehaviorDescription(event.target.value)
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
                    <span className={styles.detailTag}>행동 반응</span>
                    <span className={styles.detailTime}>
                      {formatDateTime(detail.created_at)}
                    </span>
                  </div>
                  <p className={styles.detailText}>{detail.behavior_label}</p>
                  <p className={styles.detailEmotion}>
                    {detail.behavior_description}
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
