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
} from "@/components/onboarding/OnboardingTour";
import { useOnboardingTourControls } from "@/components/onboarding/useOnboardingTourControls";
import {
  MINIMAL_TOUR_STEPS_BY_FLOW,
  UNIFIED_TOUR_BASE_TOTAL,
  UNIFIED_TOUR_STORAGE_KEY,
  getMinimalTourOffset,
} from "@/components/onboarding/unifiedOnboarding";
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
import { CbtFloatingBackButton } from "@/components/cbt/common/CbtFloatingBackButton";
import { CbtFloatingHomeButton } from "@/components/cbt/common/CbtFloatingHomeButton";
import { CbtSavingModal } from "@/components/cbt/common/CbtSavingModal";
import { CbtMinimalCognitiveErrorSection } from "./minimal/left/CbtMinimalCognitiveErrorSection";
import styles from "./minimal/MinimalStyles.module.css";
import { CbtMinimalAlternativeThoughtSection } from "./minimal/right/CbtMinimalAlternativeThoughtSection";

type TourProgress = {
  lastStep: number;
  lastTotal: number;
};

const HAS_STARTED_EMOTION_NOTE_KEY = "emotion-note-started-v1";

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
  const tourSteps = useMemo<OnboardingStep[]>(
    () => MINIMAL_TOUR_STEPS_BY_FLOW[flow.step],
    [flow.step],
  );
  const tourGlobalOffset = useMemo(
    () => 1 + getMinimalTourOffset(flow.step),
    [flow.step],
  );
  const tourProgress = useMemo(
    () => ({
      offset: tourGlobalOffset,
      total: UNIFIED_TOUR_BASE_TOTAL,
    }),
    [tourGlobalOffset],
  );

  useEffect(() => {
    if (!safeLocalStorage.isAvailable()) return;
    safeLocalStorage.setItem(HAS_STARTED_EMOTION_NOTE_KEY, "true");
  }, []);

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

  const persistTourProgress = useCallback(
    (stepIndex: number) => {
      if (!safeLocalStorage.isAvailable()) return;
      safeLocalStorage.setItem(
        UNIFIED_TOUR_STORAGE_KEY,
        JSON.stringify({
          lastStep: tourGlobalOffset + stepIndex,
          lastTotal: UNIFIED_TOUR_BASE_TOTAL,
        }),
      );
    },
    [tourGlobalOffset],
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
    if (!safeLocalStorage.isAvailable()) return;
    const stored = safeLocalStorage.getItem(UNIFIED_TOUR_STORAGE_KEY);
    const maxGlobalStepIndex = UNIFIED_TOUR_BASE_TOTAL - 1;
    let progress: TourProgress | null = null;
    if (stored) {
      try {
        progress = JSON.parse(stored) as TourProgress;
      } catch {
        progress = null;
      }
    }

    if (!progress) return;
    if (progress.lastStep >= maxGlobalStepIndex) return;

    const nextGlobalStep = Math.max(
      0,
      Math.min(progress.lastStep + 1, maxGlobalStepIndex),
    );
    const localIndex = nextGlobalStep - tourGlobalOffset;
    if (localIndex < 0 || localIndex >= tourSteps.length) return;
    setTourStep(localIndex);
    setIsTourOpen(true);
  }, [
    accessMode,
    isAccessLoading,
    isTourOpen,
    canShowOnboarding,
    flow.step,
    tourSteps.length,
    tourGlobalOffset,
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
      try {
        void flushTokenSessionUsage({ sessionCount: 1 });
        clearCbtSessionStorage();
        router.replace(`/detail?id=${noteId}`);
      } catch (navigationError) {
        console.error("세션 이동 실패:", navigationError);
        pushToast("세션 이동 중 문제가 발생했습니다.", "error");
      } finally {
        setIsSaving(false);
      }
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
        <CbtSavingModal open={isSaving} />
        {currentStepIndex > 0 && (
          <div className={`${styles.floatingNav} ${styles.left}`}>
            <CbtFloatingBackButton onClick={handleBack} />
          </div>
        )}
        <div className={`${styles.floatingNav} ${styles.right}`}>
          <CbtFloatingHomeButton onClick={handleGoHome} />
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
        progress={tourProgress}
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
