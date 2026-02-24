import { useCallback } from "react";
import type { DeepStep } from "@/components/session/hooks/useCbtDeepSessionFlow";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";

type UseDeepSessionNavigationHandlersParams = {
  flowStep: DeepStep;
  currentStepIndex: number;
  stepOrder: DeepStep[];
  flowId: number | null;
  mainNote: EmotionNote | null;
  setStep: (step: DeepStep) => void;
  router: { push: (path: string) => void };
};

export function useDeepSessionNavigationHandlers({
  flowStep,
  currentStepIndex,
  stepOrder,
  flowId,
  mainNote,
  setStep,
  router,
}: UseDeepSessionNavigationHandlersParams) {
  void flowId;
  const handleBack = useCallback(() => {
    if (flowStep === "select") {
      if (mainNote) {
        router.push(`/detail?id=${mainNote.id}`);
      }
      return;
    }
    if (currentStepIndex <= 0) return;
    setStep(stepOrder[currentStepIndex - 1]);
  }, [
    currentStepIndex,
    flowStep,
    mainNote,
    router,
    setStep,
    stepOrder,
  ]);

  const handleGoHome = useCallback(() => {
    router.push("/home");
  }, [router]);

  return { handleBack, handleGoHome };
}
