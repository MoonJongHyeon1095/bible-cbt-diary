import { Check } from "lucide-react";
import { EMOTIONS } from "@/lib/constants/emotions";
import styles from "../../MinimalStyles.module.css";

type EmotionItem = (typeof EMOTIONS)[number];

interface MinimalEmotionItemProps {
  emotion: EmotionItem;
  isSelected: boolean;
  onSelect: (emotion: EmotionItem["label"]) => void;
}

export function MinimalEmotionItem({
  emotion,
  isSelected,
  onSelect,
}: MinimalEmotionItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(emotion.label)}
      data-emotion={emotion.id}
      className={`${styles.emotionButton} ${
        isSelected ? styles.emotionButtonSelected : ""
      }`}
    >
      <span className={styles.emotionBadge}>
        <span>{emotion.label}</span>
        {isSelected && <Check className={styles.floatingMiniIcon} />}
      </span>
    </button>
  );
}
