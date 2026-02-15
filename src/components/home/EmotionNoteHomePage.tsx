"use client";

import { useGate } from "@/components/gate/GateProvider";
import AppHeader from "@/components/header/AppHeader";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import {
  UNIFIED_TOUR_BASE_TOTAL,
  UNIFIED_TOUR_STORAGE_KEY,
  getMinimalTourOffset,
} from "@/components/onboarding/unifiedOnboarding";
import { useOnboardingTourControls } from "@/components/onboarding/useOnboardingTourControls";
import sessionStyles from "@/components/session/minimal/MinimalStyles.module.css";
import {
  NEGATIVE_EMOTIONS,
  POSITIVE_EMOTIONS,
  type EmotionOption,
} from "@/lib/constants/emotions";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import homeStyles from "./EmotionNoteHomePage.module.css";
import { HomeDate } from "./HomeDate";
import { HomeEmotionGrid } from "./HomeEmotionGrid";
import { HomeMoodToggle, type HomeMoodType } from "./HomeMoodToggle";
import { HomeTitle } from "./HomeTitle";
import { HOME_ONBOARDING_STEPS_BY_STEP } from "./onboarding/homeOnboarding";

const buildEmotionColorMap = (emotions: EmotionOption[]) => {
  const colors: string[] = [];
  for (let i = 0; i < emotions.length; i += 1) {
    const hue = (i * 137.508) % 360;
    colors.push(`hsl(${hue.toFixed(1)} 54% 62%)`);
  }
  const map: Record<string, string> = {};
  for (let i = 0; i < emotions.length; i += 1) {
    map[emotions[i].id] = colors[i];
  }
  return map;
};

