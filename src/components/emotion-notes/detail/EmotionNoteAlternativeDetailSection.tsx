"use client";

import EmotionNoteDetailSectionItem from "@/components/emotion-notes/detail/common/EmotionNoteDetailSectionItem";
import type { EmotionNoteAlternativeDetail } from "@/lib/types/emotionNoteTypes";
import { Lightbulb } from "lucide-react";
import styles from "./EmotionNoteDetailPage.module.css";
import EmotionNoteDetailSectionCard from "./EmotionNoteDetailSectionCard";

type EmotionNoteAlternativeDetailSectionProps = {
  details: EmotionNoteAlternativeDetail[];
  formatDateTime: (value: string) => string;
  onCopyText?: (text: string) => void;
  onOpenModal?: (
    title: string,
    body: string,
    badgeText?: string | null,
  ) => void;
};

export default function EmotionNoteAlternativeDetailSection(
  props: EmotionNoteAlternativeDetailSectionProps,
) {
  const {
    details,
    formatDateTime,
    onCopyText,
    onOpenModal,
  } = props;

  return (
    <EmotionNoteDetailSectionCard
      className={`${styles.sectionAlt} ${styles.sectionPastelAlt}`}
      icon={<Lightbulb size={18} />}
      title="대안 사고"
      hint="새로운 시각의 기록"
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
                body={detail.alternative}
                actions={{
                  copyText: `대안 사고: ${detail.alternative}`,
                  modalTitle: "대안 사고",
                  modalBody: detail.alternative,
                  modalBadgeText: null,
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
