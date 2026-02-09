"use client";

import { useCallback, useState } from "react";

type UseOnboardingTourControlsOptions = {
  onPersist?: (stepIndex: number) => void;
};

export function useOnboardingTourControls(
  options: UseOnboardingTourControlsOptions = {},
) {
  const { onPersist } = options;
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handlePersist = useCallback(
    (stepIndex: number) => {
      onPersist?.(stepIndex);
    },
    [onPersist],
  );

  return {
    isOpen,
    setIsOpen,
    currentStep,
    setCurrentStep,
    onFinish: handlePersist,
    onClose: handlePersist,
    onMaskClick: handlePersist,
  };
}
