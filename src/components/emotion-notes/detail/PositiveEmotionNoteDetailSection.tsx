"use client";

import { Brain, Footprints, MessageCircleHeart } from "lucide-react";
import styles from "./EmotionNoteDetailPage.module.css";
import EmotionNoteDetailSectionCard from "./EmotionNoteDetailSectionCard";

type PositiveEmotionNoteDetailSectionProps = {
  innerBelief: string;
  empathyText: string;
  behaviorLabel: string;
  behaviorDescription: string;
  reflectionQuestion: string;
  emotionTags: string[];
  sdtLabel: string;
};

export default function PositiveEmotionNoteDetailSection({
  innerBelief,
  empathyText,
  behaviorLabel,
  behaviorDescription,
  reflectionQuestion,
  emotionTags,
  sdtLabel,
}: PositiveEmotionNoteDetailSectionProps) {
  const normalizedEmotionTags = Array.from(
    new Set((emotionTags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0)),
  );
  const sdtTag = sdtLabel.trim();

  return (
    <div className={styles.alternativeDistortionLayout}>
      <EmotionNoteDetailSectionCard
        className={`${styles.sectionDistortion} ${styles.sectionPastelDistortion}`}
        icon={<Brain size={18} />}
        title="감정 해석"
        hint="Inner Belief · Empathy"
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
          {sdtTag ? (
            <span className={`${styles.noteTag} ${styles.noteTagSdt}`}>
              #{sdtTag}
            </span>
          ) : null}
        </div>

        <div className={styles.distortionEntry}>
          <h4 className={styles.distortionEntryTitle}>Inner Belief</h4>
          <p className={styles.distortionEntryText}>{innerBelief.trim() || "기록 없음"}</p>
        </div>
        <div className={styles.distortionEntry}>
          <h4 className={styles.distortionEntryTitle}>Empathy</h4>
          <p className={styles.distortionEntryText}>{empathyText.trim() || "기록 없음"}</p>
        </div>
      </EmotionNoteDetailSectionCard>

      <EmotionNoteDetailSectionCard
        className={`${styles.sectionAlt} ${styles.sectionPastelAlt}`}
        icon={<Footprints size={18} />}
        title="행동 제안"
        hint="Behavior"
      >
        <div className={styles.distortionTagsInline}>
          {behaviorLabel.trim() ? (
            <span className={`${styles.noteTag} ${styles.noteTagBehavior}`}>
              #{behaviorLabel.trim()}
            </span>
          ) : null}
        </div>
        <div className={styles.distortionEntry}>
          <h4 className={styles.distortionEntryTitle}>Behavior Description</h4>
          <p className={styles.distortionEntryText}>
            {behaviorDescription.trim() || "기록 없음"}
          </p>
        </div>
      </EmotionNoteDetailSectionCard>

      <EmotionNoteDetailSectionCard
        className={`${styles.sectionReflection} ${styles.sectionPastelReflection}`}
        icon={<MessageCircleHeart size={18} />}
        title="성찰 질문"
        hint="Reflection"
      >
        <p className={styles.reflectionQuestionText}>
          {reflectionQuestion.trim() || "기록 없음"}
        </p>
      </EmotionNoteDetailSectionCard>
    </div>
  );
}
