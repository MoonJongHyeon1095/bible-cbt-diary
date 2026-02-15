"use client";

import EmotionNoteDetailSectionItem from "@/components/emotion-notes/detail/common/EmotionNoteDetailSectionItem";
import type { EmotionNoteDetail } from "@/lib/types/emotionNoteTypes";
import { Brain } from "lucide-react";
import EmotionNoteDetailSectionCard from "./EmotionNoteDetailSectionCard";
import styles from "./EmotionNoteDetailPage.module.css";

type EmotionNoteThoughtDetailSectionProps = {
  details: EmotionNoteDetail[];
  formatDateTime: (value: string) => string;
  onCopyText?: (text: string) => void;
  onOpenModal?: (
    title: string,
    body: string,
    badgeText?: string | null,
  ) => void;
};

export default function EmotionNoteThoughtDetailSection(props: EmotionNoteThoughtDetailSectionProps) {
  const {
    details,
    formatDateTime,
    onCopyText,
    onOpenModal,
  } = props;

  return (
    <EmotionNoteDetailSectionCard
      className={`${styles.sectionThought} ${styles.sectionPastelThought}`}
      icon={<Brain size={18} />}
      title="자동 사고"
      hint="떠오른 생각과 감정"
    >
      {null}
      <div className={styles.detailList}>
        {details.length === 0 ? (
          <p className={styles.emptyText}>아직 작성된 내용이 없습니다.</p>
        ) : (
          details.map((detail) => (
            <div
              key={detail.id}
              className={styles.detailCard}
            >
              <EmotionNoteDetailSectionItem
                badgeText={detail.emotion}
                body={detail.automatic_thought}
                actions={{
                  copyText: `자동 사고: ${detail.automatic_thought}\n감정: ${detail.emotion}`,
                  modalTitle: "자동 사고",
                  modalBody: detail.automatic_thought,
                  modalBadgeText: `${detail.emotion}`,
                  timeText: formatDateTime(detail.created_at),
                  onCopyText,
                  onOpenModal,
                }}
              />
            </div>
          ))
        )}
      </div>
    </EmotionNoteDetailSectionCard>
  );
}
