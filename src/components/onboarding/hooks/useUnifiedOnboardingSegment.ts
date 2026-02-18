"use client";

import { useOnboardingTourControls } from "@/components/onboarding/useOnboardingTourControls";
import type { OnboardingStep } from "@/components/onboarding/OnboardingTour";
import {
  UNIFIED_TOUR_BASE_TOTAL,
  persistUnifiedTourProgress,
  resolveUnifiedSegmentStartStep,
} from "@/components/onboarding/unifiedOnboarding";
import { useEffect, useMemo } from "react";

type UseUnifiedOnboardingSegmentOptions = {
  steps: OnboardingStep[];
  offset: number;
  canShow: boolean;
  blocked: boolean;
};

export function useUnifiedOnboardingSegment({
  steps,
  offset,
  canShow,
  blocked,
}: UseUnifiedOnboardingSegmentOptions) {
  const progress = useMemo(
    () => ({
      offset,
      total: UNIFIED_TOUR_BASE_TOTAL,
    }),
    [offset],
  );

  const {
    isOpen,
    setIsOpen,
    currentStep,
    setCurrentStep,
    onFinish,
    onClose,
    onMaskClick,
  } = useOnboardingTourControls({
    onPersist: (stepIndex) => {
      const normalizedIndex = Math.max(0, Math.min(stepIndex, steps.length - 1));
      persistUnifiedTourProgress(
        offset + normalizedIndex,
        UNIFIED_TOUR_BASE_TOTAL,
      );
    },
  });

  useEffect(() => {
    if (blocked && isOpen) {
      setIsOpen(false);
    }
  }, [blocked, isOpen, setIsOpen]);

  useEffect(() => {
    if (!canShow && isOpen) {
      setIsOpen(false);
    }
  }, [canShow, isOpen, setIsOpen]);

  useEffect(() => {
    if (!canShow) return;
    if (blocked) return;
    if (isOpen) return;
    const localStep = resolveUnifiedSegmentStartStep(offset, steps.length);
    if (localStep === null) return;
    const targetSelector = steps[localStep]?.selector;
    if (targetSelector) {
      const targetElement = document.querySelector(targetSelector);
      if (!(targetElement instanceof HTMLElement)) return;
    }
    if (currentStep !== localStep) {
      setCurrentStep(localStep);
    }
    setIsOpen(true);
  }, [
    blocked,
    canShow,
    currentStep,
    isOpen,
    offset,
    setCurrentStep,
    setIsOpen,
    steps,
  ]);

  return {
    steps,
    progress,
    isOpen,
    setIsOpen,
    currentStep,
    setCurrentStep,
    onFinish,
    onClose,
    onMaskClick,
  };
}
