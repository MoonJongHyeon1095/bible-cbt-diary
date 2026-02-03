import { EMOTIONS } from "@/lib/constants/emotions";
import { CbtMinimalEmotionItem } from "./CbtMinimalEmotionItem";
import styles from "../../MinimalStyles.module.css";

interface CbtMinimalEmotionListProps {
  selectedEmotion: string;
  onSelectEmotion: (emotion: string) => void;
}

export function CbtMinimalEmotionList({
  selectedEmotion,
  onSelectEmotion,
}: CbtMinimalEmotionListProps) {
  return (
    <div className={styles.emotionGrid} data-tour="minimal-emotion-grid">
      {EMOTIONS.map((emotion) => (
        <CbtMinimalEmotionItem
          key={emotion.id}
          emotion={emotion}
          isSelected={selectedEmotion === emotion.label}
          onSelect={onSelectEmotion}
        />
      ))}
    </div>
  );
}
