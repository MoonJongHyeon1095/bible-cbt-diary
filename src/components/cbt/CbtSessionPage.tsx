"use client";

import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { useCbtAccess } from "@/components/cbt/hooks/useCbtAccess";
import {
  saveMinimalPatternAPI,
  saveSessionHistoryAPI,
} from "@/components/cbt/utils/cbtSessionApi";
import { clearCbtSessionStorage } from "@/components/cbt/utils/storage/cbtSessionStorage";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import type {
  EmotionThoughtPair,
  SelectedCognitiveError,
  SessionHistory,
} from "@/lib/types/cbtTypes";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { flushTokenSessionUsage } from "@/lib/utils/tokenSessionStorage";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { CbtMinimalAutoThoughtSection } from "./minimal/center/CbtMinimalAutoThoughtSection";
import { CbtMinimalEmotionSection } from "./minimal/center/CbtMinimalEmotionSection";
import { CbtMinimalIncidentSection } from "./minimal/center/CbtMinimalIncidentSection";
import { CbtMinimalFloatingBackButton } from "./minimal/common/CbtMinimalFloatingBackButton";
import { CbtMinimalFloatingHomeButton } from "./minimal/common/CbtMinimalFloatingHomeButton";
import { CbtMinimalSavingModal } from "./minimal/common/CbtMinimalSavingModal";
import { CbtMinimalCognitiveErrorSection } from "./minimal/left/CbtMinimalCognitiveErrorSection";
import styles from "./minimal/MinimalStyles.module.css";
import { CbtMinimalAlternativeThoughtSection } from "./minimal/right/CbtMinimalAlternativeThoughtSection";
import { useGate } from "@/components/gate/GateProvider";

type MinimalStep =
  | "incident"
  | "emotion"
  | "thought"
  | "errors"
  | "alternative";

const TOUR_STORAGE_PREFIX = "minimal-session-onboarding";

type TourProgress = {
  lastStep: number;
  lastTotal: number;
};

const Tour = dynamic(() => import("@reactour/tour").then((mod) => mod.Tour), {
  ssr: false,
});

function CbtSessionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useCbtToast();
  const { accessMode, isLoading: isAccessLoading } = useAccessContext();
  const [step, setStep] = useState<MinimalStep>("incident");
  const [userInput, setUserInput] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [emotionThoughtPairs, setEmotionThoughtPairs] = useState<
    EmotionThoughtPair[]
  >([]);
  const [selectedCognitiveErrors, setSelectedCognitiveErrors] = useState<
    SelectedCognitiveError[]
  >([]);
  const [autoThoughtWantsCustom, setAutoThoughtWantsCustom] = useState(false);
  const [alternativeSeed, setAlternativeSeed] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [disabledActions, setDisabledActions] = useState(false);
  const { blocker, canShowOnboarding } = useGate();
  const lastErrorsKeyRef = useRef<string>("");
  const { requireAccessContext } = useCbtAccess({
    setError: (message) => {
      pushToast(message, "error");
    },
  });
  const dateParam = searchParams.get("date");
  const hasDateParam = Boolean(
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam),
  );
  const dateLabel = hasDateParam
    ? formatKoreanDateTime(`${dateParam}T00:00:00+09:00`, {
        month: "long",
        day: "numeric",
      })
    : "";
  const incidentTitle = hasDateParam
    ? `${dateLabel}에 무슨 일이 있었나요?`
    : "오늘 무슨 일이 있었나요?";

  const stepOrder: MinimalStep[] = [
    "incident",
    "emotion",
    "thought",
    "errors",
    "alternative",
  ];
  const currentStepIndex = stepOrder.indexOf(step);

  const tourSteps = useMemo(() => {
    if (step === "incident") {
      return [
        {
          selector: "[data-tour='minimal-incident-input']",
          content: "오늘 있었던 일을 간단히 적어주세요.",
        },
        {
          selector: "[data-tour='minimal-incident-example']",
          content: "막막하면 예시로 시작해도 좋아요.",
        },
        {
          selector: "[data-tour='minimal-incident-next']",
          content: "다 썼다면 다음으로 이동해요.",
        },
      ];
    }
    if (step === "emotion") {
      return [
        {
          selector: "[data-tour='emotion-grid']",
          content: "지금 가장 가까운 감정을 골라주세요.",
        },
      ];
    }
    if (step === "thought") {
      return [
        {
          selector: "[data-tour='minimal-thought-carousel']",
          content: "감정 뒤에 있는 생각을 확인해요.",
        },
        {
          selector: "[data-tour='minimal-thought-next']",
          content: "지금 보고 있는 생각으로 진행합니다.",
        },
      ];
    }
    if (step === "errors") {
      return [];
    }
    if (step === "alternative") {
      return [];
    }
    return [];
  }, [step]);

  useEffect(() => {
    const handlePageHide = () => {
      void flushTokenSessionUsage();
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      void flushTokenSessionUsage();
    };
  }, []);

  useEffect(() => {
    if (blocker && isTourOpen) {
      setIsTourOpen(false);
    }
  }, [blocker, isTourOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (accessMode === "blocked" || isAccessLoading) return;
    if (!canShowOnboarding) return;
    if (isTourOpen) return;
    if (tourSteps.length === 0) return;
    const storageKey = `${TOUR_STORAGE_PREFIX}:${step}`;
    const stored = window.localStorage.getItem(storageKey);
    const maxStepIndex = tourSteps.length - 1;
    let progress: TourProgress | null = null;
    if (stored) {
      try {
        progress = JSON.parse(stored) as TourProgress;
      } catch {
        progress = null;
      }
    }

    if (!progress) {
      setTourStep(0);
      setIsTourOpen(true);
      return;
    }

    if (tourSteps.length > progress.lastTotal) {
      const nextStep = Math.max(
        0,
        Math.min(progress.lastStep + 1, maxStepIndex),
      );
      setTourStep(nextStep);
      setIsTourOpen(true);
    }
  }, [
    accessMode,
    isAccessLoading,
    isTourOpen,
    canShowOnboarding,
    step,
    tourSteps.length,
  ]);

  const handleBack = () => {
    if (currentStepIndex <= 0) return;
    if (step === "thought" && autoThoughtWantsCustom) {
      setAutoThoughtWantsCustom(false);
      return;
    }
    setStep(stepOrder[currentStepIndex - 1]);
  };

  const handleGoHome = () => {
    clearCbtSessionStorage();
    router.push("/today");
  };

  const handleSubmitThought = (thought: string) => {
    const nextPair: EmotionThoughtPair = {
      emotion: selectedEmotion,
      intensity: null,
      thought,
    };
    setEmotionThoughtPairs([nextPair]);
    setStep("errors");
  };

  const handleSelectErrors = (errors: SelectedCognitiveError[]) => {
    const nextKey = JSON.stringify(
      errors.map((item) => ({
        id: item.id,
        index: item.index,
        title: item.title,
        detail: item.detail,
      })),
    );
    if (nextKey !== lastErrorsKeyRef.current) {
      setAlternativeSeed((prev) => prev + 1);
      lastErrorsKeyRef.current = nextKey;
    }
    setSelectedCognitiveErrors(errors);
    setStep("alternative");
  };

  const handleComplete = async (thought: string) => {
    if (isSaving) return;
    const access = await requireAccessContext();
    if (!access) return;

    const pairsToSave = emotionThoughtPairs.map((pair) => ({
      ...pair,
      intensity: null,
    }));

    const historyItem: SessionHistory = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userInput,
      emotionThoughtPairs: pairsToSave,
      selectedCognitiveErrors,
      selectedAlternativeThought: thought,
      selectedBehavior: null,
      bibleVerse: null,
    };

    const minimalPayload = {
      triggerText: userInput,
      emotion: selectedEmotion,
      automaticThought: emotionThoughtPairs[0]?.thought ?? "",
      alternativeThought: thought,
      cognitiveError: selectedCognitiveErrors[0] ?? null,
    };

    setIsSaving(true);

    try {
      const { ok, payload } = await saveMinimalPatternAPI(
        access,
        minimalPayload,
      );
      if (!ok) {
        throw new Error("save_minimal_note_failed");
      }

      const historyResult = await saveSessionHistoryAPI(access, historyItem);
      if (!historyResult.ok) {
        throw new Error("save_session_history_failed");
      }

      const noteId = payload?.noteId;
      if (!noteId) {
        throw new Error("note_id_missing");
      }

      pushToast("세션 기록이 저장되었습니다.", "success");
      setIsSaving(false);
      window.setTimeout(() => {
        try {
          void flushTokenSessionUsage({ sessionCount: 1 });
          clearCbtSessionStorage();
          router.push(`/detail?id=${noteId}`);
        } catch (timeoutError) {
          console.error("세션 이동 실패:", timeoutError);
          pushToast("세션 이동 중 문제가 발생했습니다.", "error");
        } finally {
          setIsSaving(false);
        }
      }, 180);
    } catch (error) {
      console.error("세션 저장 실패:", error);
      pushToast("세션 기록을 저장하지 못했습니다.", "error");
      setIsSaving(false);
    }
  };

  const persistTourProgress = (stepIndex: number) => {
    if (typeof window === "undefined") return;
    const storageKey = `${TOUR_STORAGE_PREFIX}:${step}`;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        lastStep: stepIndex,
        lastTotal: tourSteps.length,
      }),
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgWaves} />
      <div className={styles.content}>
        <CbtMinimalSavingModal open={isSaving} />
        {currentStepIndex > 0 && (
          <div className={`${styles.floatingNav} ${styles.left}`}>
            <CbtMinimalFloatingBackButton onClick={handleBack} />
          </div>
        )}
        <div className={`${styles.floatingNav} ${styles.right}`}>
          <CbtMinimalFloatingHomeButton onClick={handleGoHome} />
        </div>

        {step === "incident" && (
          <CbtMinimalIncidentSection
            userInput={userInput}
            onInputChange={setUserInput}
            onNext={() => setStep("emotion")}
            title={incidentTitle}
          />
        )}

        {step === "emotion" && (
          <CbtMinimalEmotionSection
            selectedEmotion={selectedEmotion}
            onSelectEmotion={setSelectedEmotion}
            onNext={() => {
              setAutoThoughtWantsCustom(false);
              setStep("thought");
            }}
          />
        )}

        {step === "thought" && (
          <CbtMinimalAutoThoughtSection
            userInput={userInput}
            emotion={selectedEmotion}
            wantsCustom={autoThoughtWantsCustom}
            onWantsCustomChange={setAutoThoughtWantsCustom}
            onSubmitThought={handleSubmitThought}
          />
        )}

        {step === "errors" && (
          <CbtMinimalCognitiveErrorSection
            userInput={userInput}
            thought={emotionThoughtPairs[0]?.thought ?? ""}
            onSelect={handleSelectErrors}
          />
        )}

        {step === "alternative" && (
          <CbtMinimalAlternativeThoughtSection
            userInput={userInput}
            emotionThoughtPairs={emotionThoughtPairs}
            selectedCognitiveErrors={selectedCognitiveErrors}
            seed={alternativeSeed}
            onSelect={handleComplete}
          />
        )}
      </div>
      {isTourOpen ? (
        <Tour
          steps={tourSteps}
          isOpen={isTourOpen}
          setIsOpen={setIsTourOpen}
          currentStep={tourStep}
          setCurrentStep={setTourStep}
          disabledActions={disabledActions}
          setDisabledActions={setDisabledActions}
          showCloseButton={false}
          nextButton={({
            Button,
            currentStep,
            setCurrentStep,
            setIsOpen,
            stepsLength,
          }) => {
            const lastStepIndex = Math.max(0, stepsLength - 1);
            const isLastStep = currentStep >= lastStepIndex;
            return (
              <Button
                kind="next"
                hideArrow={isLastStep}
                onClick={() => {
                  if (isLastStep) {
                    persistTourProgress(lastStepIndex);
                    setIsOpen(false);
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}
              >
                {isLastStep ? <Check size={16} strokeWidth={2.4} /> : null}
              </Button>
            );
          }}
          onClickClose={({ currentStep: stepIndex, setIsOpen }) => {
            persistTourProgress(stepIndex);
            setIsOpen(false);
          }}
          onClickMask={({ currentStep: stepIndex, setIsOpen }) => {
            persistTourProgress(stepIndex);
            setIsOpen(false);
          }}
          styles={{
            popover: (base) => ({
              ...base,
              borderRadius: 16,
              background: "rgba(22, 26, 33, 0.96)",
              color: "#e6e7ea",
              border: "1px solid rgba(143, 167, 200, 0.24)",
              boxShadow:
                "0 18px 40px rgba(8, 9, 12, 0.65), 0 0 0 1px rgba(255,255,255,0.04) inset",
              padding: "28px 18px 16px",
              overflow: "visible",
            }),
            badge: (base) => ({
              ...base,
              background: "#f2c96d",
              color: "#0f1114",
              fontWeight: 700,
              boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
            }),
            dot: (base, state) => ({
              ...base,
              width: 6,
              height: 6,
              margin: "0 4px",
              background: state?.current ? "#f2c96d" : "rgba(255,255,255,0.25)",
            }),
            arrow: (base) => ({
              ...base,
              color: "rgba(22, 26, 33, 0.96)",
            }),
            maskArea: (base) => ({
              ...base,
              rx: 16,
              ry: 16,
            }),
            highlightedArea: (base) => ({
              ...base,
              boxShadow: "0 0 0 9999px rgba(5, 7, 10, 0.7)",
              borderRadius: 16,
              border: "1px solid rgba(242, 201, 109, 0.55)",
            }),
            navigation: (base) => ({
              ...base,
              marginTop: 16,
            }),
            button: (base) => ({
              ...base,
              background: "rgba(143, 167, 200, 0.18)",
              color: "#e6e7ea",
              borderRadius: 999,
              padding: "6px 12px",
              fontWeight: 600,
              border: "1px solid rgba(143, 167, 200, 0.25)",
            }),
          }}
        />
      ) : null}
    </div>
  );
}

export default function CbtSessionPage() {
  return <CbtSessionPageContent />;
}
