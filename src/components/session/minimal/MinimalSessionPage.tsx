"use client";

import OnboardingTour from "@/components/onboarding/OnboardingTour";
import AppHeader from "@/components/header/AppHeader";
import LeaveConfirmModal from "@/components/restore/LeaveConfirmModal";
import { CbtSavingModal } from "@/components/session/common/CbtSavingModal";
import { CbtMinimalAlternativeThoughtSection } from "./alternative/CbtMinimalAlternativeThoughtSection";
import { CbtMinimalDistortionSection } from "./distortion/CbtMinimalDistortionSection";
import { CbtMinimalEmotionSection } from "./emotion-select/CbtMinimalEmotionSection";
import { CbtMinimalMoodSection } from "./emotion-select/CbtMinimalMoodSection";
import { useMinimalSessionController } from "./hooks/useMinimalSessionController";
import { CbtMinimalIncidentSection } from "./incident/CbtMinimalIncidentSection";
import styles from "./MinimalStyles.module.css";

function MinimalSessionPageContent() {
  const {
    flow,
    actions,
    moodType,
    handleSelectMood,
    moodTitle,
    incidentTitle,
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
    tourProgress,
    handleTourFinish,
    handleTourClose,
    handleTourMaskClick,
  } = useMinimalSessionController();

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
            title={moodTitle}
            onChange={(next) => {
              handleSelectMood(next);
              actions.setStep("emotion");
            }}
          />
        )}

        {flow.step === "incident" && (
          <CbtMinimalIncidentSection
            userInput={flow.userInput}
            onInputChange={actions.setUserInput}
            onNext={handleProceedFromIncident}
            title={incidentTitle}
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
          <CbtMinimalDistortionSection
            userInput={flow.userInput}
            emotion={flow.selectedEmotions.join(", ")}
            onSelect={handleSelectDistortion}
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
      <LeaveConfirmModal
        open={showLeaveConfirm}
        onCancel={handleCancelLeave}
        onConfirm={handleConfirmLeave}
      />
    </div>
  );
}

export default function MinimalSessionPage() {
  return <MinimalSessionPageContent />;
}
