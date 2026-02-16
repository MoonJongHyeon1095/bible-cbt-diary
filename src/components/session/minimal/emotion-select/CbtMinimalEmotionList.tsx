import type { EmotionOption } from "@/lib/constants/emotions";
import { CbtMinimalEmotionItem } from "./CbtMinimalEmotionItem";
import styles from "../MinimalStyles.module.css";

interface CbtMinimalEmotionListProps {
  emotions: EmotionOption[];
  selectedEmotions: string[];
  onSelectEmotion: (emotion: string) => void;
}

export function CbtMinimalEmotionList({
  emotions,
  selectedEmotions,
  onSelectEmotion,
}: CbtMinimalEmotionListProps) {
  return (
    <div className={styles.emotionGrid}>
      {emotions.map((emotion) => (
        <CbtMinimalEmotionItem
          key={emotion.id}
          emotion={emotion}
          isSelected={selectedEmotions.includes(emotion.label)}
          onSelect={onSelectEmotion}
        />
      ))}
    </div>
  );
}
