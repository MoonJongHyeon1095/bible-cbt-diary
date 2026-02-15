import AiFallbackNotice from "@/components/common/AiFallbackNotice";
import { CbtLoadingState } from "@/components/session/common/CbtLoadingState";
import { CbtStepHeaderSection } from "@/components/session/common/CbtStepHeaderSection";
import { useCbtAlternativeThoughts } from "@/components/session/hooks/useCbtAlternativeThoughts";
import SafeButton from "@/components/ui/SafeButton";
import type {
  EmotionThoughtPair,
  SelectedCognitiveError,
} from "@/lib/types/sessionTypes";
import { useEffect, useMemo, useState } from "react";
import { CbtMinimalFloatingNextButton } from "../common/CbtMinimalFloatingNextButton";
import styles from "../MinimalStyles.module.css";
import { CbtMinimalAlternativeThoughtBodySection } from "./CbtMinimalAlternativeThoughtBodySection";
import { CbtMinimalAlternativeThoughtErrorState } from "./CbtMinimalAlternativeThoughtErrorState";

interface CbtMinimalAlternativeThoughtSectionProps {
  userInput: string;
  emotionThoughtPairs: EmotionThoughtPair[];
  selectedCognitiveErrors: SelectedCognitiveError[];
  seed: number;
  onSelect: (thought: string) => void;
}

const TITLE = "힘이 되는 새로운 생각을 골라 볼까요?";
const DESCRIPTION = (
  <div>
    <p>
      생각은 우리를 어디론가 데려다 놓지만...
      <br />그 생각에 전부 동의할 필요는 없잖아요?
    </p>
  </div>
);

export function CbtMinimalAlternativeThoughtSection({
  userInput,
  emotionThoughtPairs,
  selectedCognitiveErrors,
  seed,
  onSelect,
}: CbtMinimalAlternativeThoughtSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const {
    alternativeThoughts,
    thoughtsLoading,
    thoughtsError,
    isFallback,
    generateAlternatives,
  } = useCbtAlternativeThoughts({
    step: 4,
    userInput,
    emotionThoughtPairs,
    selectedCognitiveErrors,
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
