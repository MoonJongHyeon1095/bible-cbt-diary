import { CbtLoadingState } from "@/components/cbt/common/CbtLoadingState";
import { CbtStepHeaderSection } from "@/components/cbt/common/CbtStepHeaderSection";
import { CbtMinimalFloatingNextButton } from "@/components/cbt/minimal/common/CbtMinimalFloatingNextButton";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import { CbtMinimalAlternativeThoughtBodySection } from "@/components/cbt/minimal/right/components/CbtMinimalAlternativeThoughtBodySection";
import { CbtMinimalAlternativeThoughtErrorState } from "@/components/cbt/minimal/right/components/CbtMinimalAlternativeThoughtErrorState";
import AiFallbackNotice from "@/components/common/AiFallbackNotice";
import CharacterPrompt from "@/components/ui/CharacterPrompt";
import SafeButton from "@/components/ui/SafeButton";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { SelectedCognitiveError } from "@/lib/types/cbtTypes";
import { useEffect, useMemo, useState } from "react";
import { useCbtDeepAlternativeThoughts } from "../hooks/useCbtDeepAlternativeThoughts";

interface CbtDeepAlternativeThoughtSectionProps {
  userInput: string;
  emotion: string;
  autoThought: string;
  internalContext: DeepInternalContext | null;
  selectedCognitiveErrors: SelectedCognitiveError[];
  previousAlternatives: string[];
  seed: number;
  onSelect: (thought: string) => void;
}

const TITLE = "그럼에도 새로운 목소리가 필요합니다.";
const DESCRIPTION = "가장 힘이 되는 생각을 골라주세요.";

export function CbtDeepAlternativeThoughtSection({
  userInput,
  emotion,
  autoThought,
  internalContext,
  selectedCognitiveErrors,
  previousAlternatives,
  seed,
  onSelect,
}: CbtDeepAlternativeThoughtSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const {
    alternativeThoughts,
    thoughtsLoading,
    thoughtsError,
    isFallback,
    generateAlternatives,
  } = useCbtDeepAlternativeThoughts({
    step: 4,
    userInput,
    emotion,
    autoThought,
    internalContext,
    selectedCognitiveErrors,
    previousAlternatives,
  });

  useEffect(() => {
    if (seed === 0) return;
    void generateAlternatives({ force: true });
  }, [generateAlternatives, seed]);

  useEffect(() => {
    setSelectedIndex(null);
  }, [alternativeThoughts]);

  const selectedThought = useMemo(
    () =>
      selectedIndex === null
        ? null
        : alternativeThoughts[selectedIndex] ?? null,
    [alternativeThoughts, selectedIndex],
  );

  if (thoughtsLoading) {
    return (
      <CbtLoadingState
        prompt={<CharacterPrompt name="EDi" greeting="" />}
        title={TITLE}
        description={DESCRIPTION}
        message="새로운 목소리를 찾아보고 있어요."
        variant="page"
      />
    );
  }

  if (thoughtsError) {
    return (
      <CbtMinimalAlternativeThoughtErrorState
        error={thoughtsError}
        onRetry={() => void generateAlternatives({ force: true })}
      />
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.headerInset}>
          <div className={styles.headerPrompt}>
            <CharacterPrompt name="EDi" greeting="" />
          </div>
          <CbtStepHeaderSection title={TITLE} description={DESCRIPTION} />
        </div>
        {isFallback && (
          <AiFallbackNotice
            onRetry={() => void generateAlternatives({ force: true })}
          />
        )}

        <div className={styles.cardList}>
          {alternativeThoughts.map((thought, index) => {
            const isSelected = selectedIndex === index;
            return (
              <SafeButton
                key={`${thought.thought}-${index}`}
                type="button"
                variant="unstyled"
                onClick={() => setSelectedIndex(index)}
                aria-pressed={isSelected}
                className={`${styles.selectableCard} ${
                  isSelected ? styles.selectableCardSelected : ""
                }`}
              >
                <div className={styles.inlineCard}>
                <CbtMinimalAlternativeThoughtBodySection
                  thought={thought.thought ?? ""}
                  technique={thought.technique}
                  fallback="대안사고를 불러오는 중입니다."
                />
                </div>
              </SafeButton>
            );
          })}
        </div>

        <div className={styles.formStack}>
          <CbtMinimalFloatingNextButton
            onClick={() =>
              selectedThought?.thought && onSelect(selectedThought.thought)
            }
            ariaLabel="이 생각으로 진행"
            disabled={!selectedThought?.thought}
          />
        </div>
      </div>
    </div>
  );
}
