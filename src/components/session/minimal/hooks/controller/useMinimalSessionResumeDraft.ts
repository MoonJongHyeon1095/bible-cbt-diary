import { clearSessionResumeDraft, saveSessionResumeDraft } from "@/components/restore/storage";
import { useEffect } from "react";

type UseMinimalSessionResumeDraftParams = {
  selectedEmotion: string;
  userInput: string;
  hasDateParam: boolean;
  dateParam: string | null;
};

export function useMinimalSessionResumeDraft({
  selectedEmotion,
  userInput,
  hasDateParam,
  dateParam,
}: UseMinimalSessionResumeDraftParams) {
  useEffect(() => {
    const emotion = selectedEmotion.trim();
    const incident = userInput.trim();
    if (!emotion || !incident) {
      clearSessionResumeDraft();
      return;
    }
    saveSessionResumeDraft({
      kind: "minimal",
      selectedEmotion: emotion,
      incident: userInput,
      date: hasDateParam ? dateParam ?? undefined : undefined,
      savedAt: new Date().toISOString(),
    });
  }, [dateParam, hasDateParam, selectedEmotion, userInput]);
}
