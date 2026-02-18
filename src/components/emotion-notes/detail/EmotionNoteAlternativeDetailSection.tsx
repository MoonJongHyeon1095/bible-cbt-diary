"use client";

import EmotionNoteDetailSectionItem from "@/components/emotion-notes/detail/common/EmotionNoteDetailSectionItem";
import { Brain, Lightbulb } from "lucide-react";
import styles from "./EmotionNoteDetailPage.module.css";
import EmotionNoteDetailSectionCard from "./EmotionNoteDetailSectionCard";

type EmotionNoteAlternativeDetailSectionProps = {
  alternative: string;
  innerBelief: string;
  emotionTags: string[];
  errorLabel: string;
  errorDescription: string;
  createdAt: string;
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
    alternative,
    innerBelief,
    emotionTags,
    errorLabel,
    errorDescription,
    createdAt,
    formatDateTime,
    onCopyText,
    onOpenModal,
  } = props;
  const normalizedEmotionTags = Array.from(
    new Set((emotionTags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0)),
  );
  const errorLabelTags = errorLabel.trim() ? [errorLabel.trim()] : [];
  const innerBeliefText = innerBelief.trim() || "기록 없음";
  const analysisText = errorDescription.trim() || (errorLabelTags[0] ? `주요 인지오류: ${errorLabelTags[0]}` : "기록 없음");

  return (
    <div className={styles.alternativeDistortionLayout}>
      <EmotionNoteDetailSectionCard
        className={`${styles.sectionAlt} ${styles.sectionPastelAlt}`}
        icon={<Lightbulb size={18} />}
        title="대안 사고"
        hint="하나의 문장으로 정리한 리프레임"
        dataTour="detail-alternative-box"
      >
        {!alternative.trim() ? (
          <div className={styles.detailList}>
            <p className={styles.emptyText}>아직 작성된 내용이 없습니다.</p>
          </div>
        ) : (
          <>
            <p className={styles.mainTextLabel}>Alternative Text</p>
            <EmotionNoteDetailSectionItem
              body={alternative}
              actions={{
                copyText: `대안 사고: ${alternative}`,
                modalTitle: "대안 사고",
                modalBody: alternative,
                modalBadgeText: null,
                timeText: formatDateTime(createdAt),
                onCopyText,
                onOpenModal,
              }}
            />
          </>
        )}
      </EmotionNoteDetailSectionCard>

      <EmotionNoteDetailSectionCard
        className={`${styles.sectionDistortion} ${styles.sectionPastelDistortion}`}
        icon={<Brain size={18} />}
        title="Distortion"
        hint="Inner Belief · Analysis"
      >
        <div className={styles.distortionTagsInline}>
          {normalizedEmotionTags.map((tag) => (
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
