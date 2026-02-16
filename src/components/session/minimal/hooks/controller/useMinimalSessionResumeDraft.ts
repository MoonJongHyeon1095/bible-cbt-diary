import { clearSessionResumeDraft, saveSessionResumeDraft } from "@/components/restore/storage";
import { useEffect } from "react";

type UseMinimalSessionResumeDraftParams = {
  selectedEmotions: string[];
  userInput: string;
  hasDateParam: boolean;
  dateParam: string | null;
};

export function useMinimalSessionResumeDraft({
  selectedEmotions,
  userInput,
  hasDateParam,
  dateParam,
}: UseMinimalSessionResumeDraftParams) {
  useEffect(() => {
    const emotions = selectedEmotions
      .map((emotion) => emotion.trim())
      .filter((emotion) => emotion.length > 0)
      .slice(0, 2);
    const incident = userInput.trim();
    if (emotions.length === 0 || !incident) {
      clearSessionResumeDraft();
      return;
    }
    saveSessionResumeDraft({
      kind: "minimal",
      selectedEmotions: emotions,
      incident: userInput,
      date: hasDateParam ? dateParam ?? undefined : undefined,
      savedAt: new Date().toISOString(),
    });
  }, [dateParam, hasDateParam, selectedEmotions, userInput]);
}
