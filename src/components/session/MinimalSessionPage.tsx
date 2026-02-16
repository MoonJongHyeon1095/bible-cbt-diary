"use client";

import OnboardingTour from "@/components/onboarding/OnboardingTour";
import AppHeader from "@/components/header/AppHeader";
import { CbtSavingModal } from "@/components/session/common/CbtSavingModal";
import { CbtMinimalAlternativeThoughtSection } from "./minimal/alternative/CbtMinimalAlternativeThoughtSection";
import { CbtMinimalDistortionSection } from "./minimal/distortion/CbtMinimalDistortionSection";
import { CbtMinimalEmotionSection } from "./minimal/emotion-select/CbtMinimalEmotionSection";
import { CbtMinimalMoodSection } from "./minimal/emotion-select/CbtMinimalMoodSection";
import { useMinimalSessionController } from "./minimal/hooks/useMinimalSessionController";
import { CbtMinimalIncidentSection } from "./minimal/incident/CbtMinimalIncidentSection";
import styles from "./minimal/MinimalStyles.module.css";

function MinimalSessionPageContent() {
  const {
    flow,
    actions,
    moodType,
    handleSelectMood,
    incidentTitle,
    isSaving,
    canGoBack,
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
            onNext={() => actions.setStep("distortion")}
            title={incidentTitle}
          />
        )}

        {flow.step === "emotion" && (
          <CbtMinimalEmotionSection
            moodType={moodType}
            onSelectMood={handleSelectMood}
            selectedEmotion={flow.selectedEmotion}
            onSelectEmotion={actions.setSelectedEmotion}
            onNext={() => {
              actions.setStep("incident");
            }}
          />
        )}

        {flow.step === "distortion" && (
          <CbtMinimalDistortionSection
            userInput={flow.userInput}
            emotion={flow.selectedEmotion}
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
    </div>
  );
}

export default function MinimalSessionPage() {
  return <MinimalSessionPageContent />;
}
