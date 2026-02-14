import { useCallback } from "react";
import type { DeepStep } from "@/components/session/hooks/useCbtDeepSessionFlow";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";

type UseDeepSessionSelectionHandlersParams = {
  confirmSelection: () => EmotionNote[];
  setStep: (step: DeepStep) => void;
};

export function useDeepSessionSelectionHandlers({
  confirmSelection,
  setStep,
}: UseDeepSessionSelectionHandlersParams) {
  const handleConfirmSelection = useCallback(() => {
    const selectedNotes = confirmSelection();
    if (selectedNotes.length === 0) return;
    setStep("incident");
  }, [confirmSelection, setStep]);

  return { handleConfirmSelection };
}
