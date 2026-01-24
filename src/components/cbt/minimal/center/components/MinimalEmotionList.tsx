import { EMOTIONS } from "@/lib/constants/emotions";
import { MinimalEmotionItem } from "./MinimalEmotionItem";
import styles from "../../MinimalStyles.module.css";

interface MinimalEmotionListProps {
  selectedEmotion: string;
  onSelectEmotion: (emotion: string) => void;
}

export function MinimalEmotionList({
  selectedEmotion,
  onSelectEmotion,
}: MinimalEmotionListProps) {
  return (
    <div className={styles.emotionGrid}>
      {EMOTIONS.map((emotion) => (
        <MinimalEmotionItem
          key={emotion.id}
          emotion={emotion}
          isSelected={selectedEmotion === emotion.label}
          onSelect={onSelectEmotion}
        />
      ))}
    </div>
  );
}
