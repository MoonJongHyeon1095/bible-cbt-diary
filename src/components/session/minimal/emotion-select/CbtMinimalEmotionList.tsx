import type { EmotionOption } from "@/lib/constants/emotions";
import { CbtMinimalEmotionItem } from "./CbtMinimalEmotionItem";
import styles from "../MinimalStyles.module.css";

interface CbtMinimalEmotionListProps {
  emotions: EmotionOption[];
  selectedEmotion: string;
  onSelectEmotion: (emotion: string) => void;
}

export function CbtMinimalEmotionList({
  emotions,
  selectedEmotion,
  onSelectEmotion,
}: CbtMinimalEmotionListProps) {
  return (
    <div className={styles.emotionGrid}>
      {emotions.map((emotion) => (
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
