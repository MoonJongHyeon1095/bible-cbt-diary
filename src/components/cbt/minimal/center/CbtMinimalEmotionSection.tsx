import { EMOTIONS } from "@/lib/constants/emotions";
import { CbtMinimalStepHeaderSection } from "../common/CbtMinimalStepHeaderSection";
import { CbtMinimalEmotionDetailsSection } from "./components/CbtMinimalEmotionDetailsSection";
import { CbtMinimalEmotionList } from "./components/CbtMinimalEmotionList";
import styles from "../MinimalStyles.module.css";

interface CbtMinimalEmotionSectionProps {
  selectedEmotion: string;
  onSelectEmotion: (emotion: string) => void;
  onNext: () => void;
}

export function CbtMinimalEmotionSection({
  selectedEmotion,
  onSelectEmotion,
  onNext,
}: CbtMinimalEmotionSectionProps) {
  const selectedEmotionData = EMOTIONS.find(
    (emotion) => emotion.label === selectedEmotion,
  );

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <CbtMinimalStepHeaderSection
          title="감정을 선택해주세요."
          center
        />
        <div className={styles.emotionGridWrap} data-tour="emotion-grid">
          <CbtMinimalEmotionList
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
