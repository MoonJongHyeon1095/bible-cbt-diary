import { useAlternativeThoughts } from "@/components/cbt/hooks/useAlternativeThoughts";
import Button from "@/components/ui/Button";
import type {
  EmotionThoughtPair,
  SelectedCognitiveError,
} from "@/lib/types/cbtTypes";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { MinimalFloatingNextButton } from "../common/MinimalFloatingNextButton";
import { MinimalLoadingState } from "../common/MinimalLoadingState";
import { MinimalStepHeaderSection } from "../common/MinimalStepHeaderSection";
import styles from "../MinimalStyles.module.css";
import { MinimalAlternativeThoughtBodySection } from "./components/MinimalAlternativeThoughtBodySection";
import { MinimalAlternativeThoughtErrorState } from "./components/MinimalAlternativeThoughtErrorState";

interface MinimalAlternativeThoughtSectionProps {
  userInput: string;
  emotionThoughtPairs: EmotionThoughtPair[];
  selectedCognitiveErrors: SelectedCognitiveError[];
  seed: number;
  onSelect: (thought: string) => void;
}

const TITLE = "어떤 생각이 마음에\u00a0와닿나요?";
const DESCRIPTION = "가장 힘이 되는 생각을 골라주세요.";

export function MinimalAlternativeThoughtSection({
  userInput,
  emotionThoughtPairs,
  selectedCognitiveErrors,
  seed,
  onSelect,
}: MinimalAlternativeThoughtSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    alternativeThoughts,
    thoughtsLoading,
    thoughtsError,
    generateAlternatives,
  } = useAlternativeThoughts({
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

  const handleNext = async () => {
    if (currentIndex < alternativeThoughts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }
    await generateAlternatives({ force: true });
  };

  if (thoughtsLoading) {
    return (
      <MinimalLoadingState
        title={TITLE}
        description={DESCRIPTION}
        message="대안사고를 정리하고 있어요."
        variant="page"
      />
    );
  }

  if (thoughtsError) {
    return (
      <MinimalAlternativeThoughtErrorState
        error={thoughtsError}
        onRetry={() => void generateAlternatives({ force: true })}
      />
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.headerInset}>
          <MinimalStepHeaderSection title={TITLE} description={DESCRIPTION} />
        </div>

        <div className={styles.inlineCard}>
          <MinimalAlternativeThoughtBodySection
            thought={currentThought?.thought ?? ""}
            technique={currentThought?.technique}
            fallback="대안사고를 불러오는 중입니다."
          />
        </div>

        <div className={styles.formStack}>
          <MinimalFloatingNextButton
            onClick={() =>
              currentThought?.thought && onSelect(currentThought.thought)
            }
            ariaLabel="이 생각으로 진행"
            disabled={!currentThought?.thought}
          />
          <Button
            type="button"
            variant="unstyled"
            onClick={() => void handleNext()}
            aria-label="다른 생각 보기"
            className={styles.smallIconButton}
          >
            <RefreshCw size={18} strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}
