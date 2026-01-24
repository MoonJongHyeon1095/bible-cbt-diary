"use client";

import { Copy, Lightbulb, Maximize2 } from "lucide-react";
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
  onCopyText?: (text: string) => void;
  onOpenModal?: (title: string, body: string) => void;
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
  onCopyText,
  onOpenModal,
}: AlternativeDetailSectionProps) {
  return (
    <EmotionDetailSectionCard
      className={`${styles.sectionAlt} ${styles.sectionPastelAlt}`}
      icon={<Lightbulb size={18} />}
      title="대안 사고"
      hint="새로운 시각을 적어보세요"
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
                  <div className={styles.detailFooter}>
                    <button
                      type="button"
                      className={styles.miniIconButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        onCopyText?.(`대안 사고: ${detail.alternative}`);
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
                        onOpenModal?.("대안 사고", detail.alternative);
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
