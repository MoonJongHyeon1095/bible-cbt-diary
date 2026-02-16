"use client";

import OnboardingTour from "@/components/onboarding/OnboardingTour";
import AppHeader from "@/components/header/AppHeader";
import LeaveConfirmModal from "@/components/restore/LeaveConfirmModal";
import { CbtLoadingState } from "@/components/session/common/CbtLoadingState";
import { CbtSavingModal } from "@/components/session/common/CbtSavingModal";
import { CbtMinimalEmotionSection } from "@/components/session/minimal/emotion-select/CbtMinimalEmotionSection";
import { CbtMinimalMoodSection } from "@/components/session/minimal/emotion-select/CbtMinimalMoodSection";
import styles from "@/components/session/minimal/MinimalStyles.module.css";
import { CbtDeepAlternativeThoughtSection } from "./alternative/CbtDeepAlternativeThoughtSection";
import { CbtDeepDistortionSection } from "./distortion/CbtDeepDistortionSection";
import { useDeepSessionController } from "./hooks/useDeepSessionController";
import { CbtDeepIncidentSection } from "./incident/CbtDeepIncidentSection";
import { CbtDeepSelectSection } from "./note-select/CbtDeepSelectSection";

function CbtDeepSessionPageContent() {
  const {
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
    canGoBack,
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
        <CbtSavingModal open={isSaving} />
        <AppHeader
          variant="session"
          showDisclaimer={false}
          sessionNav={{
            canGoBack,
            onBack: handleBack,
            onHome: handleGoHome,
          }}
        />

        {flow.step === "mood" && (
          <CbtMinimalMoodSection
            value={moodType}
            onChange={(next) => {
              handleSelectMood(next);
              actions.setStep("emotion");
            }}
          />
        )}

        {flow.step === "incident" && (
          <CbtDeepIncidentSection
            userInput={flow.userInput}
            onInputChange={actions.setUserInput}
            onNext={handleProceedFromIncident}
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
            moodType={moodType}
            onSelectMood={handleSelectMood}
            selectedEmotions={flow.selectedEmotions}
            onSelectEmotion={actions.setSelectedEmotions}
            onNext={() => {
              actions.setStep("incident");
            }}
          />
        )}

        {flow.step === "distortion" && (
          <CbtDeepDistortionSection
            userInput={flow.userInput}
            emotion={flow.selectedEmotions.join(", ")}
            internalContext={internalContext}
            onSelect={handleSelectDistortion}
          />
        )}

        {flow.step === "alternative" && (
          <CbtDeepAlternativeThoughtSection
            userInput={flow.userInput}
            emotion={flow.selectedEmotions.join(", ")}
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
      <LeaveConfirmModal
        open={showLeaveConfirm}
        onCancel={handleCancelLeave}
        onConfirm={handleConfirmLeave}
      />
    </div>
  );
}

export default function CbtDeepSessionPage() {
  return <CbtDeepSessionPageContent />;
}
