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
import type { SessionMoodType } from "../../minimal/emotion-select/CbtSessionMoodToggle";

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
  const emotionIdParam = searchParams.get("emotionId");
  const preselectedEmotion = useMemo(() => {
    if (!emotionIdParam) return "";
    return ALL_EMOTIONS.find((item) => item.id === emotionIdParam)?.label ?? "";
  }, [emotionIdParam]);

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
  const [moodType, setMoodType] = useState<SessionMoodType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const { blocker, canShowOnboarding } = useGate();

  const stepOrder: DeepStep[] = useMemo(
    () =>
      shouldSelectSubNotes
        ? [
            ...DEEP_NOTE_SELECT_STEPS,
            ...(flow.selectedEmotion
              ? []
              : [...DEEP_MOOD_STEPS, ...DEEP_EMOTION_SELECT_STEPS]),
            ...DEEP_INCIDENT_STEPS,
            ...DEEP_DISTORTION_STEPS,
            ...DEEP_ALTERNATIVE_STEPS,
          ]
        : [
            ...(flow.selectedEmotion
              ? []
              : [...DEEP_MOOD_STEPS, ...DEEP_EMOTION_SELECT_STEPS]),
            ...DEEP_INCIDENT_STEPS,
            ...DEEP_DISTORTION_STEPS,
            ...DEEP_ALTERNATIVE_STEPS,
          ],
    [flow.selectedEmotion, shouldSelectSubNotes],
  );
  const currentStepIndex = stepOrder.indexOf(flow.step);

  const saveDeepMutation = useMutation({
    mutationFn: async (args: {
      access: { mode: "auth" | "guest" | "blocked"; accessToken: string | null };
      payload: {
        title: string;
        trigger_text: string;
        emotion: string;
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

  useEffect(() => {
    actions.setStep(shouldSelectSubNotes ? "select" : "mood");
  }, [actions, flowIdParam, mainIdParam, shouldSelectSubNotes]);

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
    const alternatives = notes.flatMap((note) =>
      (note.alternative_details ?? []).map((detail) => detail.alternative),
    );
    return alternatives.filter(Boolean);
  }, [mainNote, subNotes]);

  const {
    context: internalContext,
    error: internalContextLoadError,
  } = useCbtDeepInternalContext(mainNote, subNotes, {
    enabled:
      aiEnabled &&
      Boolean(mainNote) &&
      !notesLoading &&
      (!selectionRequired ||
        (flow.step !== "select" && subNotes.length > 0)),
  });
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

  useEffect(() => {
    if (!internalContextLoadError) return;
    pushToast(internalContextLoadError, "error");
  }, [internalContextLoadError, pushToast]);

  useEffect(() => {
    if (!montageScenarioError) return;
    pushToast(montageScenarioError, "error");
  }, [montageScenarioError, pushToast]);

  useEffect(() => {
    if (!montagePictureError) return;
    pushToast(montagePictureError, "error");
  }, [montagePictureError, pushToast]);

  useEffect(() => {
    if (!montageSaveError) return;
    pushToast(montageSaveError, "error");
  }, [montageSaveError, pushToast]);

  const { handleBack, handleGoHome } = useDeepSessionNavigationHandlers({
    flowStep: flow.step,
    currentStepIndex,
    stepOrder,
    flowId,
    mainNote,
    setStep: actions.setStep,
    router,
  });

  const { handleConfirmSelection } = useDeepSessionSelectionHandlers({
    confirmSelection,
    setStep: actions.setStep,
    nextStep: flow.selectedEmotion ? "incident" : "mood",
  });

  const { handleComplete } = useDeepSessionSaveHandlers({
    flow,
    flowId,
    mainNote,
    subNotes,
    isSaving,
    setIsSaving,
    setAiEnabled,
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

  const handleSelectMood = (nextMood: SessionMoodType) => {
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
  };

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
    internalContext,
    previousAlternatives,
    isSaving,
    canGoBack: currentStepIndex > 0 || flow.step === "select",
    handleBack,
    handleGoHome,
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
