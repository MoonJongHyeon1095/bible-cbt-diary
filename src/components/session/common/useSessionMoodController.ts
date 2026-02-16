import { useCallback, useEffect, useState } from "react";
import type { SessionMoodType } from "@/components/session/minimal/emotion-select/CbtSessionMoodToggle";

type EmotionOption = {
  label: string;
};

type UseSessionMoodControllerParams = {
  selectedEmotion: string;
  setSelectedEmotion: (value: string) => void;
  positiveEmotions: readonly EmotionOption[];
  negativeEmotions: readonly EmotionOption[];
};

export function useSessionMoodController({
  selectedEmotion,
  setSelectedEmotion,
  positiveEmotions,
  negativeEmotions,
}: UseSessionMoodControllerParams) {
  const [moodType, setMoodType] = useState<SessionMoodType | null>(null);

  useEffect(() => {
    if (!selectedEmotion) return;
    const inPositive = positiveEmotions.some(
      (emotion) => emotion.label === selectedEmotion,
    );
    setMoodType(inPositive ? "positive" : "negative");
  }, [positiveEmotions, selectedEmotion]);

  const handleSelectMood = useCallback(
    (nextMood: SessionMoodType) => {
      setMoodType(nextMood);
      if (!selectedEmotion) return;
      const nextPool = nextMood === "positive" ? positiveEmotions : negativeEmotions;
      const hasSelectedEmotion = nextPool.some(
        (emotion) => emotion.label === selectedEmotion,
      );
      if (!hasSelectedEmotion) {
        setSelectedEmotion("");
      }
    },
    [negativeEmotions, positiveEmotions, selectedEmotion, setSelectedEmotion],
  );

  return {
    moodType,
    handleSelectMood,
  };
}
