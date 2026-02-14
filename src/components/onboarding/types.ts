import type { Alignment, Side } from "driver.js";
import type { Dispatch, SetStateAction } from "react";

export type OnboardingStep = {
  selector: string;
  content: string;
  side?: Side;
  align?: Alignment;
  completeOnTargetClick?: boolean;
};

export type OnboardingProgress = {
  offset: number;
  total: number;
};

export type OnboardingTourProps = {
  steps: OnboardingStep[];
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  stepTrigger?: number;
  progress?: OnboardingProgress;
  onClose?: (stepIndex: number) => void;
  onMaskClick?: (stepIndex: number) => void;
  onFinish?: (stepIndex: number) => void;
};
