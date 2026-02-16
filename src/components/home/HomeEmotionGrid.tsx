import SafeButton from "@/components/ui/SafeButton";
import styles from "./EmotionNoteHomePage.module.css";

type HomeEmotion = {
  id: string;
  label: string;
};

type HomeEmotionGridProps = {
  emotions: HomeEmotion[];
  loadingEmotionId: string | null;
  isStartLoading: boolean;
  onSelectEmotion: (emotionId: string) => void;
};

export function HomeEmotionGrid({
  emotions,
  loadingEmotionId,
  isStartLoading,
  onSelectEmotion,
}: HomeEmotionGridProps) {
  return (
    <div className={styles.emotionGrid} data-tour="home-emotion-grid">
      {emotions.map((emotion) => {
        const isLoading = loadingEmotionId === emotion.id && isStartLoading;
        return (
          <SafeButton
            key={emotion.id}
            type="button"
            variant="unstyled"
            className={`${styles.emotionCard} ${isLoading ? styles.emotionCardLoading : ""}`}
            onClick={() => onSelectEmotion(emotion.id)}
            disabled={isStartLoading}
          >
            <span className={styles.emotionName}>{emotion.label}</span>
          </SafeButton>
        );
      })}
    </div>
  );
}