export default function EmotionNoteHomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { blocker, canShowOnboarding } = useGate();
  const { checkUsage } = useAiUsageGuard({
    enabled: false,
    cache: true,
    redirectTo: null,
  });
  const [isStartLoading, setIsStartLoading] = useState(false);
  const [loadingEmotionId, setLoadingEmotionId] = useState<string | null>(null);
  const [step, setStep] = useState<"mood" | "emotion">("mood");
  const [moodType, setMoodType] = useState<HomeMoodType | null>(null);
  const titleText =
    step === "mood"
      ? "지금 어떤 기분인가요?"
      : "지금 당신의 감정은 무엇인가요?";
  const emotions = useMemo(
    () => (moodType === "positive" ? POSITIVE_EMOTIONS : NEGATIVE_EMOTIONS),
    [moodType],
  );
  const emotionColorMap = useMemo(
    () => buildEmotionColorMap(emotions),
    [emotions],
  );
  const todayLabel = useMemo(
    () =>
      formatKoreanDateTime(new Date(), {
        month: "long",
        day: "numeric",
        weekday: "short",
      }),
    [],
  );
  const dateParam = searchParams.get("date");
  const normalizedDate = useMemo(() => {
    if (!dateParam) {
      return "";
    }
    return /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : "";
  }, [dateParam]);
  const targetDateLabel = useMemo(() => {
    if (!normalizedDate) {
      return todayLabel;
    }
    return formatKoreanDateTime(`${normalizedDate}T00:00:00+09:00`, {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  }, [normalizedDate, todayLabel]);
  const homeTourSteps = useMemo(
    () => HOME_ONBOARDING_STEPS_BY_STEP[step],
    [step],
  );
  const homeTourOffset = useMemo(
    () => getMinimalTourOffset(step),
    [step],
  );
  const tourProgress = useMemo(
    () => ({
      offset: homeTourOffset,
      total: UNIFIED_TOUR_BASE_TOTAL,
    }),
    [homeTourOffset],
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
    onPersist: (stepIndex) => {
      if (!safeLocalStorage.isAvailable()) return;
      safeLocalStorage.setItem(
        UNIFIED_TOUR_STORAGE_KEY,
        JSON.stringify({
          lastStep: Math.max(0, homeTourOffset + stepIndex),
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
    if (homeTourSteps.length === 0) return;
    const maxGlobalStepIndex = UNIFIED_TOUR_BASE_TOTAL - 1;
    const targetGlobalStep = homeTourOffset;
    const stored = safeLocalStorage.getItem(UNIFIED_TOUR_STORAGE_KEY);

    if (!stored) {
      if (targetGlobalStep !== 0) return;
      setCurrentStep(0);
      setIsTourOpen(true);
      return;
    }

    type TourProgress = { lastStep: number; lastTotal: number };
    let progress: TourProgress | null = null;
    try {
      progress = JSON.parse(stored) as TourProgress;
    } catch {
      progress = null;
    }
    if (!progress) return;
    if (progress.lastStep >= maxGlobalStepIndex) return;
    if (progress.lastStep >= targetGlobalStep) return;
    if (progress.lastStep + 1 !== targetGlobalStep) return;
    setCurrentStep(0);
    setIsTourOpen(true);
  }, [
    canShowOnboarding,
    homeTourOffset,
    homeTourSteps.length,
    isTourOpen,
    setCurrentStep,
    setIsTourOpen,
  ]);

  useEffect(() => {
    const handleHomeTabReset = () => {
      setStep("mood");
      setMoodType(null);
      setIsStartLoading(false);
      setLoadingEmotionId(null);
    };
    window.addEventListener("app:home-tab-reset", handleHomeTabReset);
    return () => {
      window.removeEventListener("app:home-tab-reset", handleHomeTabReset);
    };
  }, []);

  const startSession = async (emotionId: string) => {
    if (!emotionId) {
      return false;
    }
    try {
      const allowed = await checkUsage();
      if (!allowed) {
        return false;
      }
      const next = new URLSearchParams();
      next.set("emotionId", emotionId);
      if (normalizedDate) {
        next.set("date", normalizedDate);
      }
      router.push(`/session?${next.toString()}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleSelectEmotion = async (emotionId: string) => {
    if (isStartLoading) {
      return;
    }
    if (safeLocalStorage.isAvailable() && isTourOpen && step === "emotion") {
      const emotionGlobalStep = getMinimalTourOffset("emotion");
      const stored = safeLocalStorage.getItem(UNIFIED_TOUR_STORAGE_KEY);
      let previousLastStep = -1;
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { lastStep?: number };
          previousLastStep =
            typeof parsed.lastStep === "number" ? parsed.lastStep : -1;
        } catch {
          previousLastStep = -1;
        }
      }
      safeLocalStorage.setItem(
        UNIFIED_TOUR_STORAGE_KEY,
        JSON.stringify({
          lastStep: Math.max(previousLastStep, emotionGlobalStep),
          lastTotal: UNIFIED_TOUR_BASE_TOTAL,
        }),
      );
      setIsTourOpen(false);
    }
    setLoadingEmotionId(emotionId);
    setIsStartLoading(true);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    const started = await startSession(emotionId);
    if (!started) {
      setIsStartLoading(false);
      setLoadingEmotionId(null);
    }
  };

  return (
    <div className={sessionStyles.page}>
      <div className={sessionStyles.bgWaves} />
      <div className={`${sessionStyles.content} ${homeStyles.content}`}>
        <AppHeader />
        <main className={homeStyles.main}>
          <div className={homeStyles.shell}>
            <section className={homeStyles.card}>
              {step === "mood" ? (
                <div className={homeStyles.stepBlock}>
                  <HomeDate label={targetDateLabel} />
                  <HomeTitle text={titleText} />
                  <HomeMoodToggle
                    value={moodType}
                    onChange={(next) => {
                      setMoodType(next);
                      setStep("emotion");
                    }}
                    disabled={isStartLoading}
                  />
                </div>
              ) : (
                <div className={homeStyles.stepBlock}>
                  <HomeTitle text={titleText} />
                  <HomeMoodToggle
                    value={moodType}
                    onChange={setMoodType}
                    disabled={isStartLoading}
                    prompt="감정군을 선택하세요"
                  />
                  <HomeEmotionGrid
                    emotions={emotions}
                    colorMap={emotionColorMap}
                    loadingEmotionId={loadingEmotionId}
                    isStartLoading={isStartLoading}
                    onSelectEmotion={(emotionId) => {
                      void handleSelectEmotion(emotionId);
                    }}
                  />
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
      <OnboardingTour
        steps={homeTourSteps}
        isOpen={isTourOpen}
        setIsOpen={setIsTourOpen}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        progress={tourProgress}
        onFinish={onFinish}
        onClose={onClose}
        onMaskClick={onMaskClick}
      />
    </div>
  );
}
