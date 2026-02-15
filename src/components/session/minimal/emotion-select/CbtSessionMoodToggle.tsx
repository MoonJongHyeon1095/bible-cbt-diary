import SafeButton from "@/components/ui/SafeButton";
import { Frown, Smile } from "lucide-react";
import styles from "../MinimalStyles.module.css";

export type SessionMoodType = "negative" | "positive";

interface CbtSessionMoodToggleProps {
  value: SessionMoodType | null;
  onChange: (next: SessionMoodType) => void;
}

export function CbtSessionMoodToggle({
  value,
  onChange,
}: CbtSessionMoodToggleProps) {
  return (
    <div className={styles.moodToggle}>
      <SafeButton
        type="button"
        variant="unstyled"
        className={`${styles.moodButton} ${
          value === "positive" ? styles.moodButtonActive : ""
        }`}
        onClick={() => onChange("positive")}
        aria-label="긍정 감정 보기"
      >
        <Smile size={28} />
      </SafeButton>
      <SafeButton
        type="button"
        variant="unstyled"
        className={`${styles.moodButton} ${
          value === "negative" ? styles.moodButtonActive : ""
        }`}
        onClick={() => onChange("negative")}
        aria-label="부정 감정 보기"
      >
        <Frown size={28} />
      </SafeButton>
    </div>
  );
}
