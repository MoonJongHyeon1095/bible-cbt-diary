"use client";

import {
  driver,
  type Driver,
  type DriveStep,
  type Side,
  type Alignment,
} from "driver.js";
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
  const lastActionRef = useRef<"close" | "mask" | "finish" | null>(null);

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
        showButtons: ["previous", "next", "close"],
        nextBtnText: "다음",
        prevBtnText: "이전",
        doneBtnText: "완료",
        onPopoverRender: (popover, opts) => {
          const isLast = opts.state.activeIndex === (opts.config.steps?.length ?? 0) - 1;
          popover.nextButton.innerHTML = isLast ? "✓" : "→";
          popover.previousButton.innerHTML = "←";
          popover.nextButton.setAttribute("aria-label", isLast ? "완료" : "다음");
          popover.previousButton.setAttribute("aria-label", "이전");
          popover.closeButton.setAttribute("aria-label", "닫기");
        },
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
            lastActionRef.current = "finish";
            instance.destroy();
            return;
          }
          instance.moveNext();
        },
        onPrevClick: () => {
          driverRef.current?.movePrevious();
        },
        onCloseClick: () => {
          lastActionRef.current = "close";
          driverRef.current?.destroy();
        },
        overlayClickBehavior: () => {
          lastActionRef.current = "mask";
          driverRef.current?.destroy();
        },
        onDestroyStarted: () => {
          if (!lastActionRef.current && driverRef.current?.isLastStep()) {
            lastActionRef.current = "finish";
          }
        },
        onDestroyed: () => {
          const index = driverRef.current?.getActiveIndex() ?? currentStep;
          const action = lastActionRef.current;
          lastActionRef.current = null;
          if (action === "finish") {
            onFinish?.(index);
          } else if (action === "mask") {
            onMaskClick?.(index);
          } else if (action === "close") {
            onClose?.(index);
          }
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
