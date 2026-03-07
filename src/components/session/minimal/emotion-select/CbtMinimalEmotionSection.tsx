import {
  findEmotionById,
  getEmotionsByMood,
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
  selectedEmotionIds: string[];
  onSelectEmotion: (emotionIds: string[]) => void;
  onNext: () => void;
}

export function CbtMinimalEmotionSection({
  moodType,
  onSelectMood,
  selectedEmotionIds,
  onSelectEmotion,
  onNext,
}: CbtMinimalEmotionSectionProps) {
  const emotions = getEmotionsByMood(moodType);
  const selectedEmotionData = findEmotionById(
    selectedEmotionIds[selectedEmotionIds.length - 1] ?? "",
  );

  const toggleEmotion = (emotionId: string) => {
    const isSelected = selectedEmotionIds.includes(emotionId);
    if (isSelected) {
      onSelectEmotion(selectedEmotionIds.filter((value) => value !== emotionId));
      return;
    }
    if (selectedEmotionIds.length >= 2) {
      return;
    }
    onSelectEmotion([...selectedEmotionIds, emotionId]);
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
            selectedEmotionIds={selectedEmotionIds}
            onSelectEmotion={toggleEmotion}
          />
        </div>
        <CbtMinimalEmotionDetailsSection
          emotion={selectedEmotionData}
          isVisible={selectedEmotionIds.length > 0}
          onNext={onNext}
        />
      </div>
    </div>
  );
}
