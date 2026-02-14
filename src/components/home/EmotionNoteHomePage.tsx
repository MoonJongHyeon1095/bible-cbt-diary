"use client";

import pageStyles from "@/app/page.module.css";
import { useGate } from "@/components/gate/GateProvider";
import AppHeader from "@/components/header/AppHeader";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import {
  UNIFIED_TOUR_BASE_TOTAL,
  UNIFIED_TOUR_STORAGE_KEY,
} from "@/components/onboarding/unifiedOnboarding";
import { useOnboardingTourControls } from "@/components/onboarding/useOnboardingTourControls";
import sessionStyles from "@/components/session/minimal/MinimalStyles.module.css";
import SafeButton from "@/components/ui/SafeButton";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import { HOME_TOUR_STORAGE_KEY } from "@/lib/storage/keys/onboarding";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import homeStyles from "./EmotionNoteHomePage.module.css";
import { HOME_ONBOARDING_STEPS } from "./onboarding/homeOnboarding";

export default function EmotionNoteHomePage() {
  const router = useRouter();
  const { blocker, canShowOnboarding } = useGate();
  const { checkUsage } = useAiUsageGuard({
    enabled: false,
    cache: true,
    redirectTo: null,
  });
  const [isStartLoading, setIsStartLoading] = useState(false);
  const todayLabel = useMemo(
    () =>
      formatKoreanDateTime(new Date(), {
        month: "long",
        day: "numeric",
        weekday: "short",
      }),
    [],
  );
  const {
    isOpen: isTourOpen,
    setIsOpen: setIsTourOpen,
    currentStep,
    setCurrentStep,
    onFinish,
    onClose,
    onMaskClick,
  } = useOnboardingTourControls({
    onPersist: () => {
      if (!safeLocalStorage.isAvailable()) return;
      safeLocalStorage.setItem(HOME_TOUR_STORAGE_KEY, "true");
      safeLocalStorage.setItem(
        UNIFIED_TOUR_STORAGE_KEY,
        JSON.stringify({
          lastStep: 0,
          lastTotal: UNIFIED_TOUR_BASE_TOTAL,
        }),
      );
    },
  });

  useEffect(() => {
    if (blocker && isTourOpen) {
      setIsTourOpen(false);
    }
  }, [blocker, isTourOpen, setIsTourOpen]);

  useEffect(() => {
    if (!safeLocalStorage.isAvailable()) return;
    if (!canShowOnboarding) return;
    if (isTourOpen) return;
    if (safeLocalStorage.getItem(HOME_TOUR_STORAGE_KEY) === "true") return;
    setCurrentStep(0);
    setIsTourOpen(true);
  }, [canShowOnboarding, isTourOpen, setCurrentStep, setIsTourOpen]);

  const startSession = async () => {
    try {
      const allowed = await checkUsage();
      if (!allowed) {
        return false;
      }
      router.push("/session");
      return true;
    } catch {
      return false;
    }
  };

  const handleStartSession = async (event: MouseEvent<HTMLButtonElement>) => {
    if (isStartLoading) {
      return;
    }
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    setIsStartLoading(true);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    const started = await startSession();
    if (!started) {
      setIsStartLoading(false);
    }
  };

  return (
    <div className={sessionStyles.page}>
      <div className={sessionStyles.bgWaves} />
      <div className={`${sessionStyles.content} ${homeStyles.content}`}>
        <AppHeader />
        <main className={`${pageStyles.main} ${homeStyles.main}`}>
          <div className={`${pageStyles.shell} ${homeStyles.shell}`}>
            <section className={homeStyles.card}>
              <h2 className={homeStyles.title}>
                <span className={homeStyles.titleQuestion}>
                  오늘 무슨 일이 있었나요?
                </span>
              </h2>
              <SafeButton
                type="button"
                variant="unstyled"
                data-tour="home-new-note"
                className={[
                  homeStyles.startButton,
                  isStartLoading ? homeStyles.startButtonLoading : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={handleStartSession}
              >
                {isStartLoading ? (
                  <span className={homeStyles.startButtonRing} aria-hidden />
                ) : null}
                <span className={homeStyles.plusIcon} aria-hidden>
                  +
                </span>
                <span className={homeStyles.plusText}>새 기록 추가</span>
              </SafeButton>
              <p className={homeStyles.dateHint}>{todayLabel}</p>
            </section>
          </div>
        </main>
      </div>
      <OnboardingTour
        steps={HOME_ONBOARDING_STEPS}
        isOpen={isTourOpen}
        setIsOpen={setIsTourOpen}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        onFinish={onFinish}
        onClose={onClose}
        onMaskClick={onMaskClick}
      />
    </div>
  );
}
