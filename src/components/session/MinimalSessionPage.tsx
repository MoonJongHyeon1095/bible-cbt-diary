"use client";

import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { CbtFloatingBackButton } from "@/components/session/common/CbtFloatingBackButton";
import { CbtFloatingHomeButton } from "@/components/session/common/CbtFloatingHomeButton";
import { CbtSavingModal } from "@/components/session/common/CbtSavingModal";
import { CbtMinimalAlternativeThoughtSection } from "./minimal/alternative/CbtMinimalAlternativeThoughtSection";
import { CbtMinimalAutoThoughtSection } from "./minimal/auto-thought/CbtMinimalAutoThoughtSection";
import { CbtMinimalCognitiveErrorSection } from "./minimal/cognitive-error/CbtMinimalCognitiveErrorSection";
import { CbtMinimalEmotionSection } from "./minimal/emotion-select/CbtMinimalEmotionSection";
import { useMinimalSessionController } from "./minimal/hooks/useMinimalSessionController";
import { CbtMinimalIncidentSection } from "./minimal/incident/CbtMinimalIncidentSection";
import styles from "./minimal/MinimalStyles.module.css";

function MinimalSessionPageContent() {
  const {
    flow,
    actions,
    incidentTitle,
    isSaving,
    canGoBack,
    handleBack,
    handleGoHome,
    handleSubmitThought,
    handleSelectEmotion,
    handleSelectErrors,
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

export default function MinimalSessionPage() {
  return <MinimalSessionPageContent />;
}
