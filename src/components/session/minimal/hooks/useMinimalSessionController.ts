import { useCbtToast } from "@/components/session/common/CbtToast";
import { useCbtAccess } from "@/components/session/hooks/useCbtAccess";
import {
  MINIMAL_ALTERNATIVE_STEPS,
  MINIMAL_DISTORTION_STEPS,
  MINIMAL_EMOTION_SELECT_STEPS,
  MINIMAL_INCIDENT_STEPS,
  MINIMAL_MOOD_STEPS,
  MINIMAL_SDT_STEPS,
  useCbtMinimalSessionFlow,
  type MinimalStep,
} from "@/components/session/hooks/useCbtMinimalSessionFlow";
import { useLeaveConfirm } from "@/components/restore/useLeaveConfirm";
import {
  clearSessionResumeDraft,
} from "@/components/restore/storage";
import { useGate } from "@/components/gate/GateProvider";
import type { OnboardingStep } from "@/components/onboarding/OnboardingTour";
import { useUnifiedOnboardingSegment } from "@/components/onboarding/hooks/useUnifiedOnboardingSegment";
import {
  EMOTION_NOTE_STARTED_KEY,
} from "@/lib/storage/keys/onboarding";
import {
  markDetailConfettiPending,
  MINIMAL_TOUR_TOTAL,
  MINIMAL_TOUR_STEPS_BY_FLOW,
  readUnifiedTourProgress,
  UNIFIED_TOUR_BASE_TOTAL,
  getMinimalTourOffset,
} from "@/components/onboarding/unifiedOnboarding";
import {
  saveMinimalPatternAPI,
  type MinimalSavePayload,
} from "@/lib/api/session/postMinimalSession";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import type {
  PositiveSdtSelection,
  SelectedCognitiveError,
} from "@/lib/types/sessionTypes";
import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { flushTokenSessionUsage } from "@/lib/storage/token/sessionUsage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runSessionSavePostProcess } from "@/components/session/hooks/useSessionSavePostProcess";
import { buildSessionNoteTitle } from "@/components/session/utils/buildSessionNoteTitle";
import { generateSessionNoteTitle } from "@/lib/gpt/sessionTitle";
import {
  formatEmotionIds,
  getMoodTypeFromEmotionId,
  mapEmotionIdsToLabels,
} from "@/lib/constants/emotions";
import { useSessionMoodController } from "@/components/session/common/useSessionMoodController";
import { useMinimalSessionRestore } from "./controller/useMinimalSessionRestore";
import { useMinimalSessionResumeDraft } from "./controller/useMinimalSessionResumeDraft";

