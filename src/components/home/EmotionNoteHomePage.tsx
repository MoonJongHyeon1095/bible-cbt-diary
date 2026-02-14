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
import { EMOTIONS } from "@/lib/constants/emotions";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import { HOME_TOUR_STORAGE_KEY } from "@/lib/storage/keys/onboarding";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import homeStyles from "./EmotionNoteHomePage.module.css";
import { HOME_ONBOARDING_STEPS } from "./onboarding/homeOnboarding";

const buildEmotionColorMap = () => {
  const colors: string[] = [];
  for (let i = 0; i < EMOTIONS.length; i += 1) {
    const hue = (i * 137.508) % 360;
    colors.push(`hsl(${hue.toFixed(1)} 54% 62%)`);
  }
  const map: Record<string, string> = {};
  for (let i = 0; i < EMOTIONS.length; i += 1) {
    map[EMOTIONS[i].id] = colors[i];
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
  const titleText = "지금 당신의 감정은 무엇인가요?";
  const emotionColorMap = useMemo(() => buildEmotionColorMap(), []);
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
        <main className={`${pageStyles.main} ${homeStyles.main}`}>
          <div className={homeStyles.dateDock}>
            <p className={homeStyles.dateHint}>{targetDateLabel}</p>
          </div>
          <div className={`${pageStyles.shell} ${homeStyles.shell}`}>
            <section className={homeStyles.card}>
              <h2 className={homeStyles.title}>
                <span className={homeStyles.titleQuestion}>{titleText}</span>
              </h2>
              <div className={homeStyles.emotionGrid} data-tour="home-emotion-grid">
                {EMOTIONS.map((emotion) => {
                  const color = emotionColorMap[emotion.id];
                  return (
                    <SafeButton
                      key={emotion.id}
                      type="button"
                      variant="unstyled"
                      className={`${homeStyles.emotionCard} ${
                        loadingEmotionId === emotion.id && isStartLoading
                          ? homeStyles.emotionCardLoading
                          : ""
                      }`}
                      onClick={() => void handleSelectEmotion(emotion.id)}
                      disabled={isStartLoading}
                      style={{
                        borderColor: color,
                        color,
                      }}
                    >
                      <span className={homeStyles.emotionName}>
                        {emotion.label}
                      </span>
                    </SafeButton>
                  );
                })}
              </div>
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
