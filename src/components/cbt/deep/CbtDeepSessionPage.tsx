"use client";

import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { useCbtAccess } from "@/components/cbt/hooks/useCbtAccess";
import { CbtMinimalEmotionSection } from "@/components/cbt/minimal/center/CbtMinimalEmotionSection";
import { CbtFloatingBackButton } from "@/components/cbt/common/CbtFloatingBackButton";
import { CbtFloatingHomeButton } from "@/components/cbt/common/CbtFloatingHomeButton";
import { CbtLoadingState } from "@/components/cbt/common/CbtLoadingState";
import { CbtSavingModal } from "@/components/cbt/common/CbtSavingModal";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import { saveDeepSessionAPI } from "@/lib/api/cbt/postDeepSession";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import type { SelectedCognitiveError } from "@/lib/types/cbtTypes";
import { flushTokenSessionUsage } from "@/lib/utils/tokenSessionStorage";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CbtDeepAutoThoughtSection } from "./center/CbtDeepAutoThoughtSection";
import { CbtDeepIncidentSection } from "./center/CbtDeepIncidentSection";
import { CbtDeepSelectSection } from "./center/CbtDeepSelectSection";
import { useCbtDeepInternalContext } from "./hooks/useCbtDeepInternalContext";
import { useCbtDeepMontageScenario } from "./hooks/useCbtDeepMontageScenario";
import { useCbtDeepMontagePicture } from "./hooks/useCbtDeepMontagePicture";
import { useDeepSessionNotes } from "./hooks/useDeepSessionNotes";
import { useDeepSessionOnboarding } from "./hooks/useDeepSessionOnboarding";
import { useDeepSessionNavigationHandlers } from "./handlers/useDeepSessionNavigationHandlers";
import { useDeepSessionSelectionHandlers } from "./handlers/useDeepSessionSelectionHandlers";
import { useDeepSessionSaveHandlers } from "./handlers/useDeepSessionSaveHandlers";
import { CbtDeepCognitiveErrorSection } from "./left/CbtDeepCognitiveErrorSection";
import { CbtDeepAlternativeThoughtSection } from "./right/CbtDeepAlternativeThoughtSection";
import { useGate } from "@/components/gate/GateProvider";
import {
  useCbtDeepSessionFlow,
  type DeepStep,
} from "@/components/cbt/hooks/useCbtDeepSessionFlow";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import OnboardingTour from "@/components/ui/OnboardingTour";

function CbtDeepSessionPageContent() {
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
    shouldSelectSubNotes ? "select" : "incident",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const { blocker, canShowOnboarding } = useGate();

  const stepOrder: DeepStep[] = shouldSelectSubNotes
    ? ["select", "incident", "emotion", "thought", "errors", "alternative"]
    : ["incident", "emotion", "thought", "errors", "alternative"];
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
    actions.setStep(shouldSelectSubNotes ? "select" : "incident");
  }, [actions, flowIdParam, mainIdParam, shouldSelectSubNotes]);

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
  const { error: montagePictureError } = useCbtDeepMontagePicture(
    montageScenario,
    {
      enabled: Boolean(montageScenario),
      key: montageScenarioKey,
    },
  );

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
  });

  const { handleSelectErrors, handleComplete } = useDeepSessionSaveHandlers({
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
    setErrors: actions.setErrors,
  });

  if (notesLoading) {
    return (
      <CbtLoadingState
        title="준비 중입니다"
        message="기록을 불러오고 있어요."
        variant="page"
      />
    );
  }

  if (notesError || !mainNote) {
    return (
      <CbtLoadingState
        title="진입할 수 없습니다"
        message={notesError ?? "노트를 찾지 못했습니다."}
        variant="page"
      />
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgWaves} />
      <div className={styles.content}>
        <CbtSavingModal open={isSaving} />
        {(currentStepIndex > 0 || flow.step === "select") && (
          <div className={`${styles.floatingNav} ${styles.left}`}>
            <CbtFloatingBackButton onClick={handleBack} />
          </div>
        )}
        <div className={`${styles.floatingNav} ${styles.right}`}>
          <CbtFloatingHomeButton onClick={handleGoHome} />
        </div>

        {flow.step === "incident" && (
          <CbtDeepIncidentSection
            userInput={flow.userInput}
            onInputChange={actions.setUserInput}
            onNext={() => actions.setStep("emotion")}
            mainNote={mainNote}
            subNotes={subNotes}
          />
        )}

        {flow.step === "select" && mainNote && (
          <CbtDeepSelectSection
            mainNote={mainNote}
            selectableNotes={selectableNotes}
            selectedSubIds={selectedSubIds}
            selectedCount={selectedCount}
            onToggleSub={toggleSelectSub}
            onConfirm={handleConfirmSelection}
            canConfirm={canConfirmSelection}
          />
        )}

        {flow.step === "emotion" && (
          <CbtMinimalEmotionSection
            selectedEmotion={flow.selectedEmotion}
            onSelectEmotion={actions.setSelectedEmotion}
            onNext={() => actions.setStep("thought")}
          />
        )}

        {flow.step === "thought" && (
          <CbtDeepAutoThoughtSection
            userInput={flow.userInput}
            emotion={flow.selectedEmotion}
            mainNote={mainNote}
            subNotes={subNotes}
            internalContext={internalContext}
            onComplete={(nextThought) => {
              actions.setAutoThought(nextThought);
            }}
          />
        )}

        {flow.step === "errors" && (
          <CbtDeepCognitiveErrorSection
            userInput={flow.userInput}
            thought={flow.autoThought}
            internalContext={internalContext}
            onSelect={handleSelectErrors}
          />
        )}

        {flow.step === "alternative" && (
          <CbtDeepAlternativeThoughtSection
            userInput={flow.userInput}
            emotion={flow.selectedEmotion}
            autoThought={flow.autoThought}
            internalContext={internalContext}
            selectedCognitiveErrors={flow.selectedCognitiveErrors}
            previousAlternatives={previousAlternatives}
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

export default function CbtDeepSessionPage() {
  return <CbtDeepSessionPageContent />;
}
