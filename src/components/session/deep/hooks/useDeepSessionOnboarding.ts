import { useCallback, useEffect, useMemo } from "react";
import type { OnboardingStep } from "@/components/onboarding/OnboardingTour";
import { useOnboardingTourControls } from "@/components/onboarding/useOnboardingTourControls";
import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import {
  DEEP_SESSION_ONBOARDING_COMPLETE_KEY,
  DEEP_SESSION_ONBOARDING_PREFIX,
} from "@/lib/storage/keys/onboarding";
import type { DeepStep } from "@/components/session/hooks/useCbtDeepSessionFlow";

type TourProgress = {
  lastStep: number;
  lastTotal: number;
};

type UseDeepSessionOnboardingParams = {
  flowStep: DeepStep;
  isAccessLoading: boolean;
  accessStateMode: "auth" | "guest" | "blocked";
  canShowOnboarding: boolean;
  blocker: "update" | "updateNotice" | "terms" | "notice" | null;
};

export function useDeepSessionOnboarding({
  flowStep,
  isAccessLoading,
  accessStateMode,
  canShowOnboarding,
  blocker,
}: UseDeepSessionOnboardingParams) {
  const tourSteps = useMemo<OnboardingStep[]>(() => {
    if (flowStep === "select") {
      return [
        {
          selector: "[data-tour='deep-select-main']",
          side: "bottom",
          content: "핵심이 되는 메인 기록이에요.",
        },
        {
          selector: "[data-tour='deep-select-list']",
          side: "bottom",
          content: "연결할 기록을 1~2개 골라주세요.",
        },
        {
          selector: "[data-tour='deep-select-next']",
          side: "bottom",
          content: "이 조합으로 심화 세션을 시작해요.",
        },
      ];
    }
    if (flowStep === "incident") {
      return [
        {
          selector: "[data-tour='deep-incident-input']",
          side: "bottom",
          content: "이번엔 더 차분히 상황을 다시 적어봐요.",
        },
      ];
    }
    if (flowStep === "emotion") {
      return [
        {
          selector: "[data-tour='emotion-grid']",
          side: "bottom",
          content:
            "지금 가장 비슷한 감정을 골라주세요.\n클릭하면 감정에 대한 설명을 볼 수 있어요.",
        },
      ];
    }
    return [];
  }, [flowStep]);

  const persistTourProgress = useCallback(
    (stepIndex: number) => {
      if (!safeLocalStorage.isAvailable()) return;
      const storageKey = `${DEEP_SESSION_ONBOARDING_PREFIX}:${flowStep}`;
      safeLocalStorage.setItem(
        storageKey,
        JSON.stringify({
          lastStep: stepIndex,
          lastTotal: tourSteps.length,
        }),
      );
      if (stepIndex >= Math.max(0, tourSteps.length - 1)) {
        safeLocalStorage.setItem(DEEP_SESSION_ONBOARDING_COMPLETE_KEY, "true");
      }
    },
    [flowStep, tourSteps.length],
  );

  const {
    isOpen: isTourOpen,
    setIsOpen: setIsTourOpen,
    currentStep: tourStep,
    setCurrentStep: setTourStep,
    onFinish: handleTourFinish,
    onClose: handleTourClose,
    onMaskClick: handleTourMaskClick,
  } = useOnboardingTourControls({ onPersist: persistTourProgress });

  useEffect(() => {
    if (blocker && isTourOpen) {
      setIsTourOpen(false);
    }
  }, [blocker, isTourOpen, setIsTourOpen]);

  useEffect(() => {
    if (!safeLocalStorage.isAvailable()) return;
    if (isAccessLoading) return;
    if (accessStateMode !== "auth") return;
    if (!canShowOnboarding) return;
    if (isTourOpen) return;
    if (tourSteps.length === 0) return;
    const isCompleted =
      safeLocalStorage.getItem(DEEP_SESSION_ONBOARDING_COMPLETE_KEY) === "true";
    if (isCompleted) return;
    const storageKey = `${DEEP_SESSION_ONBOARDING_PREFIX}:${flowStep}`;
    const stored = safeLocalStorage.getItem(storageKey);
    const maxStepIndex = tourSteps.length - 1;
    let progress: TourProgress | null = null;
    if (stored) {
      try {
        progress = JSON.parse(stored) as TourProgress;
      } catch {
        progress = null;
      }
    }

    if (!progress) {
      setTourStep(0);
      setIsTourOpen(true);
      return;
    }

    if (tourSteps.length > progress.lastTotal) {
      const nextStep = Math.max(
        0,
        Math.min(progress.lastStep + 1, maxStepIndex),
      );
      setTourStep(nextStep);
      setIsTourOpen(true);
    }
  }, [
    isAccessLoading,
    accessStateMode,
    isTourOpen,
    canShowOnboarding,
    flowStep,
    tourSteps.length,
    setIsTourOpen,
    setTourStep,
  ]);

  return {
    tourSteps,
    isTourOpen,
    setIsTourOpen,
    tourStep,
    setTourStep,
    handleTourFinish,
    handleTourClose,
    handleTourMaskClick,
  };
}
