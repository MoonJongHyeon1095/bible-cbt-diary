"use client";

import EmotionNoteDetailSectionItem from "@/components/emotion-notes/detail/common/EmotionNoteDetailSectionItem";
import type { EmotionNoteErrorDetail } from "@/lib/types/emotionNoteTypes";
import { AlertCircle } from "lucide-react";
import styles from "./EmotionNoteDetailPage.module.css";
import EmotionNoteDetailSectionCard from "./EmotionNoteDetailSectionCard";

type EmotionNoteErrorDetailSectionProps = {
  details: EmotionNoteErrorDetail[];
  formatDateTime: (value: string) => string;
  onCopyText?: (text: string) => void;
  onOpenModal?: (
    title: string,
    body: string,
    badgeText?: string | null,
  ) => void;
};

export default function EmotionNoteErrorDetailSection(
  props: EmotionNoteErrorDetailSectionProps,
) {
  const {
    details,
    formatDateTime,
    onCopyText,
    onOpenModal,
  } = props;

  return (
    <EmotionNoteDetailSectionCard
      className={`${styles.sectionError} ${styles.sectionPastelError}`}
      icon={<AlertCircle size={18} />}
      title="인지 오류"
      hint="왜곡된 생각의 탐색"
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
                badgeText={detail.error_label}
                body={detail.error_description}
                actions={{
                  copyText: `인지 오류: ${detail.error_label}\n${detail.error_description}`,
                  modalTitle: "인지 오류",
                  modalBody: detail.error_description,
                  modalBadgeText: detail.error_label,
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
