import { useCallback, useEffect, useState } from "react";
import type { SessionMoodType } from "@/components/session/minimal/emotion-select/CbtSessionMoodToggle";

type EmotionOption = {
  label: string;
};

type UseSessionMoodControllerParams = {
  selectedEmotions: string[];
  setSelectedEmotions: (value: string[]) => void;
  positiveEmotions: readonly EmotionOption[];
  negativeEmotions: readonly EmotionOption[];
};

export function useSessionMoodController({
  selectedEmotions,
  setSelectedEmotions,
  positiveEmotions,
  negativeEmotions,
}: UseSessionMoodControllerParams) {
  const [moodType, setMoodType] = useState<SessionMoodType | null>(null);

  useEffect(() => {
    const firstEmotion = selectedEmotions[0];
    if (!firstEmotion) return;
    const inPositive = positiveEmotions.some(
      (emotion) => emotion.label === firstEmotion,
    );
    setMoodType(inPositive ? "positive" : "negative");
  }, [positiveEmotions, selectedEmotions]);

  const handleSelectMood = useCallback(
    (nextMood: SessionMoodType) => {
      setMoodType(nextMood);
      if (selectedEmotions.length === 0) return;
      const nextPool = nextMood === "positive" ? positiveEmotions : negativeEmotions;
      const nextSelected = selectedEmotions.filter((selected) =>
        nextPool.some((emotion) => emotion.label === selected),
      );
      if (nextSelected.length !== selectedEmotions.length) {
        setSelectedEmotions(nextSelected);
      }
    },
    [negativeEmotions, positiveEmotions, selectedEmotions, setSelectedEmotions],
  );

  return {
    moodType,
    handleSelectMood,
  };
}
