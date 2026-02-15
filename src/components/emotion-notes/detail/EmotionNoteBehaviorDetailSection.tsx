"use client";

import EmotionNoteDetailSectionItem from "@/components/emotion-notes/detail/common/EmotionNoteDetailSectionItem";
import type { EmotionNoteBehaviorDetail } from "@/lib/types/emotionNoteTypes";
import { Footprints } from "lucide-react";
import styles from "./EmotionNoteDetailPage.module.css";
import EmotionNoteDetailSectionCard from "./EmotionNoteDetailSectionCard";

type EmotionNoteBehaviorDetailSectionProps = {
  details: EmotionNoteBehaviorDetail[];
  formatDateTime: (value: string) => string;
  onCopyText?: (text: string) => void;
  onOpenModal?: (
    title: string,
    body: string,
    badgeText?: string | null,
  ) => void;
};

export default function EmotionNoteBehaviorDetailSection(
  props: EmotionNoteBehaviorDetailSectionProps,
) {
  const {
    details,
    formatDateTime,
    onCopyText,
    onOpenModal,
  } = props;

  return (
    <EmotionNoteDetailSectionCard
      className={`${styles.sectionBehavior} ${styles.sectionPastelBehavior}`}
      icon={<Footprints size={18} />}
      title="행동 반응"
      hint="실제 행동의 기록"
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
                badgeText={detail.behavior_label}
                body={detail.behavior_description}
                actions={{
                  copyText: `행동 반응: ${detail.behavior_label}\n${detail.behavior_description}`,
                  modalTitle: "행동 반응",
                  modalBody: detail.behavior_description,
                  modalBadgeText: detail.behavior_label,
                  timeText: formatDateTime(detail.created_at),
                  onCopyText,
                  onOpenModal,
                }}
              />
              {detail.error_tags && detail.error_tags.length > 0 ? (
                <div className={styles.detailTagList}>
                  {detail.error_tags.map((tag) => (
                    <span
                      key={`${detail.id}-${tag}`}
                      className={styles.detailErrorTag}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </EmotionNoteDetailSectionCard>
  );
}
