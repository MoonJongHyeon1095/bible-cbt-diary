import { Check } from "lucide-react";
import { EMOTIONS } from "@/lib/constants/emotions";
import styles from "../MinimalStyles.module.css";
import SafeButton from "@/components/ui/SafeButton";

type EmotionItem = (typeof EMOTIONS)[number];

interface CbtMinimalEmotionItemProps {
  emotion: EmotionItem;
  isSelected: boolean;
  onSelect: (emotion: EmotionItem["label"]) => void;
}

export function CbtMinimalEmotionItem({
  emotion,
  isSelected,
  onSelect,
}: CbtMinimalEmotionItemProps) {
  return (
    <SafeButton
      type="button"
      variant="unstyled"
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
    </SafeButton>
  );
}
