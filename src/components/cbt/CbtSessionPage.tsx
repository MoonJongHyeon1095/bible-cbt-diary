"use client";

import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { useCbtAccess } from "@/components/cbt/hooks/useCbtAccess";
import {
  useCbtMinimalSessionFlow,
  type MinimalStep,
} from "@/components/cbt/hooks/useCbtMinimalSessionFlow";
import { clearCbtSessionStorage } from "@/components/cbt/utils/storage/cbtSessionStorage";
import { useGate } from "@/components/gate/GateProvider";
import OnboardingTour, {
  type OnboardingStep,
} from "@/components/ui/OnboardingTour";
import { useOnboardingTourControls } from "@/components/ui/useOnboardingTourControls";
import {
  saveMinimalPatternAPI,
  type MinimalSavePayload,
} from "@/lib/api/cbt/postMinimalSession";
import { saveSessionHistoryAPI } from "@/lib/api/session-history/postSessionHistory";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { queryKeys } from "@/lib/queryKeys";
import type {
  SelectedCognitiveError,
  SessionHistory,
} from "@/lib/types/cbtTypes";
import { safeLocalStorage } from "@/lib/utils/safeStorage";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { flushTokenSessionUsage } from "@/lib/utils/tokenSessionStorage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CbtMinimalAutoThoughtSection } from "./minimal/center/CbtMinimalAutoThoughtSection";
import { CbtMinimalEmotionSection } from "./minimal/center/CbtMinimalEmotionSection";
import { CbtMinimalIncidentSection } from "./minimal/center/CbtMinimalIncidentSection";
import { CbtMinimalFloatingBackButton } from "./minimal/common/CbtMinimalFloatingBackButton";
import { CbtMinimalFloatingHomeButton } from "./minimal/common/CbtMinimalFloatingHomeButton";
import { CbtMinimalSavingModal } from "./minimal/common/CbtMinimalSavingModal";
import { CbtMinimalCognitiveErrorSection } from "./minimal/left/CbtMinimalCognitiveErrorSection";
import styles from "./minimal/MinimalStyles.module.css";
import { CbtMinimalAlternativeThoughtSection } from "./minimal/right/CbtMinimalAlternativeThoughtSection";

const TOUR_STORAGE_PREFIX = "minimal-session-onboarding";

type TourProgress = {
  lastStep: number;
  lastTotal: number;
};

function CbtSessionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useCbtToast();
  const { accessMode, isLoading: isAccessLoading } = useAccessContext();
  const { state: flow, actions } = useCbtMinimalSessionFlow();
  const [isSaving, setIsSaving] = useState(false);
  const { blocker, canShowOnboarding } = useGate();
  const lastErrorsKeyRef = useRef<string>("");
  const { requireAccessContext } = useCbtAccess({
    setError: (message) => {
      pushToast(message, "error");
    },
  });
  const queryClient = useQueryClient();
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
  const currentStepIndex = stepOrder.indexOf(flow.step);

  const saveMinimalMutation = useMutation({
    mutationFn: async (args: {
      access: {
        mode: "auth" | "guest" | "blocked";
        accessToken: string | null;
      };
      payload: MinimalSavePayload;
    }) => saveMinimalPatternAPI(args.access, args.payload),
  });

  const saveHistoryMutation = useMutation({
    mutationFn: async (args: {
      access: {
        mode: "auth" | "guest" | "blocked";
        accessToken: string | null;
      };
      payload: SessionHistory;
    }) => saveSessionHistoryAPI(args.access, args.payload),
  });

  const tourSteps = useMemo<OnboardingStep[]>(() => {
    if (flow.step === "incident") {
      const steps: OnboardingStep[] = [
        {
          selector: "[data-tour='minimal-incident-input']",
          side: "bottom",
          content: "오늘 있었던 일을 간단히 적어주세요.",
        },
        {
          selector: "[data-tour='minimal-incident-example']",
          side: "bottom",
          content: "직접 쓰시거나 예시를 살짝 보실 수도 있어요.",
        },
        {
          selector: "[data-tour='minimal-incident-next']",
          side: "top",
          content: "다 썼다면 다음으로 이동해요.",
        },
      ];
      return steps;
    }
    if (flow.step === "emotion") {
      const steps: OnboardingStep[] = [
        {
          selector: "[data-tour='emotion-grid']",
          side: "top",
          content: "지금 가장 가까운 감정을 골라주세요.",
        },
      ];
      return steps;
    }
    if (flow.step === "thought") {
      const steps: OnboardingStep[] = [
        {
          selector: "[data-tour='minimal-thought-carousel']",
          side: "bottom",
          content: "감정 뒤에 있는 생각을 확인해요.",
        },
        {
          selector: "[data-tour='minimal-thought-next']",
          side: "top",
          content: "지금 보고 있는 생각으로 진행합니다.",
        },
      ];
      return steps;
    }
    if (flow.step === "errors") {
      return [];
    }
    if (flow.step === "alternative") {
      return [];
    }
    return [];
  }, [flow.step, flow.selectedEmotion]);

  const persistTourProgress = useCallback(
    (stepIndex: number) => {
      const storageKey = `${TOUR_STORAGE_PREFIX}:${flow.step}`;
      safeLocalStorage.setItem(
        storageKey,
        JSON.stringify({
          lastStep: stepIndex,
          lastTotal: tourSteps.length,
        }),
      );
    },
    [flow.step, tourSteps.length],
  );

  const {
    isOpen: isTourOpen,
    setIsOpen: setIsTourOpen,
    currentStep: tourStep,
    setCurrentStep: setTourStep,
    onFinish: handleTourFinish,
    onClose: handleTourClose,
    onMaskClick: handleTourMaskClick,
  } = useOnboardingTourControls({ onPersist: persistTourProgress });

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
  }, [blocker, isTourOpen, setIsTourOpen]);

  useEffect(() => {
    if (accessMode === "blocked" || isAccessLoading) return;
    if (!canShowOnboarding) return;
    if (isTourOpen) return;
    if (tourSteps.length === 0) return;
    const storageKey = `${TOUR_STORAGE_PREFIX}:${flow.step}`;
    const stored = safeLocalStorage.getItem(storageKey);
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
    flow.step,
    tourSteps.length,
    setIsTourOpen,
    setTourStep,
  ]);

  const handleBack = () => {
    if (currentStepIndex <= 0) return;
    if (flow.step === "thought" && flow.autoThoughtWantsCustom) {
      actions.setWantsCustom(false);
      return;
    }
    actions.setStep(stepOrder[currentStepIndex - 1]);
  };

  const handleGoHome = () => {
    clearCbtSessionStorage();
    router.push("/today");
  };

  const handleSubmitThought = (thought: string) => {
    actions.setThoughtPair(thought, flow.selectedEmotion);
  };

  const handleSelectEmotion = (emotion: string) => {
    actions.setSelectedEmotion(emotion);
    if (isTourOpen && flow.step === "emotion") {
      handleTourFinish(tourStep);
      setIsTourOpen(false);
    }
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
    const seedBump = nextKey !== lastErrorsKeyRef.current;
    if (nextKey !== lastErrorsKeyRef.current) {
      lastErrorsKeyRef.current = nextKey;
    }
    actions.setErrors(errors, seedBump);
  };

  const handleComplete = async (thought: string) => {
    if (isSaving) return;
    const access = await requireAccessContext();
    if (!access) return;

    const pairsToSave = flow.emotionThoughtPairs.map((pair) => ({
      ...pair,
      intensity: null,
    }));

    const historyItem: SessionHistory = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userInput: flow.userInput,
      emotionThoughtPairs: pairsToSave,
      selectedCognitiveErrors: flow.selectedCognitiveErrors,
      selectedAlternativeThought: thought,
      selectedBehavior: null,
      bibleVerse: null,
    };

    const minimalPayload = {
      triggerText: flow.userInput,
      emotion: flow.selectedEmotion,
      automaticThought: flow.emotionThoughtPairs[0]?.thought ?? "",
      alternativeThought: thought,
      cognitiveError: flow.selectedCognitiveErrors[0] ?? null,
    };

    setIsSaving(true);

    try {
      const { ok, payload } = await saveMinimalMutation.mutateAsync({
        access,
        payload: minimalPayload,
      });
      if (!ok) {
        throw new Error("save_minimal_note_failed");
      }

      const historyResult = await saveHistoryMutation.mutateAsync({
        access,
        payload: historyItem,
      });
      if (!historyResult.ok) {
        throw new Error("save_session_history_failed");
      }

      const noteId = payload?.noteId;
      if (!noteId) {
        throw new Error("note_id_missing");
      }

      pushToast("세션 기록이 저장되었습니다.", "success");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.emotionNotes.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessionHistory.all,
      });
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

        {flow.step === "incident" && (
          <CbtMinimalIncidentSection
            userInput={flow.userInput}
            onInputChange={actions.setUserInput}
            onNext={() => actions.setStep("emotion")}
            title={incidentTitle}
          />
        )}

        {flow.step === "emotion" && (
          <CbtMinimalEmotionSection
            selectedEmotion={flow.selectedEmotion}
            onSelectEmotion={handleSelectEmotion}
            onNext={() => {
              actions.setWantsCustom(false);
              actions.setStep("thought");
            }}
          />
        )}

        {flow.step === "thought" && (
          <CbtMinimalAutoThoughtSection
            userInput={flow.userInput}
            emotion={flow.selectedEmotion}
            wantsCustom={flow.autoThoughtWantsCustom}
            onWantsCustomChange={actions.setWantsCustom}
            onSubmitThought={handleSubmitThought}
          />
        )}

        {flow.step === "errors" && (
          <CbtMinimalCognitiveErrorSection
            userInput={flow.userInput}
            thought={flow.emotionThoughtPairs[0]?.thought ?? ""}
            onSelect={handleSelectErrors}
          />
        )}

        {flow.step === "alternative" && (
          <CbtMinimalAlternativeThoughtSection
            userInput={flow.userInput}
            emotionThoughtPairs={flow.emotionThoughtPairs}
            selectedCognitiveErrors={flow.selectedCognitiveErrors}
            seed={flow.alternativeSeed}
            onSelect={handleComplete}
          />
        )}
      </div>
      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        setIsOpen={setIsTourOpen}
        currentStep={tourStep}
        setCurrentStep={setTourStep}
        onFinish={handleTourFinish}
        onClose={handleTourClose}
        onMaskClick={handleTourMaskClick}
      />
    </div>
  );
}

export default function CbtSessionPage() {
  return <CbtSessionPageContent />;
}
