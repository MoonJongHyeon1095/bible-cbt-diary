"use client";

import EmotionNoteDetailSectionItem from "@/components/emotion-notes/detail/common/EmotionNoteDetailSectionItem";
import type { EmotionNoteBehaviorDetail } from "@/lib/types/emotionNoteTypes";
import { Footprints } from "lucide-react";
import styles from "./EmotionNoteDetailPage.module.css";
import EmotionNoteDetailSectionCard from "./EmotionNoteDetailSectionCard";

type EmotionNoteBehaviorDetailSectionProps = {
  details: EmotionNoteBehaviorDetail[];
  formatDateTime: (value: string) => string;
};

export default function EmotionNoteBehaviorDetailSection(
  props: EmotionNoteBehaviorDetailSectionProps,
) {
  const {
    details,
    formatDateTime
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
            <div key={detail.id} className={styles.detailCard}>
              <EmotionNoteDetailSectionItem
                badgeText={detail.behavior_label}
                body={detail.behavior_description}
                actions={{
                  timeText: formatDateTime(detail.created_at),
                }}
              />
            </div>
          ))
        )}
      </div>
    </EmotionNoteDetailSectionCard>
  );
}
