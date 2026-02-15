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
  selectedEmotion: string;
  onSelectEmotion: (emotion: string) => void;
  onNext: () => void;
}

export function CbtMinimalEmotionSection({
  moodType,
  onSelectMood,
  selectedEmotion,
  onSelectEmotion,
  onNext,
}: CbtMinimalEmotionSectionProps) {
  const emotions = moodType === "positive" ? POSITIVE_EMOTIONS : NEGATIVE_EMOTIONS;
  const selectedEmotionData = emotions.find(
    (emotion) => emotion.label === selectedEmotion,
  );

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
            selectedEmotion={selectedEmotion}
            onSelectEmotion={onSelectEmotion}
          />
        </div>
        <CbtMinimalEmotionDetailsSection
          emotion={selectedEmotionData}
          isVisible={Boolean(selectedEmotion)}
          onNext={onNext}
        />
      </div>
    </div>
  );
}
