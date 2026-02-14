import { useCbtToast } from "@/components/session/common/CbtToast";
import { useCbtAutoThoughtSuggestions } from "@/components/session/hooks/useCbtAutoThoughtSuggestions";
import { validateUserText } from "@/components/session/utils/validation";
import AiFallbackNotice from "@/components/common/AiFallbackNotice";
import CharacterPrompt from "@/components/ui/CharacterPrompt";
import SafeButton from "@/components/ui/SafeButton";
import { useEffect, useMemo, useState } from "react";
import { CbtInlineNextButton } from "../common/CbtInlineNextButton";
import { CbtMinimalFloatingCustomThoughtButton } from "../common/CbtMinimalFloatingCustomThoughtButton";
import { CbtMinimalFloatingNextButton } from "../common/CbtMinimalFloatingNextButton";
import { CbtLoadingState } from "@/components/session/common/CbtLoadingState";
import { CbtStepHeaderSection } from "@/components/session/common/CbtStepHeaderSection";
import styles from "../MinimalStyles.module.css";
import { CbtMinimalAutoThoughtHintSection } from "./CbtMinimalAutoThoughtHintSection";
import { CbtMinimalAutoThoughtInputForm } from "./CbtMinimalAutoThoughtInputForm";
import { CbtMinimalAutoThoughtTextSection } from "./CbtMinimalAutoThoughtTextSection";

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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const title = (
    <>
      {emotion} 뒤에 숨어있는
      <span className={styles.mobileBreak} aria-hidden="true" />
      생각을 찾아볼게요.
    </>
  );
  const description =
    "어떤 생각은 종종 우리가 눈치채기 전에 자동으로 작동하고, 우리를 어딘가로 데려갑니다.";

  const resetSelection = () => {
    onWantsCustomChange(false);
    setCustomThought("");
    setSelectedIndex(null);
  };

  const {
    thoughts,
    loading,
    error,
    isFallback,
    reloadThoughts,
  } = useCbtAutoThoughtSuggestions({
    userInput,
    emotion,
    onResetSelection: resetSelection,
  });
  const selectedThought = useMemo(
    () => (selectedIndex === null ? null : thoughts[selectedIndex] ?? null),
    [selectedIndex, thoughts],
  );

  useEffect(() => {
    if (!wantsCustom) {
      setSelectedIndex(null);
      setCustomThought("");
    }
  }, [wantsCustom]);

  useEffect(() => {
    setSelectedIndex(null);
  }, [thoughts]);

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

    if (!selectedThought?.belief?.trim()) {
      pushToast("생각을 선택해주세요.", "error");
      return;
    }

    const beliefText = selectedThought.belief.trim();
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
          <div className={styles.headerPrompt}>
            <CharacterPrompt name="EDi" greeting="" />
          </div>
          <CbtStepHeaderSection title={title} description={description}>
            {error && (
              <div className={styles.helperText}>
                {error}{" "}
                <SafeButton
                  type="button"
                  variant="unstyled"
                  onClick={() => void reloadThoughts()}
                  className={styles.exampleButton}
                >
                  다시 불러오기
                </SafeButton>
              </div>
            )}
          </CbtStepHeaderSection>
        </div>
        {isFallback && !loading && (
          <AiFallbackNotice onRetry={() => void reloadThoughts()} />
        )}

        <div data-tour="minimal-thought-carousel">
          {wantsCustom ? (
            <div className={styles.inlineCard}>
              <CbtMinimalAutoThoughtInputForm
                value={customThought}
                onChange={setCustomThought}
                action={
                  <CbtInlineNextButton
                    onClick={handleSubmit}
                    ariaLabel="다음으로"
                  />
                }
              />
            </div>
          ) : loading ? (
            <CbtLoadingState message="생각을 정리하고 있어요." />
          ) : (
            <div className={styles.cardList}>
              {thoughts.map((thought, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <SafeButton
                    key={`${thought.belief}-${index}`}
                    type="button"
                    variant="unstyled"
                    onClick={() => setSelectedIndex(index)}
                    aria-pressed={isSelected}
                    className={`${styles.selectableCard} ${
                      isSelected ? styles.selectableCardSelected : ""
                    }`}
                  >
                    <div className={styles.inlineCard}>
                      <CbtMinimalAutoThoughtTextSection
                        belief={thought.belief ?? ""}
                        emotionReason={thought.emotionReason ?? ""}
                        fallback="생각을 불러오는 중입니다."
                      />
                    </div>
                  </SafeButton>
                );
              })}
            </div>
          )}
        </div>

        {wantsCustom && <CbtMinimalAutoThoughtHintSection />}

        {!wantsCustom && (
          <CbtMinimalFloatingNextButton
            onClick={handleSubmit}
            dataTour="minimal-thought-next"
            disabled={!selectedThought}
          />
        )}

        {!wantsCustom && (
          <CbtMinimalFloatingCustomThoughtButton
            onClick={() => {
              onWantsCustomChange(true);
              setCustomThought("");
              setSelectedIndex(null);
            }}
            disabled={loading}
            dataTour="minimal-thought-custom"
          />
        )}
      </div>
    </div>
  );
}
