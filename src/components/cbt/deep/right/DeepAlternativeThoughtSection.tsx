import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { SelectedCognitiveError } from "@/lib/cbtTypes";
import { MinimalFloatingNextButton } from "@/components/cbt/minimal/common/MinimalFloatingNextButton";
import { MinimalLoadingState } from "@/components/cbt/minimal/common/MinimalLoadingState";
import { MinimalStepHeaderSection } from "@/components/cbt/minimal/common/MinimalStepHeaderSection";
import { MinimalAlternativeThoughtBodySection } from "@/components/cbt/minimal/right/components/MinimalAlternativeThoughtBodySection";
import { MinimalAlternativeThoughtErrorState } from "@/components/cbt/minimal/right/components/MinimalAlternativeThoughtErrorState";
import { useDeepAlternativeThoughts } from "../hooks/useDeepAlternativeThoughts";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import Button from "@/components/ui/Button";

interface DeepAlternativeThoughtSectionProps {
  userInput: string;
  emotion: string;
  autoThought: string;
  summary: string;
  selectedCognitiveErrors: SelectedCognitiveError[];
  previousAlternatives: string[];
  seed: number;
  onSelect: (thought: string) => void;
}

const TITLE = "그럼에도 새로운 목소리가 필요합니다.";
const DESCRIPTION = "가장 힘이 되는 생각을 골라주세요.";

export function DeepAlternativeThoughtSection({
  userInput,
  emotion,
  autoThought,
  summary,
  selectedCognitiveErrors,
  previousAlternatives,
  seed,
  onSelect,
}: DeepAlternativeThoughtSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    alternativeThoughts,
    thoughtsLoading,
    thoughtsError,
    generateAlternatives,
  } = useDeepAlternativeThoughts({
    step: 4,
    userInput,
    emotion,
    autoThought,
    summary,
    selectedCognitiveErrors,
    previousAlternatives,
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
