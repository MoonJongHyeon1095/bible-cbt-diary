import SafeButton from "@/components/ui/SafeButton";
import { Frown, Smile } from "lucide-react";
import styles from "./EmotionNoteHomePage.module.css";

export type HomeMoodType = "negative" | "positive";

type HomeMoodToggleProps = {
  value: HomeMoodType | null;
  onChange: (next: HomeMoodType) => void;
  disabled?: boolean;
  prompt?: string;
};

export function HomeMoodToggle({
  value,
  onChange,
  disabled = false,
}: HomeMoodToggleProps) {
  return (
    <div className={styles.moodBlock}>
      <div className={styles.moodToggle} data-tour="home-mood-toggle">
        <SafeButton
          type="button"
          variant="unstyled"
          className={`${styles.moodButton} ${
            value === "negative" ? styles.moodButtonActive : ""
          }`}
          onClick={() => onChange("negative")}
          disabled={disabled}
          aria-label="부정 감정 보기"
        >
          <Frown size={28} />
        </SafeButton>
        <SafeButton
          type="button"
          variant="unstyled"
          className={`${styles.moodButton} ${
            value === "positive" ? styles.moodButtonActive : ""
          }`}
          onClick={() => onChange("positive")}
          disabled={disabled}
          aria-label="긍정 감정 보기"
        >
          <Smile size={28} />
        </SafeButton>
      </div>
    </div>
  );
}
