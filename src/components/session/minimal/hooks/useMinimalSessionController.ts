import { useCbtToast } from "@/components/session/common/CbtToast";
import { useCbtAccess } from "@/components/session/hooks/useCbtAccess";
import {
  MINIMAL_ALTERNATIVE_STEPS,
  MINIMAL_DISTORTION_STEPS,
  MINIMAL_EMOTION_SELECT_STEPS,
  MINIMAL_INCIDENT_STEPS,
  MINIMAL_MOOD_STEPS,
  useCbtMinimalSessionFlow,
  type MinimalStep,
} from "@/components/session/hooks/useCbtMinimalSessionFlow";
import { clearCbtSessionStorage } from "@/lib/storage/session/cbtSessionStorage";
import { useGate } from "@/components/gate/GateProvider";
import type { OnboardingStep } from "@/components/onboarding/OnboardingTour";
import { useOnboardingTourControls } from "@/components/onboarding/useOnboardingTourControls";
import {
  EMOTION_NOTE_STARTED_KEY,
} from "@/lib/storage/keys/onboarding";
import {
  MINIMAL_TOUR_STEPS_BY_FLOW,
  UNIFIED_TOUR_BASE_TOTAL,
  UNIFIED_TOUR_STORAGE_KEY,
  getMinimalTourOffset,
} from "@/components/onboarding/unifiedOnboarding";
import {
  saveMinimalPatternAPI,
  type MinimalSavePayload,
} from "@/lib/api/session/postMinimalSession";
import { saveSessionHistoryAPI } from "@/lib/api/session-history/postSessionHistory";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import type {
  SelectedCognitiveError,
  SessionHistory,
} from "@/lib/types/sessionTypes";
import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { flushTokenSessionUsage } from "@/lib/storage/token/sessionUsage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runSessionSavePostProcess } from "@/components/session/hooks/useSessionSavePostProcess";
import {
  ALL_EMOTIONS,
  NEGATIVE_EMOTIONS,
  POSITIVE_EMOTIONS,
} from "@/lib/constants/emotions";
import type { SessionMoodType } from "../emotion-select/CbtSessionMoodToggle";

type TourProgress = {
  lastStep: number;
  lastTotal: number;
};

export function useMinimalSessionController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useCbtToast();
  const { accessMode, isLoading: isAccessLoading } = useAccessContext();
  const { state: flow, actions } = useCbtMinimalSessionFlow();
  const [moodType, setMoodType] = useState<SessionMoodType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { blocker, canShowOnboarding } = useGate();
  const lastDistortionKeyRef = useRef<string>("");
  const { requireAccessContext } = useCbtAccess({
    setError: (message) => {
      pushToast(message, "error");
    },
  });
  const queryClient = useQueryClient();
  const dateParam = searchParams.get("date");
  const emotionIdParam = searchParams.get("emotionId");
  const hasDateParam = Boolean(
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam),
  );
  const preselectedEmotion = useMemo(() => {
    if (!emotionIdParam) {
      return "";
    }
    return ALL_EMOTIONS.find((item) => item.id === emotionIdParam)?.label ?? "";
  }, [emotionIdParam]);
  const dateLabel = hasDateParam
    ? formatKoreanDateTime(`${dateParam}T00:00:00+09:00`, {
        month: "long",
        day: "numeric",
      })
    : "";
  const incidentTitle = hasDateParam
    ? `${dateLabel}에 무슨 일이 있었나요?`
    : "오늘 무슨 일이 있었나요?";

  const stepOrder: MinimalStep[] = useMemo(
    () => [
      ...(flow.selectedEmotion
        ? []
        : [...MINIMAL_MOOD_STEPS, ...MINIMAL_EMOTION_SELECT_STEPS]),
      ...MINIMAL_INCIDENT_STEPS,
      ...MINIMAL_DISTORTION_STEPS,
      ...MINIMAL_ALTERNATIVE_STEPS,
    ],
    [flow.selectedEmotion],
  );
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
    safeLocalStorage.setItem(EMOTION_NOTE_STARTED_KEY, "true");
  }, []);

  useEffect(() => {
    if (!preselectedEmotion) return;
    if (flow.selectedEmotion !== preselectedEmotion) {
      actions.setSelectedEmotion(preselectedEmotion);
      return;
    }
    if (flow.step === "mood" || flow.step === "emotion") {
      actions.setStep("incident");
    }
  }, [actions, flow.selectedEmotion, flow.step, preselectedEmotion]);

  useEffect(() => {
    if (!flow.selectedEmotion) return;
    const inPositive = POSITIVE_EMOTIONS.some(
      (emotion) => emotion.label === flow.selectedEmotion,
    );
    setMoodType(inPositive ? "positive" : "negative");
  }, [flow.selectedEmotion]);

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

  const handleBack = useCallback(() => {
    if (currentStepIndex <= 0) return;
    actions.setStep(stepOrder[currentStepIndex - 1]);
  }, [actions, currentStepIndex, stepOrder]);

  const handleGoHome = useCallback(() => {
    clearCbtSessionStorage();
    router.push("/home");
  }, [router]);

  const handleSelectDistortion = useCallback(
    (thought: string, error: SelectedCognitiveError) => {
      const nextKey = JSON.stringify({
        thought: thought.trim(),
        errorId: error.id,
        errorTitle: error.title,
        errorDetail: error.detail,
      });
      const seedBump = nextKey !== lastDistortionKeyRef.current;
      if (seedBump) {
        lastDistortionKeyRef.current = nextKey;
      }
      actions.setDistortion(thought, flow.selectedEmotion, error, seedBump);
    },
    [actions, flow.selectedEmotion],
  );

  const handleComplete = useCallback(
    async (thought: string) => {
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

        const moved = await runSessionSavePostProcess({
          queryClient,
          router,
          nextPath: `/detail?id=${noteId}`,
          pushToast,
        });
        if (!moved) {
          setIsSaving(false);
        }
      } catch (error) {
        console.error("세션 저장 실패:", error);
        pushToast("세션 기록을 저장하지 못했습니다.", "error");
        setIsSaving(false);
      }
    },
    [
      flow.emotionThoughtPairs,
      flow.selectedCognitiveErrors,
      flow.selectedEmotion,
      flow.userInput,
      isSaving,
      pushToast,
      queryClient,
      requireAccessContext,
      router,
      saveHistoryMutation,
      saveMinimalMutation,
    ],
  );

  const handleSelectMood = useCallback(
    (nextMood: SessionMoodType) => {
      setMoodType(nextMood);
      if (!flow.selectedEmotion) {
        return;
      }
      const nextPool =
        nextMood === "positive" ? POSITIVE_EMOTIONS : NEGATIVE_EMOTIONS;
      const hasSelectedEmotion = nextPool.some(
        (emotion) => emotion.label === flow.selectedEmotion,
      );
      if (!hasSelectedEmotion) {
        actions.setSelectedEmotion("");
      }
    },
    [actions, flow.selectedEmotion],
  );

  return {
    flow,
    actions,
    moodType,
    handleSelectMood,
    incidentTitle,
    isSaving,
    canGoBack: currentStepIndex > 0,
    handleBack,
    handleGoHome,
    handleSelectDistortion,
    handleComplete,
    tourSteps,
    isTourOpen,
    setIsTourOpen,
    tourStep,
    setTourStep,
    tourProgress,
    handleTourFinish,
    handleTourClose,
    handleTourMaskClick,
  };
}
