import { clearSessionResumeDraft, saveSessionResumeDraft } from "@/components/restore/storage";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { useEffect } from "react";

type UseDeepSessionResumeDraftParams = {
  mainNote: EmotionNote | null;
  flowId: number | null;
  selectedEmotions: string[];
  userInput: string;
  subNotes: EmotionNote[];
  resolvedInternalContext: DeepInternalContext | null;
};

export function useDeepSessionResumeDraft({
  mainNote,
  flowId,
  selectedEmotions,
  userInput,
  subNotes,
  resolvedInternalContext,
}: UseDeepSessionResumeDraftParams) {
  useEffect(() => {
    if (!mainNote || !flowId) return;
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
      kind: "deep",
      selectedEmotions: emotions,
      incident: userInput,
      mainId: mainNote.id,
      flowId,
      subIds: subNotes.map((note) => note.id).sort((a, b) => a - b),
      internalContext: resolvedInternalContext ?? undefined,
      savedAt: new Date().toISOString(),
    });
  }, [flowId, mainNote, resolvedInternalContext, selectedEmotions, subNotes, userInput]);
}
