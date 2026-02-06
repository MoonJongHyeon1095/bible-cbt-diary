"use client";

import { driver, type Driver, type DriveStep, type Side, type Alignment } from "driver.js";
import { useEffect, useMemo, useRef } from "react";

export type OnboardingStep = {
  selector: string;
  content: string;
  side?: Side;
  align?: Alignment;
};

type OnboardingTourProps = {
  steps: OnboardingStep[];
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  onClose?: (stepIndex: number) => void;
  onMaskClick?: (stepIndex: number) => void;
  onFinish?: (stepIndex: number) => void;
};

export default function OnboardingTour({
  steps,
  isOpen,
  setIsOpen,
  currentStep,
  setCurrentStep,
  onClose,
  onMaskClick,
  onFinish,
}: OnboardingTourProps) {
  const driverRef = useRef<Driver | null>(null);

  const driveSteps = useMemo<DriveStep[]>(
    () =>
      steps.map((step) => ({
        element: step.selector,
        popover: {
          description: step.content,
          side: step.side ?? "bottom",
          align: step.align ?? "center",
        },
      })),
    [steps],
  );

  useEffect(() => {
    if (!isOpen) {
      driverRef.current?.destroy();
      driverRef.current = null;
      return;
    }

    if (!driverRef.current) {
      driverRef.current = driver({
        animate: false,
        overlayOpacity: 0.7,
        overlayColor: "#05070a",
        smoothScroll: false,
        allowClose: true,
        stageRadius: 16,
        stagePadding: 10,
        popoverClass: "onboarding-popover",
        showProgress: true,
        progressText: "{{current}} / {{total}}",
        nextBtnText: "다음",
        prevBtnText: "이전",
        doneBtnText: "완료",
        onHighlightStarted: () => {
          const index = driverRef.current?.getActiveIndex();
          if (typeof index === "number") {
            setCurrentStep(index);
          }
        },
        onNextClick: () => {
          const instance = driverRef.current;
          if (!instance) return;
          if (instance.isLastStep()) {
            const index = instance.getActiveIndex() ?? currentStep;
            onFinish?.(index);
            setIsOpen(false);
            instance.destroy();
            return;
          }
          instance.moveNext();
        },
        onPrevClick: () => {
          driverRef.current?.movePrevious();
        },
        onCloseClick: () => {
          const instance = driverRef.current;
          if (!instance) return;
          const index = instance.getActiveIndex() ?? currentStep;
          onClose?.(index);
          setIsOpen(false);
          instance.destroy();
        },
        overlayClickBehavior: () => {
          const instance = driverRef.current;
          if (!instance) return;
          const index = instance.getActiveIndex() ?? currentStep;
          onMaskClick?.(index);
          setIsOpen(false);
          instance.destroy();
        },
        onDestroyed: () => {
          setIsOpen(false);
        },
      });
    }
  }, [currentStep, isOpen, onClose, onFinish, onMaskClick, setCurrentStep, setIsOpen]);

  useEffect(() => {
    if (!isOpen || !driverRef.current) return;
    if (driveSteps.length === 0) return;
    driverRef.current.setSteps(driveSteps);
    const activeIndex = driverRef.current.getActiveIndex();
    if (!driverRef.current.isActive() || activeIndex !== currentStep) {
      driverRef.current.drive(currentStep);
    }
  }, [currentStep, driveSteps, isOpen]);

  return null;
}
