"use client";

import {
  driver,
  type Alignment,
  type Driver,
  type DriveStep,
  type Side,
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
  stepTrigger?: number;
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
  stepTrigger,
  onClose,
  onMaskClick,
  onFinish,
}: OnboardingTourProps) {
  const driverRef = useRef<Driver | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);

  const cleanupDriver = () => {
    driverRef.current?.destroy();
    driverRef.current = null;
    document.documentElement.classList.remove("driver-active");
    document.body.classList.remove("driver-active");
    document
      .querySelectorAll(
        ".driver-popover, .driver-overlay, .driver-active-element, .driver-stage",
      )
      .forEach((node) => node.remove());
  };

  const pruneDriverDom = () => {
    const popovers = Array.from(document.querySelectorAll(".driver-popover"));
    if (popovers.length > 1) {
      popovers.slice(0, -1).forEach((node) => node.remove());
    }
    const overlays = Array.from(document.querySelectorAll(".driver-overlay"));
    if (overlays.length > 1) {
      overlays.slice(0, -1).forEach((node) => node.remove());
    }
  };

  const ensureHighlightBox = () => {
    if (highlightRef.current) return highlightRef.current;
    const box = document.createElement("div");
    box.className = "onboarding-highlight-box";
    Object.assign(box.style, {
      position: "fixed",
      outline: "2px solid rgba(242, 201, 109, 0.95)",
      outlineOffset: "1px",
      background: "transparent",
      borderRadius: "16px",
      boxShadow: "none",
      pointerEvents: "none",
      zIndex: "10001",
      transition: "none",
    });
    document.body.appendChild(box);
    highlightRef.current = box;
    return box;
  };

  const removeHighlightBox = () => {
    highlightRef.current?.remove();
    highlightRef.current = null;
  };

  const updateHighlightBox = (element?: Element) => {
    const target = element instanceof Element ? element : null;
    if (!target) {
      removeHighlightBox();
      return;
    }
    const rect = target.getBoundingClientRect();
    const padding = 10;
    const box = ensureHighlightBox();
    Object.assign(box.style, {
      left: `${Math.max(0, rect.left - padding)}px`,
      top: `${Math.max(0, rect.top - padding)}px`,
      width: `${Math.max(0, rect.width + padding * 2)}px`,
      height: `${Math.max(0, rect.height + padding * 2)}px`,
      display: "block",
    });
  };

  useEffect(() => {
    return () => {
      cleanupDriver();
      removeHighlightBox();
    };
  }, []);

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
      cleanupDriver();
      removeHighlightBox();
      return;
    }

    if (!driverRef.current) {
      driverRef.current = driver({
        animate: false,
        overlayOpacity: 0.4,
        overlayColor: "#05070a",
        smoothScroll: false,
        allowClose: true,
        stageRadius: 16,
        stagePadding: 10,
        popoverClass: "onboarding-popover",
        popoverOffset: 12,
        showProgress: true,
        progressText: "{{current}} / {{total}}",
        showButtons: ["previous", "next", "close"],
        nextBtnText: "다음",
        prevBtnText: "이전",
        doneBtnText: "완료",
        onPopoverRender: (popover, opts) => {
          const isLast =
            opts.state.activeIndex === (opts.config.steps?.length ?? 0) - 1;
          popover.nextButton.innerHTML = isLast ? "✓" : "→";
          popover.previousButton.innerHTML = "←";
          popover.nextButton.setAttribute(
            "aria-label",
            isLast ? "완료" : "다음",
          );
          popover.previousButton.setAttribute("aria-label", "이전");
          popover.closeButton.setAttribute("aria-label", "닫기");
        },
        onHighlightStarted: () => {
          const index = driverRef.current?.getActiveIndex();
          if (typeof index === "number") {
            setCurrentStep(index);
          }
        },
        onHighlighted: (element) => {
          updateHighlightBox(element);
          pruneDriverDom();
        },
        onDeselected: () => {
          removeHighlightBox();
        },
        onNextClick: () => {
          const instance = driverRef.current;
          if (!instance) return;
          if (instance.isLastStep()) {
            const index = instance.getActiveIndex() ?? currentStep;
            onFinish?.(index);
            setIsOpen(false);
            cleanupDriver();
            removeHighlightBox();
            return;
          }
          instance.moveNext();
        },
        onPrevClick: () => {
          driverRef.current?.movePrevious();
          window.requestAnimationFrame(pruneDriverDom);
        },
        onCloseClick: () => {
          const index = driverRef.current?.getActiveIndex() ?? currentStep;
          onClose?.(index);
          setIsOpen(false);
          cleanupDriver();
          removeHighlightBox();
        },
        overlayClickBehavior: () => {
          const index = driverRef.current?.getActiveIndex() ?? currentStep;
          onMaskClick?.(index);
          setIsOpen(false);
          cleanupDriver();
          removeHighlightBox();
        },
        onDestroyed: () => {
          driverRef.current = null;
          removeHighlightBox();
          setIsOpen(false);
        },
      });
    }
  }, [
    currentStep,
    isOpen,
    onClose,
    onFinish,
    onMaskClick,
    setCurrentStep,
    setIsOpen,
  ]);

  useEffect(() => {
    if (!isOpen || !driverRef.current) return;
    if (driveSteps.length === 0) return;
    const instance = driverRef.current;
    instance.setSteps(driveSteps);
    if (!instance.isActive()) {
      instance.drive(currentStep);
    }
  }, [currentStep, driveSteps, isOpen]);

  useEffect(() => {
    if (!isOpen || !driverRef.current) return;
    if (driveSteps.length === 0) return;
    if (!driverRef.current.isActive()) return;
    driverRef.current.moveTo(currentStep);
    window.requestAnimationFrame(pruneDriverDom);
  }, [currentStep, driveSteps.length, isOpen, stepTrigger]);

  return null;
}
