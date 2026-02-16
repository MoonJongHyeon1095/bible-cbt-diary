import SafeButton from "@/components/ui/SafeButton";
import styles from "./EmotionNoteHomePage.module.css";

type HomeEmotion = {
  id: string;
  label: string;
};

type HomeEmotionGridProps = {
  emotions: HomeEmotion[];
  selectedEmotionIds: string[];
  isStartLoading: boolean;
  onSelectEmotion: (emotionId: string) => void;
};

export function HomeEmotionGrid({
  emotions,
  selectedEmotionIds,
  isStartLoading,
  onSelectEmotion,
}: HomeEmotionGridProps) {
  return (
    <div className={styles.emotionGrid} data-tour="home-emotion-grid">
      {emotions.map((emotion) => {
        const isSelected = selectedEmotionIds.includes(emotion.id);
        const isLoading = isStartLoading && isSelected;
        const isSelectable = isSelected || selectedEmotionIds.length < 2;
        return (
          <SafeButton
            key={emotion.id}
            type="button"
            variant="unstyled"
            className={`${styles.emotionCard} ${
              isSelected ? styles.emotionCardSelected : ""
            } ${isLoading ? styles.emotionCardLoading : ""} ${
              !isSelected && !isSelectable ? styles.emotionCardDisabled : ""
            }`}
            onClick={() => onSelectEmotion(emotion.id)}
            disabled={isStartLoading || !isSelectable}
            aria-pressed={isSelected}
          >
            <span className={styles.emotionName}>{emotion.label}</span>
            {isLoading ? (
              <span className={styles.emotionSpinner} aria-hidden="true" />
            ) : null}
          </SafeButton>
        );
      })}
    </div>
  );
}
