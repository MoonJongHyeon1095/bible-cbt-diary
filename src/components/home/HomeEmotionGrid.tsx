import SafeButton from "@/components/ui/SafeButton";
import styles from "./EmotionNoteHomePage.module.css";

type HomeEmotion = {
  id: string;
  label: string;
};

type HomeEmotionGridProps = {
  emotions: HomeEmotion[];
  colorMap: Record<string, string>;
  loadingEmotionId: string | null;
  isStartLoading: boolean;
  onSelectEmotion: (emotionId: string) => void;
};

export function HomeEmotionGrid({
  emotions,
  colorMap,
  loadingEmotionId,
  isStartLoading,
  onSelectEmotion,
}: HomeEmotionGridProps) {
  return (
    <div className={styles.emotionGrid} data-tour="home-emotion-grid">
      {emotions.map((emotion) => {
        const color = colorMap[emotion.id];
        const isLoading = loadingEmotionId === emotion.id && isStartLoading;
        return (
          <SafeButton
            key={emotion.id}
            type="button"
            variant="unstyled"
            className={`${styles.emotionCard} ${isLoading ? styles.emotionCardLoading : ""}`}
            onClick={() => onSelectEmotion(emotion.id)}
            disabled={isStartLoading}
            style={{
              borderColor: color,
              color,
            }}
          >
            <span className={styles.emotionName}>{emotion.label}</span>
          </SafeButton>
        );
      })}
    </div>
  );
}
