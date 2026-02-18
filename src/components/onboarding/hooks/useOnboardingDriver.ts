"use client";

import { driver, type DriveStep, type Driver } from "driver.js";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { OnboardingProgress, OnboardingTourProps } from "../types";

type UseOnboardingDriverParams = Pick<
  OnboardingTourProps,
  | "steps"
  | "isOpen"
  | "setIsOpen"
  | "currentStep"
  | "setCurrentStep"
  | "stepTrigger"
  | "progress"
  | "onClose"
  | "onMaskClick"
  | "onFinish"
>;

export function useOnboardingDriver({
  steps,
  isOpen,
  setIsOpen,
  currentStep,
  setCurrentStep,
  stepTrigger,
  progress,
  onClose,
  onMaskClick,
  onFinish,
}: UseOnboardingDriverParams) {
  const driverRef = useRef<Driver | null>(null);
  const progressRef = useRef<OnboardingProgress | null>(progress ?? null);
  const targetClickCleanupRef = useRef<(() => void) | null>(null);
  const refreshRafRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const revealFallbackTimerRef = useRef<number | null>(null);
  const revealCleanupRef = useRef<(() => void) | null>(null);

  const setPopoverHidden = useCallback((hidden: boolean) => {
    document.documentElement.classList.toggle("onboarding-popover-hidden", hidden);
    document.body.classList.toggle("onboarding-popover-hidden", hidden);
    document
      .querySelectorAll<HTMLElement>(".driver-popover")
      .forEach((node) => node.classList.toggle("onboarding-popover--hidden", hidden));
  }, []);

  const clearRevealTimers = useCallback(() => {
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    if (revealFallbackTimerRef.current !== null) {
      window.clearTimeout(revealFallbackTimerRef.current);
      revealFallbackTimerRef.current = null;
    }
    revealCleanupRef.current?.();
    revealCleanupRef.current = null;
  }, []);

  const cleanupDriver = useCallback(() => {
    clearRevealTimers();
    setPopoverHidden(false);
    if (refreshRafRef.current !== null) {
      window.cancelAnimationFrame(refreshRafRef.current);
      refreshRafRef.current = null;
    }
    targetClickCleanupRef.current?.();
    targetClickCleanupRef.current = null;
    driverRef.current?.destroy();
    driverRef.current = null;
    document.documentElement.classList.remove("driver-active");
    document.body.classList.remove("driver-active");
    document
      .querySelectorAll(
        ".driver-popover, .driver-overlay, .driver-active-element, .driver-stage",
      )
      .forEach((node) => node.remove());
  }, [clearRevealTimers, setPopoverHidden]);

  const pruneDriverDom = useCallback(() => {
    const popovers = Array.from(document.querySelectorAll(".driver-popover"));
    if (popovers.length > 1) {
      popovers.slice(0, -1).forEach((node) => node.remove());
    }
    const overlays = Array.from(document.querySelectorAll(".driver-overlay"));
    if (overlays.length > 1) {
      overlays.slice(0, -1).forEach((node) => node.remove());
    }
  }, []);

  const hasBlockingModal = useCallback(() => {
    if (document.body.dataset.modalOpen === "true") return true;
    return Boolean(
      document.querySelector(
        '[role="dialog"][aria-modal="true"]:not(.driver-popover):not(.driver-overlay)',
      ),
    );
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshRafRef.current !== null) return;
    refreshRafRef.current = window.requestAnimationFrame(() => {
      refreshRafRef.current = null;
      const instance = driverRef.current;
      if (!instance || !instance.isActive()) return;
      instance.refresh();
      pruneDriverDom();
    });
  }, [pruneDriverDom]);

  const shouldAutoScrollTarget = useCallback((target: HTMLElement) => {
    const style = window.getComputedStyle(target);
    return style.position !== "fixed" && style.position !== "sticky";
  }, []);

  const isNearViewportCenter = useCallback((target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const targetCenter = rect.top + rect.height / 2;
    return Math.abs(targetCenter - viewportCenter) <= 72;
  }, []);

  useEffect(() => {
    return () => {
      cleanupDriver();
    };
  }, [cleanupDriver]);

  useEffect(() => {
    progressRef.current = progress ?? null;
  }, [progress]);

  const driveSteps = useMemo<DriveStep[]>(
    () =>
      steps.map((step) => ({
        ...(step.selector ? { element: step.selector } : {}),
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

    if (hasBlockingModal()) {
      cleanupDriver();
      setIsOpen(false);
      return;
    }

    if (!driverRef.current) {
      const driverOptions = {
        animate: false,
        overlayOpacity: 0.75,
        overlayColor: "#05070a",
        smoothScroll: true,
        scrollIntoViewOptions: {
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        },
        allowClose: false,
        stageRadius: 24,
        stagePadding: 12,
        popoverClass: "onboarding-popover",
        popoverOffset: 12,
        showProgress: true,
        progressText: "{{current}} / {{total}}",
        showButtons: ["previous", "next"],
        nextBtnText: "다음",
        prevBtnText: "이전",
        doneBtnText: "완료",
        onPopoverRender: (popover, opts) => {
          const activeIndex = opts.state.activeIndex ?? 0;
          const isLast = activeIndex === (opts.config.steps?.length ?? 0) - 1;
          popover.nextButton.innerHTML = isLast ? "✓" : "→";
          popover.previousButton.innerHTML = "←";
          popover.nextButton.setAttribute(
            "aria-label",
            isLast ? "완료" : "다음",
          );
          popover.previousButton.setAttribute("aria-label", "이전");
          if (popover.closeButton) {
            popover.closeButton.setAttribute("aria-label", "닫기");
          }

          const activeProgress = progressRef.current;
          if (activeProgress) {
            const progressNode = popover.wrapper.querySelector(
              ".driver-popover-progress-text",
            );
            if (progressNode) {
              const current = activeProgress.offset + activeIndex + 1;
              progressNode.textContent = `${current} / ${activeProgress.total}`;
            }
          }

          const isFirstGlobalStep =
            activeProgress && activeProgress.offset + activeIndex === 0;
          popover.wrapper.classList.add("onboarding-popover--has-skip");
          popover.wrapper.classList.remove("onboarding-popover--no-skip");
          if (isFirstGlobalStep) {
            if (popover.nextButton) {
              popover.nextButton.style.display = "";
              popover.nextButton.innerHTML = "✓";
              popover.nextButton.setAttribute("aria-label", "확인");
            }
            if (popover.previousButton) {
              popover.previousButton.style.display = "none";
            }
          } else {
            if (popover.nextButton) {
              popover.nextButton.style.display = "";
            }
            if (popover.previousButton) {
              popover.previousButton.style.display =
                activeIndex > 0 ? "" : "none";
            }
          }

          if (popover.wrapper) {
            let skipButton = popover.wrapper.querySelector<HTMLButtonElement>(
              ".onboarding-popover__skip",
            );
            if (!skipButton) {
              skipButton = document.createElement("button");
              skipButton.type = "button";
              skipButton.className = "onboarding-popover__skip";
              skipButton.textContent = "Skip";
              skipButton.tabIndex = -1;
              popover.wrapper.appendChild(skipButton);
            }
            skipButton.onclick = () => {
              const lastLocalIndex = Math.max(0, steps.length - 1);
              onClose?.(lastLocalIndex);
              setIsOpen(false);
              cleanupDriver();
            };
          }

        },
        onHighlightStarted: () => {
          const index = driverRef.current?.getActiveIndex();
          if (typeof index === "number") {
            targetClickCleanupRef.current?.();
            targetClickCleanupRef.current = null;
            setCurrentStep(index);
            const activeStep = steps[index];
            const selector = activeStep?.selector;
            if (selector) {
              const target = document.querySelector(selector);
              if (target instanceof HTMLElement) {
                if (shouldAutoScrollTarget(target)) {
                  clearRevealTimers();
                  const needsRevealDelay =
                    Boolean(activeStep?.hidePopoverDuringScroll) &&
                    !isNearViewportCenter(target);
                  if (needsRevealDelay) {
                    setPopoverHidden(true);
                    const reveal = () => {
                      clearRevealTimers();
                      setPopoverHidden(false);
                      scheduleRefresh();
                    };
                    const onScroll = () => {
                      if (revealTimerRef.current !== null) {
                        window.clearTimeout(revealTimerRef.current);
                      }
                      revealTimerRef.current = window.setTimeout(() => {
                        if (isNearViewportCenter(target)) {
                          reveal();
                        }
                      }, 120);
                    };
                    window.addEventListener("scroll", onScroll, {
                      capture: true,
                      passive: true,
                    });
                    revealCleanupRef.current = () => {
                      window.removeEventListener("scroll", onScroll, true);
                    };
                    revealFallbackTimerRef.current = window.setTimeout(reveal, 900);
                  }
                  target.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "nearest",
                  });
                }
                if (activeStep?.completeOnTargetClick) {
                  const handleTargetClick = () => {
                    const activeIndex =
                      driverRef.current?.getActiveIndex() ?? index;
                    onFinish?.(activeIndex);
                    setIsOpen(false);
                    cleanupDriver();
                  };
                  target.addEventListener("click", handleTargetClick, {
                    capture: true,
                    once: true,
                  });
                  targetClickCleanupRef.current = () => {
                    target.removeEventListener("click", handleTargetClick, {
                      capture: true,
                    });
                  };
                }
              }
            }
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
          onMaskClick?.(driverRef.current?.getActiveIndex() ?? currentStep);
        },
        onDestroyed: () => {
          driverRef.current = null;
          setIsOpen(false);
        },
      } as Parameters<typeof driver>[0];
      driverRef.current = driver(driverOptions);
    }
  }, [
    cleanupDriver,
    currentStep,
    hasBlockingModal,
    isOpen,
    onClose,
    onFinish,
    onMaskClick,
    scheduleRefresh,
    clearRevealTimers,
    isNearViewportCenter,
    pruneDriverDom,
    shouldAutoScrollTarget,
    setPopoverHidden,
    setCurrentStep,
    setIsOpen,
    steps,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    const closeIfBlocked = () => {
      if (!hasBlockingModal()) return;
      cleanupDriver();
      setIsOpen(false);
    };

    closeIfBlocked();
    scheduleRefresh();

    const observer = new MutationObserver(() => {
      if (hasBlockingModal()) {
        closeIfBlocked();
        return;
      }
      scheduleRefresh();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-modal-open"],
      childList: true,
      subtree: true,
    });

    const handleViewportChange = () => {
      scheduleRefresh();
    };

    window.addEventListener("resize", handleViewportChange, { passive: true });
    window.addEventListener("scroll", handleViewportChange, {
      capture: true,
      passive: true,
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [cleanupDriver, hasBlockingModal, isOpen, scheduleRefresh, setIsOpen]);

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
  }, [currentStep, driveSteps.length, isOpen, pruneDriverDom, stepTrigger]);
}
