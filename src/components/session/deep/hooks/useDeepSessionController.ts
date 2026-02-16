import { useCbtToast } from "@/components/session/common/CbtToast";
import { useCbtAccess } from "@/components/session/hooks/useCbtAccess";
import { saveDeepSessionAPI } from "@/lib/api/session/postDeepSession";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import type { SelectedCognitiveError } from "@/lib/types/sessionTypes";
import { flushTokenSessionUsage } from "@/lib/storage/token/sessionUsage";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCbtDeepInternalContext } from "./useCbtDeepInternalContext";
import { useCbtDeepMontageScenario } from "./useCbtDeepMontageScenario";
import { useCbtDeepMontagePicture } from "./useCbtDeepMontagePicture";
import { useDeepSessionNotes } from "./useDeepSessionNotes";
import { useDeepSessionOnboarding } from "./useDeepSessionOnboarding";
import { useDeepSessionNavigationHandlers } from "../handlers/useDeepSessionNavigationHandlers";
import { useDeepSessionSelectionHandlers } from "../handlers/useDeepSessionSelectionHandlers";
import { useDeepSessionSaveHandlers } from "../handlers/useDeepSessionSaveHandlers";
import { buildSessionNoteTitle } from "@/components/session/utils/buildSessionNoteTitle";
import { generateSessionNoteTitle } from "@/lib/gpt/sessionTitle";
import { useGate } from "@/components/gate/GateProvider";
import {
  DEEP_ALTERNATIVE_STEPS,
  DEEP_DISTORTION_STEPS,
  DEEP_EMOTION_SELECT_STEPS,
  DEEP_INCIDENT_STEPS,
  DEEP_MOOD_STEPS,
  DEEP_NOTE_SELECT_STEPS,
  useCbtDeepSessionFlow,
  type DeepStep,
} from "@/components/session/hooks/useCbtDeepSessionFlow";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ALL_EMOTIONS,
  NEGATIVE_EMOTIONS,
  POSITIVE_EMOTIONS,
} from "@/lib/constants/emotions";
import { useLeaveConfirm } from "@/components/restore/useLeaveConfirm";
import { clearSessionResumeDraft } from "@/components/restore/storage";
import { useDeepSessionRestore } from "./controller/useDeepSessionRestore";
import { useDeepSessionInitialization } from "./controller/useDeepSessionInitialization";
import { useDeepSessionResumeDraft } from "./controller/useDeepSessionResumeDraft";
import { useDeepSessionErrorToasts } from "./controller/useDeepSessionErrorToasts";
import { useSessionMoodController } from "@/components/session/common/useSessionMoodController";

