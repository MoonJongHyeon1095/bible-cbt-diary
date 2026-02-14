"use client";

import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { CbtFloatingBackButton } from "@/components/session/common/CbtFloatingBackButton";
import { CbtFloatingHomeButton } from "@/components/session/common/CbtFloatingHomeButton";
import { CbtLoadingState } from "@/components/session/common/CbtLoadingState";
import { CbtSavingModal } from "@/components/session/common/CbtSavingModal";
import { CbtMinimalEmotionSection } from "@/components/session/minimal/emotion-select/CbtMinimalEmotionSection";
import styles from "@/components/session/minimal/MinimalStyles.module.css";
import { CbtDeepAlternativeThoughtSection } from "./alternative/CbtDeepAlternativeThoughtSection";
import { CbtDeepAutoThoughtSection } from "./auto-thought/CbtDeepAutoThoughtSection";
import { CbtDeepCognitiveErrorSection } from "./cognitive-error/CbtDeepCognitiveErrorSection";
import { useDeepSessionController } from "./hooks/useDeepSessionController";
import { CbtDeepIncidentSection } from "./incident/CbtDeepIncidentSection";
import { CbtDeepSelectSection } from "./note-select/CbtDeepSelectSection";

function CbtDeepSessionPageContent() {
  const {
    flow,
    actions,
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
    canGoBack,
    handleBack,
    handleGoHome,
    handleSelectErrors,
    handleComplete,
    tourSteps,
    isTourOpen,
    setIsTourOpen,
    tourStep,
    setTourStep,
    handleTourFinish,
    handleTourClose,
    handleTourMaskClick,
  } = useDeepSessionController();

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
        <div className={styles.mobileSafeTopInset} aria-hidden />
        <CbtSavingModal open={isSaving} />
        {canGoBack && (
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

        {flow.step === "select" && (
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
            onNext={() => {
              actions.setWantsCustom(false);
              actions.setStep("thought");
            }}
          />
        )}

        {flow.step === "thought" && (
          <CbtDeepAutoThoughtSection
            userInput={flow.userInput}
            emotion={flow.selectedEmotion}
            mainNote={mainNote}
            subNotes={subNotes}
            internalContext={internalContext}
            wantsCustom={flow.autoThoughtWantsCustom}
            onWantsCustomChange={actions.setWantsCustom}
            onComplete={actions.setAutoThought}
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
