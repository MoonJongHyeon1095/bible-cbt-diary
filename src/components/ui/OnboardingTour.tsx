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

  useEffect(() => {
    return () => {
      cleanupDriver();
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
      return;
    }

    if (!driverRef.current) {
      driverRef.current = driver({
        animate: false,
        overlayOpacity: 0.75,
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

          const existingBadge = popover.wrapper.querySelector(
            ".onboarding-popover__badge",
          );
          if (!existingBadge) {
            const badge = document.createElement("div");
            badge.className = "onboarding-popover__badge";

            const label = document.createElement("span");
            label.className = "onboarding-popover__badge-text";
            label.textContent = "EDi";
            badge.appendChild(label);

            const icon = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg",
            );
            icon.setAttribute("viewBox", "0 0 24 24");
            icon.setAttribute("fill", "none");
            icon.setAttribute("stroke", "currentColor");
            icon.setAttribute("stroke-width", "2");
            icon.setAttribute("stroke-linecap", "round");
            icon.setAttribute("stroke-linejoin", "round");
            icon.setAttribute("aria-hidden", "true");
            icon.classList.add("onboarding-popover__badge-icon");

            const pathMain = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path",
            );
            pathMain.setAttribute(
              "d",
              "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
            );

            const dot1 = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path",
            );
            dot1.setAttribute("d", "M8 12h.01");

            const dot2 = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path",
            );
            dot2.setAttribute("d", "M12 12h.01");

            const dot3 = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path",
            );
            dot3.setAttribute("d", "M16 12h.01");

            icon.appendChild(pathMain);
            icon.appendChild(dot1);
            icon.appendChild(dot2);
            icon.appendChild(dot3);
            badge.appendChild(icon);

            popover.wrapper.insertBefore(badge, popover.description);
          }
        },
        onHighlightStarted: () => {
          const index = driverRef.current?.getActiveIndex();
          if (typeof index === "number") {
            setCurrentStep(index);
          }
        },
        onHighlighted: () => {
          pruneDriverDom();
        },
        onNextClick: () => {
          const instance = driverRef.current;
          if (!instance) return;
          if (instance.isLastStep()) {
            const index = instance.getActiveIndex() ?? currentStep;
            onFinish?.(index);
            setIsOpen(false);
            cleanupDriver();
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
        },
        overlayClickBehavior: () => {
          const index = driverRef.current?.getActiveIndex() ?? currentStep;
          onMaskClick?.(index);
          setIsOpen(false);
          cleanupDriver();
        },
        onDestroyed: () => {
          driverRef.current = null;
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
