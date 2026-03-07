"use client";

import { useOnboardingTourControls } from "@/components/onboarding/useOnboardingTourControls";
import type { OnboardingStep } from "@/components/onboarding/OnboardingTour";
import {
  UNIFIED_TOUR_BASE_TOTAL,
  persistUnifiedTourProgress,
  resolveUnifiedSegmentStartStep,
} from "@/components/onboarding/unifiedOnboarding";
import { useEffect, useMemo, useRef } from "react";

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
  const suppressedStepKeyRef = useRef<string | null>(null);
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
  const localStep = useMemo(
    () => resolveUnifiedSegmentStartStep(offset, steps.length),
    [offset, steps.length],
  );
  const localStepKey = localStep === null ? null : `${offset}:${localStep}`;

  useEffect(() => {
    if (localStepKey === null) {
      suppressedStepKeyRef.current = null;
      return;
    }
    if (suppressedStepKeyRef.current && suppressedStepKeyRef.current !== localStepKey) {
      suppressedStepKeyRef.current = null;
    }
  }, [localStepKey]);

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
    if (localStep === null) return;
    if (suppressedStepKeyRef.current === localStepKey) return;
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
    localStep,
    localStepKey,
    setCurrentStep,
    setIsOpen,
    steps,
  ]);

  const suppressCurrentStep = () => {
    suppressedStepKeyRef.current =
      localStepKey ?? `${offset}:${Math.max(0, Math.min(currentStep, steps.length - 1))}`;
  };

  const handleFinish = (stepIndex: number) => {
    suppressCurrentStep();
    onFinish(stepIndex);
  };

  const handleClose = (stepIndex: number) => {
    suppressCurrentStep();
    onClose(stepIndex);
  };

  const handleMaskClick = (stepIndex: number) => {
    suppressCurrentStep();
    onMaskClick(stepIndex);
  };

  return {
    steps,
    progress,
    isOpen,
    setIsOpen,
    currentStep,
    setCurrentStep,
    onFinish: handleFinish,
    onClose: handleClose,
    onMaskClick: handleMaskClick,
  };
}
