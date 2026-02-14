import { useCallback } from "react";
import type { DeepStep } from "@/components/session/hooks/useCbtDeepSessionFlow";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { clearCbtSessionStorage } from "@/lib/storage/session/cbtSessionStorage";
import { flowRoutes } from "@/components/flow/domain/navigation/flowRoutes";

type UseDeepSessionNavigationHandlersParams = {
  flowStep: DeepStep;
  currentStepIndex: number;
  stepOrder: DeepStep[];
  autoThoughtWantsCustom: boolean;
  setWantsCustom: (value: boolean) => void;
  flowId: number | null;
  mainNote: EmotionNote | null;
  setStep: (step: DeepStep) => void;
  router: { push: (path: string) => void };
};

export function useDeepSessionNavigationHandlers({
  flowStep,
  currentStepIndex,
  stepOrder,
  autoThoughtWantsCustom,
  setWantsCustom,
  flowId,
  mainNote,
  setStep,
  router,
}: UseDeepSessionNavigationHandlersParams) {
  const handleBack = useCallback(() => {
    if (flowStep === "select") {
      if (flowId && mainNote) {
        router.push(flowRoutes.byFlowAndNote(flowId, mainNote.id));
      }
      return;
    }
    if (currentStepIndex <= 0) return;
    if (flowStep === "thought" && autoThoughtWantsCustom) {
      setWantsCustom(false);
      return;
    }
    setStep(stepOrder[currentStepIndex - 1]);
  }, [
    autoThoughtWantsCustom,
    currentStepIndex,
    flowId,
    flowStep,
    mainNote,
    router,
    setStep,
    setWantsCustom,
    stepOrder,
  ]);

  const handleGoHome = useCallback(() => {
    clearCbtSessionStorage();
    router.push("/home");
  }, [router]);

  return { handleBack, handleGoHome };
}
