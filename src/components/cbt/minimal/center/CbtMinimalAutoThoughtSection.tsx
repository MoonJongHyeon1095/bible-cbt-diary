import { useState } from "react";
import { validateUserText } from "@/components/cbt/utils/validation";
import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { useCbtAutoThoughtSuggestions } from "@/components/cbt/hooks/useCbtAutoThoughtSuggestions";
import { CbtMinimalFloatingNextButton } from "../common/CbtMinimalFloatingNextButton";
import { CbtMinimalLoadingState } from "../common/CbtMinimalLoadingState";
import { CbtMinimalStepHeaderSection } from "../common/CbtMinimalStepHeaderSection";
import { CbtMinimalAutoThoughtControlSection } from "./components/CbtMinimalAutoThoughtControlSection";
import { CbtMinimalAutoThoughtHintSection } from "./components/CbtMinimalAutoThoughtHintSection";
import { CbtMinimalAutoThoughtInputForm } from "./components/CbtMinimalAutoThoughtInputForm";
import { CbtMinimalAutoThoughtTextSection } from "./components/CbtMinimalAutoThoughtTextSection";
import styles from "../MinimalStyles.module.css";
import Button from "@/components/ui/Button";

interface CbtMinimalAutoThoughtSectionProps {
  userInput: string;
  emotion: string;
  wantsCustom: boolean;
  onWantsCustomChange: (next: boolean) => void;
  onSubmitThought: (thought: string) => void;
}

export function CbtMinimalAutoThoughtSection({
  userInput,
  emotion,
  wantsCustom,
  onWantsCustomChange,
  onSubmitThought,
}: CbtMinimalAutoThoughtSectionProps) {
  const { pushToast } = useCbtToast();
  const [customThought, setCustomThought] = useState("");
  const title = (
    <>
      {emotion} 뒤에 숨어있는
      <br />
      생각을 찾아볼게요.
    </>
  );

  const resetSelection = () => {
    onWantsCustomChange(false);
    setCustomThought("");
  };

  const {
    currentThought,
    loading,
    error,
    shouldShowCustom,
    goNextThought,
    goPrevThought,
    canGoPrev,
    canGoNext,
    reloadThoughts,
  } = useCbtAutoThoughtSuggestions({
    userInput,
    emotion,
    onResetSelection: resetSelection,
  });

  const handleSubmit = () => {
    if (wantsCustom) {
      const validation = validateUserText(customThought, {
        minLength: 10,
        minLengthMessage: "직접 입력한 생각을 10자 이상 적어주세요.",
      });
      if (!validation.ok) {
        pushToast(validation.message, "error");
        return;
      }
      onSubmitThought(customThought.trim());
      return;
    }

    if (!currentThought) {
      pushToast("생각을 불러오는 중입니다.", "error");
      return;
    }

    const beliefText = currentThought.belief.trim();
    if (!beliefText) {
      pushToast("생각을 불러오는 중입니다.", "error");
      return;
    }
    onSubmitThought(beliefText);
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.headerInset}>
          <CbtMinimalStepHeaderSection title={title}>
            {error && (
              <div className={styles.helperText}>
                {error}{" "}
              <Button
                type="button"
                variant="unstyled"
                onClick={() => void reloadThoughts()}
                className={styles.exampleButton}
              >
                다시 불러오기
              </Button>
            </div>
          )}
          </CbtMinimalStepHeaderSection>
        </div>

        {wantsCustom ? (
          <div className={styles.inlineCard}>
            <CbtMinimalAutoThoughtInputForm
              value={customThought}
              onChange={setCustomThought}
            />
          </div>
        ) : loading ? (
          <CbtMinimalLoadingState message="생각을 정리하고 있어요." />
        ) : (
          <div className={styles.inlineCard}>
            <CbtMinimalAutoThoughtTextSection
              belief={currentThought?.belief ?? ""}
              emotionReason={currentThought?.emotionReason ?? ""}
              fallback="생각을 불러오는 중입니다."
            />
          </div>
        )}

        {wantsCustom ? (
          <CbtMinimalAutoThoughtHintSection />
        ) : (
          <CbtMinimalAutoThoughtControlSection
            disabled={loading}
            showCustomButton={shouldShowCustom}
            onNextThought={goNextThought}
            onPrevThought={goPrevThought}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onEnableCustom={() => onWantsCustomChange(true)}
          />
        )}

        <CbtMinimalFloatingNextButton onClick={handleSubmit} />
      </div>
    </div>
  );
}
