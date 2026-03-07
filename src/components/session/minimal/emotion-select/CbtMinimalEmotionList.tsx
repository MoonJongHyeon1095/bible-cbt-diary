import type { EmotionOption } from "@/lib/constants/emotions";
import { CbtMinimalEmotionItem } from "./CbtMinimalEmotionItem";
import styles from "../MinimalStyles.module.css";

interface CbtMinimalEmotionListProps {
  emotions: EmotionOption[];
  selectedEmotionIds: string[];
  onSelectEmotion: (emotionId: string) => void;
}

export function CbtMinimalEmotionList({
  emotions,
  selectedEmotionIds,
  onSelectEmotion,
}: CbtMinimalEmotionListProps) {
  return (
    <div className={styles.emotionGrid}>
      {emotions.map((emotion) => (
        <CbtMinimalEmotionItem
          key={emotion.id}
          emotion={emotion}
          isSelected={selectedEmotionIds.includes(emotion.id)}
          onSelect={onSelectEmotion}
        />
      ))}
    </div>
  );
}
