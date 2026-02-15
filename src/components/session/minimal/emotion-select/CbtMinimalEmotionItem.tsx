import { Check } from "lucide-react";
import type { EmotionOption } from "@/lib/constants/emotions";
import styles from "../MinimalStyles.module.css";
import SafeButton from "@/components/ui/SafeButton";

interface CbtMinimalEmotionItemProps {
  emotion: EmotionOption;
  isSelected: boolean;
  onSelect: (emotion: EmotionOption["label"]) => void;
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
