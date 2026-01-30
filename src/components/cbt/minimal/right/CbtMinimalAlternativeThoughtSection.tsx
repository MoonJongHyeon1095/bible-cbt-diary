import { useCbtAlternativeThoughts } from "@/components/cbt/hooks/useCbtAlternativeThoughts";
import Button from "@/components/ui/Button";
import type {
  EmotionThoughtPair,
  SelectedCognitiveError,
} from "@/lib/types/cbtTypes";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { CbtMinimalFloatingNextButton } from "../common/CbtMinimalFloatingNextButton";
import { CbtMinimalLoadingState } from "../common/CbtMinimalLoadingState";
import { CbtMinimalStepHeaderSection } from "../common/CbtMinimalStepHeaderSection";
import styles from "../MinimalStyles.module.css";
import { CbtMinimalAlternativeThoughtBodySection } from "./components/CbtMinimalAlternativeThoughtBodySection";
import { CbtMinimalAlternativeThoughtErrorState } from "./components/CbtMinimalAlternativeThoughtErrorState";

interface CbtMinimalAlternativeThoughtSectionProps {
  userInput: string;
  emotionThoughtPairs: EmotionThoughtPair[];
  selectedCognitiveErrors: SelectedCognitiveError[];
  seed: number;
  onSelect: (thought: string) => void;
}

const TITLE = "어떤 생각이 마음에\u00a0와닿나요?";
const DESCRIPTION = "가장 힘이 되는 생각을 골라주세요.";

export function CbtMinimalAlternativeThoughtSection({
  userInput,
  emotionThoughtPairs,
  selectedCognitiveErrors,
  seed,
  onSelect,
}: CbtMinimalAlternativeThoughtSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    alternativeThoughts,
    thoughtsLoading,
    thoughtsError,
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
    setCurrentIndex(0);
  }, [alternativeThoughts]);

  const currentThought = alternativeThoughts[currentIndex];

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < alternativeThoughts.length - 1;

  const handlePrev = () => {
    if (!canGoPrev) return;
    setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (!canGoNext) return;
    setCurrentIndex((prev) => prev + 1);
  };

  if (thoughtsLoading) {
    return (
      <CbtMinimalLoadingState
        title={TITLE}
        description={DESCRIPTION}
        message="대안사고를 정리하고 있어요."
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
          <CbtMinimalStepHeaderSection title={TITLE} description={DESCRIPTION} />
        </div>

        <div className={styles.inlineCard}>
          <CbtMinimalAlternativeThoughtBodySection
            thought={currentThought?.thought ?? ""}
            technique={currentThought?.technique}
            fallback="대안사고를 불러오는 중입니다."
          />
        </div>

        <div className={styles.formStack}>
          <CbtMinimalFloatingNextButton
            onClick={() =>
              currentThought?.thought && onSelect(currentThought.thought)
            }
            ariaLabel="이 생각으로 진행"
            disabled={!currentThought?.thought}
          />
          <div className={styles.controlRow}>
            <Button
              type="button"
              variant="unstyled"
              onClick={handlePrev}
              aria-label="이전 생각 보기"
              disabled={!canGoPrev}
              className={styles.smallIconButton}
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </Button>
            <Button
              type="button"
              variant="unstyled"
              onClick={handleNext}
              aria-label="다음 생각 보기"
              disabled={!canGoNext}
              className={styles.smallIconButton}
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
