import { useCallback } from "react";
import type { DeepStep } from "@/components/session/hooks/useCbtDeepSessionFlow";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";

type UseDeepSessionSelectionHandlersParams = {
  confirmSelection: () => EmotionNote[];
  setStep: (step: DeepStep) => void;
  nextStep: DeepStep;
};

export function useDeepSessionSelectionHandlers({
  confirmSelection,
  setStep,
  nextStep,
}: UseDeepSessionSelectionHandlersParams) {
  const handleConfirmSelection = useCallback(() => {
    const selectedNotes = confirmSelection();
    if (selectedNotes.length === 0) return;
    setStep(nextStep);
  }, [confirmSelection, nextStep, setStep]);

  return { handleConfirmSelection };
}
