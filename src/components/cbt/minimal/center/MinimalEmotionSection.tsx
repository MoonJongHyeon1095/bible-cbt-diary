import { EMOTIONS } from "@/lib/constants/emotions";
import { MinimalStepHeaderSection } from "../common/MinimalStepHeaderSection";
import { MinimalEmotionDetailsSection } from "./components/MinimalEmotionDetailsSection";
import { MinimalEmotionList } from "./components/MinimalEmotionList";
import styles from "../MinimalStyles.module.css";

interface MinimalEmotionSectionProps {
  selectedEmotion: string;
  onSelectEmotion: (emotion: string) => void;
  onNext: () => void;
}

export function MinimalEmotionSection({
  selectedEmotion,
  onSelectEmotion,
  onNext,
}: MinimalEmotionSectionProps) {
  const selectedEmotionData = EMOTIONS.find(
    (emotion) => emotion.label === selectedEmotion,
  );

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <MinimalStepHeaderSection
          title="감정을 선택해주세요."
          center
        />
        <MinimalEmotionList
          selectedEmotion={selectedEmotion}
          onSelectEmotion={onSelectEmotion}
        />
        <MinimalEmotionDetailsSection
          emotion={selectedEmotionData}
          isVisible={Boolean(selectedEmotion)}
          onNext={onNext}
        />
      </div>
    </div>
  );
}
