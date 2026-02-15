"use client";

import EmotionNoteDetailSectionItem from "@/components/emotion-notes/detail/common/EmotionNoteDetailSectionItem";
import type {
  EmotionNoteAlternativeDetail,
  EmotionNoteDetail,
  EmotionNoteErrorDetail,
} from "@/lib/types/emotionNoteTypes";
import { Brain, Lightbulb } from "lucide-react";
import styles from "./EmotionNoteDetailPage.module.css";
import EmotionNoteDetailSectionCard from "./EmotionNoteDetailSectionCard";

type EmotionNoteAlternativeDetailSectionProps = {
  details: EmotionNoteAlternativeDetail[];
  thoughtDetails: EmotionNoteDetail[];
  errorDetails: EmotionNoteErrorDetail[];
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
    thoughtDetails,
    errorDetails,
    formatDateTime,
    onCopyText,
    onOpenModal,
  } = props;
  const latestAlternative = [...details].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )[0];
  const latestThought = [...thoughtDetails]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .find((item) => item.automatic_thought.trim());
  const latestErrorWithDescription = [...errorDetails]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .find((item) => item.error_description.trim());
  const emotionTags = Array.from(
    new Set(
      thoughtDetails
        .map((item) => item.emotion.trim())
        .filter((emotion) => emotion.length > 0),
    ),
  );
  const errorLabelTags = Array.from(
    new Set(
      errorDetails
        .map((item) => item.error_label.trim())
        .filter((label) => label.length > 0),
    ),
  );
  const innerBeliefText =
    latestThought?.automatic_thought?.trim() || "기록 없음";
  const analysisText =
    latestErrorWithDescription?.error_description?.trim() ||
    (errorLabelTags.length > 0
      ? `주요 인지오류: ${errorLabelTags.join(", ")}`
      : "기록 없음");

  return (
    <div className={styles.alternativeDistortionLayout}>
      <EmotionNoteDetailSectionCard
        className={`${styles.sectionAlt} ${styles.sectionPastelAlt}`}
        icon={<Lightbulb size={18} />}
        title="대안 사고"
        hint="하나의 문장으로 정리한 리프레임"
      >
        {!latestAlternative ? (
          <div className={styles.detailList}>
            <p className={styles.emptyText}>아직 작성된 내용이 없습니다.</p>
          </div>
        ) : (
          <>
            <p className={styles.mainTextLabel}>Alternative Text</p>
            <EmotionNoteDetailSectionItem
              body={latestAlternative.alternative}
              actions={{
                copyText: `대안 사고: ${latestAlternative.alternative}`,
                modalTitle: "대안 사고",
                modalBody: latestAlternative.alternative,
                modalBadgeText: null,
                timeText: formatDateTime(latestAlternative.created_at),
                onCopyText,
                onOpenModal,
              }}
            />
          </>
        )}
      </EmotionNoteDetailSectionCard>

      <div className={styles.distortionBranch} aria-hidden />

      <EmotionNoteDetailSectionCard
        className={`${styles.sectionDistortion} ${styles.sectionPastelDistortion}`}
        icon={<Brain size={18} />}
        title="Distortion"
        hint="Inner Belief · Analysis"
      >
        <div className={styles.distortionTagsInline}>
          {emotionTags.map((tag) => (
            <span
              key={`emotion-${tag}`}
              className={`${styles.noteTag} ${styles.noteTagEmotion}`}
            >
              #{tag}
            </span>
          ))}
          {errorLabelTags.map((tag) => (
            <span
              key={`error-${tag}`}
              className={`${styles.noteTag} ${styles.noteTagError}`}
            >
              #{tag}
            </span>
          ))}
        </div>
        <div className={styles.distortionEntry}>
          <h4 className={styles.distortionEntryTitle}>Inner Belief</h4>
          <p className={styles.distortionEntryText}>{innerBeliefText}</p>
        </div>
        <div className={styles.distortionEntry}>
          <h4 className={styles.distortionEntryTitle}>Analysis</h4>
          <p className={styles.distortionEntryText}>{analysisText}</p>
        </div>
      </EmotionNoteDetailSectionCard>
    </div>
  );
}
