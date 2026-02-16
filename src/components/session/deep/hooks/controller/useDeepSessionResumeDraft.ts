import { clearSessionResumeDraft, saveSessionResumeDraft } from "@/components/restore/storage";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { useEffect } from "react";

type UseDeepSessionResumeDraftParams = {
  mainNote: EmotionNote | null;
  flowId: number | null;
  selectedEmotion: string;
  userInput: string;
  subNotes: EmotionNote[];
  resolvedInternalContext: DeepInternalContext | null;
};

export function useDeepSessionResumeDraft({
  mainNote,
  flowId,
  selectedEmotion,
  userInput,
  subNotes,
  resolvedInternalContext,
}: UseDeepSessionResumeDraftParams) {
  useEffect(() => {
    if (!mainNote || !flowId) return;
    const emotion = selectedEmotion.trim();
    const incident = userInput.trim();
    if (!emotion || !incident) {
      clearSessionResumeDraft();
      return;
    }
    saveSessionResumeDraft({
      kind: "deep",
      selectedEmotion: emotion,
      incident: userInput,
      mainId: mainNote.id,
      flowId,
      subIds: subNotes.map((note) => note.id).sort((a, b) => a - b),
      internalContext: resolvedInternalContext ?? undefined,
      savedAt: new Date().toISOString(),
    });
  }, [flowId, mainNote, resolvedInternalContext, selectedEmotion, subNotes, userInput]);
}

