import {
  NEGATIVE_EMOTIONS,
  POSITIVE_EMOTIONS,
} from "@/lib/constants/emotions";
import { CbtStepHeaderSection } from "@/components/session/common/CbtStepHeaderSection";
import { CbtMinimalEmotionDetailsSection } from "./CbtMinimalEmotionDetailsSection";
import { CbtMinimalEmotionList } from "./CbtMinimalEmotionList";
import {
  CbtSessionMoodToggle,
  type SessionMoodType,
} from "./CbtSessionMoodToggle";
import styles from "../MinimalStyles.module.css";

interface CbtMinimalEmotionSectionProps {
  moodType: SessionMoodType | null;
  onSelectMood: (moodType: SessionMoodType) => void;
  selectedEmotions: string[];
  onSelectEmotion: (emotion: string[]) => void;
  onNext: () => void;
}

export function CbtMinimalEmotionSection({
  moodType,
  onSelectMood,
  selectedEmotions,
  onSelectEmotion,
  onNext,
}: CbtMinimalEmotionSectionProps) {
  const emotions = moodType === "positive" ? POSITIVE_EMOTIONS : NEGATIVE_EMOTIONS;
  const selectedEmotionData = emotions.find(
    (emotion) => emotion.label === selectedEmotions[selectedEmotions.length - 1],
  );

  const toggleEmotion = (emotion: string) => {
    const isSelected = selectedEmotions.includes(emotion);
    if (isSelected) {
      onSelectEmotion(selectedEmotions.filter((value) => value !== emotion));
      return;
    }
    if (selectedEmotions.length >= 2) {
      return;
    }
    onSelectEmotion([...selectedEmotions, emotion]);
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <CbtStepHeaderSection title="감정을 선택해주세요." center />
        <div className={styles.moodBlock}>
          <CbtSessionMoodToggle value={moodType} onChange={onSelectMood} />
        </div>
        <div className={styles.emotionGridWrap} data-tour="emotion-grid">
          <CbtMinimalEmotionList
            emotions={emotions}
            selectedEmotions={selectedEmotions}
            onSelectEmotion={toggleEmotion}
          />
        </div>
        <CbtMinimalEmotionDetailsSection
          emotion={selectedEmotionData}
          isVisible={selectedEmotions.length > 0}
          onNext={onNext}
        />
      </div>
    </div>
  );
}