export function useMinimalSessionController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useCbtToast();
  const { accessMode, isLoading: isAccessLoading } = useAccessContext();
  const { state: flow, actions } = useCbtMinimalSessionFlow();
  const [isSaving, setIsSaving] = useState(false);
  const { blocker, canShowOnboarding } = useGate();
  const lastDistortionKeyRef = useRef<string>("");
  const titleRequestSeqRef = useRef(0);
  const { requireAccessContext } = useCbtAccess({
    setError: (message) => {
      pushToast(message, "error");
    },
  });
  const queryClient = useQueryClient();
  const dateParam = searchParams.get("date");
  const emotionIdsParam = searchParams.get("emotionIds");
  const hasDateParam = Boolean(
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam),
  );
  const preselectedEmotionIds = useMemo(() => {
    return (emotionIdsParam ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
      .slice(0, 2);
  }, [emotionIdsParam]);
  const dateLabel = hasDateParam
    ? formatKoreanDateTime(`${dateParam}T00:00:00+09:00`, {
        month: "long",
        day: "numeric",
      })
    : "";
  const moodTitle = hasDateParam
    ? `${dateLabel}에 어떤 기분이었나요?`
    : "지금 어떤 기분인가요?";
  const incidentTitle = hasDateParam
    ? `${dateLabel}에 무슨 일이 있었나요?`
    : "오늘 무슨 일이 있었나요?";

  const stepOrder: MinimalStep[] = useMemo(
    () => {
      const moodFromSelection = flow.selectedEmotions[0]
        ? getMoodTypeFromEmotionId(flow.selectedEmotions[0])
        : null;
      const analysisSteps =
        moodFromSelection === "positive"
          ? [...MINIMAL_SDT_STEPS]
          : [...MINIMAL_DISTORTION_STEPS, ...MINIMAL_ALTERNATIVE_STEPS];
      return [
        ...(flow.selectedEmotions.length > 0
          ? []
          : [...MINIMAL_MOOD_STEPS, ...MINIMAL_EMOTION_SELECT_STEPS]),
        ...MINIMAL_INCIDENT_STEPS,
        ...analysisSteps,
      ];
    },
    [flow.selectedEmotions],
  );
  const currentStepIndex = stepOrder.indexOf(flow.step);
  const tourSteps = useMemo<OnboardingStep[]>(
    () => MINIMAL_TOUR_STEPS_BY_FLOW[flow.step],
    [flow.step],
  );
  const tourGlobalOffset = useMemo(
    () => getMinimalTourOffset(flow.step),
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
    if (preselectedEmotionIds.length === 0) return;
    const same =
      flow.selectedEmotions.length === preselectedEmotionIds.length &&
      flow.selectedEmotions.every((value, index) => value === preselectedEmotionIds[index]);
    if (!same) {
      actions.setSelectedEmotions(preselectedEmotionIds);
      return;
    }
    if (flow.step === "mood" || flow.step === "emotion") {
      actions.setStep("incident");
    }
  }, [actions, flow.selectedEmotions, flow.step, preselectedEmotionIds]);

  useMinimalSessionRestore({
    actions: {
      setSelectedEmotions: actions.setSelectedEmotions,
      setUserInput: actions.setUserInput,
      setStep: (step) => actions.setStep(step),
    },
  });

  useMinimalSessionResumeDraft({
    selectedEmotionIds: flow.selectedEmotions,
    userInput: flow.userInput,
    hasDateParam,
    dateParam,
  });

  const saveMinimalMutation = useMutation({
    mutationFn: async (args: {
      access: {
        mode: "auth" | "guest" | "blocked";
        accessToken: string | null;
      };
      payload: MinimalSavePayload;
    }) => saveMinimalPatternAPI(args.access, args.payload),
  });

  const {
    isOpen: isTourOpen,
    setIsOpen: setIsTourOpen,
    currentStep: tourStep,
    setCurrentStep: setTourStep,
    onFinish: handleTourFinish,
    onClose: handleTourClose,
    onMaskClick: handleTourMaskClick,
  } = useUnifiedOnboardingSegment({
    steps: tourSteps,
    offset: tourGlobalOffset,
    canShow: canShowOnboarding && accessMode !== "blocked" && !isAccessLoading,
    blocked: Boolean(blocker),
  });

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

  const handleBack = useCallback(() => {
    if (currentStepIndex <= 0) return;
    actions.setStep(stepOrder[currentStepIndex - 1]);
  }, [actions, currentStepIndex, stepOrder]);

  const moveToHome = useCallback(() => {
    router.push("/home");
  }, [router]);

  const {
    showConfirm: showLeaveConfirm,
    requestLeave: handleGoHome,
    cancelLeave: handleCancelLeave,
    confirmLeave: handleConfirmLeave,
  } = useLeaveConfirm({
    step: flow.step,
    protectedSteps: ["sdt", "distortion", "alternative"] as const,
    onLeave: moveToHome,
  });

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
      actions.setDistortion(
        thought,
        formatEmotionIds(flow.selectedEmotions),
        error,
        seedBump,
      );
    },
    [actions, flow.selectedEmotions],
  );

  const handleProceedFromIncident = useCallback(() => {
    const incident = flow.userInput;
    const emotion = formatEmotionIds(flow.selectedEmotions);
    const moodFromSelection = flow.selectedEmotions[0]
      ? getMoodTypeFromEmotionId(flow.selectedEmotions[0])
      : null;
    const fallbackTitle = buildSessionNoteTitle({
      emotion,
      incident,
    });
    actions.setNoteTitle(fallbackTitle);
    actions.setStep(moodFromSelection === "positive" ? "sdt" : "distortion");

    const seq = ++titleRequestSeqRef.current;
    void generateSessionNoteTitle({
      emotion,
      incident,
    })
      .then((generatedTitle) => {
        if (seq !== titleRequestSeqRef.current) return;
        const normalized = generatedTitle.trim();
        if (!normalized) return;
        actions.setNoteTitle(normalized);
      })
      .catch((error) => {
        console.error("세션 제목 생성 실패(minimal):", error);
      });
  }, [actions, flow.selectedEmotions, flow.userInput]);

  const handleComplete = useCallback(
    async (thought: string) => {
      if (isSaving) return;
      const access = await requireAccessContext();
      if (!access) return;

      const minimalPayload = {
        title:
          flow.noteTitle ||
          buildSessionNoteTitle({
            emotion: formatEmotionIds(flow.selectedEmotions),
            incident: flow.userInput,
          }),
        triggerText: flow.userInput,
        emotion: formatEmotionIds(flow.selectedEmotions),
        emotions: mapEmotionIdsToLabels(flow.selectedEmotions),
        emotionType: "negative" as const,
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

        const noteId = payload?.noteId;
        if (!noteId) {
          throw new Error("note_id_missing");
        }
        const unifiedProgress = readUnifiedTourProgress();
        if (unifiedProgress && unifiedProgress.lastStep >= MINIMAL_TOUR_TOTAL - 1) {
          markDetailConfettiPending();
        }

        clearSessionResumeDraft();

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
      flow.noteTitle,
      flow.selectedCognitiveErrors,
      flow.selectedEmotions,
      flow.userInput,
      isSaving,
      pushToast,
      queryClient,
      requireAccessContext,
      router,
      saveMinimalMutation,
    ],
  );

  const handleCompletePositive = useCallback(
    async (selection: PositiveSdtSelection) => {
      if (isSaving) return;
      const access = await requireAccessContext();
      if (!access) return;

      const minimalPayload = {
        title:
          flow.noteTitle ||
          buildSessionNoteTitle({
            emotion: formatEmotionIds(flow.selectedEmotions),
            incident: flow.userInput,
          }),
        triggerText: flow.userInput,
        emotion: formatEmotionIds(flow.selectedEmotions),
        emotions: mapEmotionIdsToLabels(flow.selectedEmotions),
        emotionType: "positive" as const,
        automaticThought: selection.innerBelief,
        alternativeThought: "",
        cognitiveError: null,
        sdtType: selection.sdtType,
        sdtEmpathyText: selection.empathyText,
        reflectionQuestion: selection.reflectionQuestion,
        behaviorLabel: selection.behaviorLabel,
        behaviorDescription: selection.behaviorDescription,
        behaviorChecklist: selection.behaviorChecklist,
      };

      setIsSaving(true);

      try {
        const { ok, payload } = await saveMinimalMutation.mutateAsync({
          access,
          payload: minimalPayload,
        });
        if (!ok) {
          throw new Error("save_positive_note_failed");
        }

        const noteId = payload?.noteId;
        if (!noteId) {
          throw new Error("note_id_missing");
        }
        const unifiedProgress = readUnifiedTourProgress();
        if (unifiedProgress && unifiedProgress.lastStep >= MINIMAL_TOUR_TOTAL - 1) {
          markDetailConfettiPending();
        }

        clearSessionResumeDraft();

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
        console.error("긍정 세션 저장 실패:", error);
        pushToast("세션 기록을 저장하지 못했습니다.", "error");
        setIsSaving(false);
      }
    },
    [
      flow.noteTitle,
      flow.selectedEmotions,
      flow.userInput,
      isSaving,
      pushToast,
      queryClient,
      requireAccessContext,
      router,
      saveMinimalMutation,
    ],
  );

  const { moodType, handleSelectMood } = useSessionMoodController({
    selectedEmotionIds: flow.selectedEmotions,
    setSelectedEmotionIds: actions.setSelectedEmotions,
  });

  return {
    flow,
    actions,
    moodType,
    handleSelectMood,
    moodTitle,
    incidentTitle,
    isSaving,
    canGoBack: currentStepIndex > 0,
    handleBack,
    handleGoHome,
    showLeaveConfirm,
    handleCancelLeave,
    handleConfirmLeave,
    handleProceedFromIncident,
    handleSelectDistortion,
    handleComplete,
    handleCompletePositive,
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
