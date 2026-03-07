import { useCallback, useEffect, useState } from "react";
import type { SessionMoodType } from "@/components/session/minimal/emotion-select/CbtSessionMoodToggle";
import {
  filterEmotionIdsByMood,
  getMoodTypeFromEmotionId,
} from "@/lib/constants/emotions";

type UseSessionMoodControllerParams = {
  selectedEmotionIds: string[];
  setSelectedEmotionIds: (value: string[]) => void;
};

export function useSessionMoodController({
  selectedEmotionIds,
  setSelectedEmotionIds,
}: UseSessionMoodControllerParams) {
  const [moodType, setMoodType] = useState<SessionMoodType | null>(null);

  useEffect(() => {
    const firstEmotionId = selectedEmotionIds[0];
    if (!firstEmotionId) return;
    setMoodType(getMoodTypeFromEmotionId(firstEmotionId));
  }, [selectedEmotionIds]);

  const handleSelectMood = useCallback(
    (nextMood: SessionMoodType) => {
      setMoodType(nextMood);
      if (selectedEmotionIds.length === 0) return;
      const nextSelected = filterEmotionIdsByMood(selectedEmotionIds, nextMood);
      if (nextSelected.length !== selectedEmotionIds.length) {
        setSelectedEmotionIds(nextSelected);
      }
    },
    [selectedEmotionIds, setSelectedEmotionIds],
  );

  return {
    moodType,
    handleSelectMood,
  };
}