export function useDeepSessionController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useCbtToast();
  const { accessMode: accessStateMode, isLoading: isAccessLoading } =
    useAccessContext();
  const { accessMode, accessToken, requireAccessContext } = useCbtAccess({
    setError: (message) => pushToast(message, "error"),
  });
  const queryClient = useQueryClient();

  const mainIdParam = searchParams.get("mainId") ?? "";
  const flowIdParam = searchParams.get("flowId") ?? "";
  const subIdsParam = searchParams.get("subIds") ?? "";
  const emotionIdsParam = searchParams.get("emotionIds");
  const preselectedEmotions = useMemo(() => {
    const ids = (emotionIdsParam ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
      .slice(0, 2);
    return ids
      .map((id) => ALL_EMOTIONS.find((item) => item.id === id)?.label ?? "")
      .filter((label) => label.length > 0);
  }, [emotionIdsParam]);

  const {
    flowId,
    notesLoading,
    notesError,
    mainNote,
    subNotes,
    shouldSelectSubNotes,
    selectionRequired,
    selectableNotes,
    selectedSubIds,
    selectedCount,
    canConfirmSelection,
    toggleSelectSub,
    confirmSelection,
  } = useDeepSessionNotes({
    mainIdParam,
    flowIdParam,
    subIdsParam,
    accessMode,
    accessToken,
  });

  const { state: flow, actions } = useCbtDeepSessionFlow(
    shouldSelectSubNotes ? "select" : "mood",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const { blocker, canShowOnboarding } = useGate();
  const titleRequestSeqRef = useRef(0);

  const stepOrder: DeepStep[] = useMemo(
    () =>
      shouldSelectSubNotes
        ? [
            ...DEEP_NOTE_SELECT_STEPS,
            ...(flow.selectedEmotions.length > 0
              ? []
              : [...DEEP_MOOD_STEPS, ...DEEP_EMOTION_SELECT_STEPS]),
            ...DEEP_INCIDENT_STEPS,
            ...DEEP_DISTORTION_STEPS,
            ...DEEP_ALTERNATIVE_STEPS,
          ]
        : [
            ...(flow.selectedEmotions.length > 0
              ? []
              : [...DEEP_MOOD_STEPS, ...DEEP_EMOTION_SELECT_STEPS]),
            ...DEEP_INCIDENT_STEPS,
            ...DEEP_DISTORTION_STEPS,
            ...DEEP_ALTERNATIVE_STEPS,
          ],
    [flow.selectedEmotions.length, shouldSelectSubNotes],
  );
  const currentStepIndex = stepOrder.indexOf(flow.step);

  const saveDeepMutation = useMutation({
    mutationFn: async (args: {
      access: { mode: "auth" | "guest" | "blocked"; accessToken: string | null };
      payload: {
        title: string;
        trigger_text: string;
        emotion: string;
        emotions?: string[];
        automatic_thought: string;
        selected_cognitive_error: SelectedCognitiveError | null;
        selected_alternative_thought: string;
        main_id: number;
        sub_ids: number[];
        flow_id: number | null;
      };
    }) => saveDeepSessionAPI(args.access, args.payload),
  });

  const {
    tourSteps,
    isTourOpen,
    setIsTourOpen,
    tourStep,
    setTourStep,
    handleTourFinish,
    handleTourClose,
    handleTourMaskClick,
  } = useDeepSessionOnboarding({
    flowStep: flow.step,
    isAccessLoading,
    accessStateMode,
    canShowOnboarding,
    blocker,
  });

  const routeInitKey = `${flowIdParam}|${mainIdParam}|${shouldSelectSubNotes ? "1" : "0"}`;

  const { restoredInternalContext, hasPendingDeepRestore } = useDeepSessionRestore({
    notesLoading,
    mainNote,
    flowId,
    subNotes,
    actions: {
      setSelectedEmotions: actions.setSelectedEmotions,
      setUserInput: actions.setUserInput,
      setStep: (step) => actions.setStep(step),
    },
    queryClient: {
      setQueryData: (queryKey, data) => queryClient.setQueryData(queryKey, data),
    },
  });

  useDeepSessionInitialization({
    routeInitKey,
    shouldSelectSubNotes,
    hasPendingDeepRestore,
    setStep: actions.setStep,
  });

  useEffect(() => {
    if (preselectedEmotions.length === 0) return;
    const same =
      flow.selectedEmotions.length === preselectedEmotions.length &&
      flow.selectedEmotions.every((value, index) => value === preselectedEmotions[index]);
    if (!same) {
      actions.setSelectedEmotions(preselectedEmotions);
      return;
    }
    if (flow.step === "mood" || flow.step === "emotion") {
      actions.setStep("incident");
    }
  }, [actions, flow.selectedEmotions, flow.step, preselectedEmotions]);

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

  const previousAlternatives = useMemo(() => {
    const notes = mainNote ? [mainNote, ...subNotes] : subNotes;
    const alternatives = notes.map((note) => note.alternative ?? "");
    return alternatives.filter(Boolean);
  }, [mainNote, subNotes]);

  const {
    context: internalContext,
    error: internalContextLoadError,
  } = useCbtDeepInternalContext(mainNote, subNotes, {
    enabled:
      aiEnabled &&
      !restoredInternalContext &&
      Boolean(mainNote) &&
      !notesLoading &&
      (!selectionRequired ||
        (flow.step !== "select" && subNotes.length > 0)),
  });
  const resolvedInternalContext = restoredInternalContext ?? internalContext;
  const {
    key: montageScenarioKey,
    scenario: montageScenario,
    error: montageScenarioError,
  } = useCbtDeepMontageScenario(mainNote, subNotes, {
    enabled:
      aiEnabled &&
      Boolean(mainNote) &&
      !notesLoading &&
      (!selectionRequired ||
        (flow.step !== "select" && subNotes.length > 0)),
  });
  const montageSaveAccess = useMemo(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );
  const montageSaveConfig = useMemo(() => {
    if (!mainNote || !Number.isFinite(flowId ?? NaN)) return undefined;
    return {
      access: montageSaveAccess,
      flowId,
      mainNoteId: mainNote.id,
      subNoteIds: subNotes.map((note) => note.id),
    };
  }, [flowId, mainNote, montageSaveAccess, subNotes]);
  const { error: montagePictureError, saveError: montageSaveError } =
    useCbtDeepMontagePicture(montageScenario, {
      enabled: Boolean(montageScenario),
      key: montageScenarioKey,
      save: montageSaveConfig,
    });

  useDeepSessionResumeDraft({
    mainNote,
    flowId,
    selectedEmotions: flow.selectedEmotions,
    userInput: flow.userInput,
    subNotes,
    resolvedInternalContext,
  });

  useDeepSessionErrorToasts({
    internalContextLoadError,
    montageScenarioError,
    montagePictureError,
    montageSaveError,
    pushToast,
  });

  const { handleBack, handleGoHome: handleGoHomeRaw } = useDeepSessionNavigationHandlers({
    flowStep: flow.step,
    currentStepIndex,
    stepOrder,
    flowId,
    mainNote,
    setStep: actions.setStep,
    router,
  });

  const {
    showConfirm: showLeaveConfirm,
    requestLeave: handleGoHome,
    cancelLeave: handleCancelLeave,
    confirmLeave: handleConfirmLeave,
  } = useLeaveConfirm({
    step: flow.step,
    protectedSteps: ["distortion", "alternative"] as const,
    onLeave: handleGoHomeRaw,
  });

  const { handleConfirmSelection } = useDeepSessionSelectionHandlers({
    confirmSelection,
    setStep: actions.setStep,
    nextStep: flow.selectedEmotions.length > 0 ? "incident" : "mood",
  });

  const handleProceedFromIncident = () => {
    const incident = flow.userInput;
    const emotion = flow.selectedEmotions.join(", ");
    const fallbackTitle = buildSessionNoteTitle({
      emotion,
      incident,
    });
    actions.setNoteTitle(fallbackTitle);
    actions.setStep("distortion");

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
        console.error("세션 제목 생성 실패(deep):", error);
      });
  };

  const { handleComplete } = useDeepSessionSaveHandlers({
    flow,
    flowId,
    mainNote,
    subNotes,
    isSaving,
    setIsSaving,
    setAiEnabled,
    clearResumeDraft: clearSessionResumeDraft,
    requireAccessContext,
    saveDeep: saveDeepMutation.mutateAsync,
    queryClient,
    router,
    pushToast,
  });

  const lastDistortionKeyRef = useRef("");
  const handleSelectDistortion = (thought: string, error: SelectedCognitiveError) => {
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
    actions.setDistortion(thought, error, seedBump);
  };

  const { moodType, handleSelectMood } = useSessionMoodController({
    selectedEmotions: flow.selectedEmotions,
    setSelectedEmotions: actions.setSelectedEmotions,
    positiveEmotions: POSITIVE_EMOTIONS,
    negativeEmotions: NEGATIVE_EMOTIONS,
  });

  return {
    flow,
    actions,
    moodType,
    handleSelectMood,
    notesLoading,
    notesError,
    mainNote,
    subNotes,
    selectableNotes,
    selectedSubIds,
    selectedCount,
    canConfirmSelection,
    toggleSelectSub,
    handleConfirmSelection,
    internalContext: resolvedInternalContext,
    previousAlternatives,
    isSaving,
    canGoBack: currentStepIndex > 0 || flow.step === "select",
    handleBack,
    handleGoHome,
    showLeaveConfirm,
    handleCancelLeave,
    handleConfirmLeave,
    handleProceedFromIncident,
    handleSelectDistortion,
    handleComplete,
    tourSteps,
    isTourOpen,
    setIsTourOpen,
    tourStep,
    setTourStep,
    handleTourFinish,
    handleTourClose,
    handleTourMaskClick,
  };
}
