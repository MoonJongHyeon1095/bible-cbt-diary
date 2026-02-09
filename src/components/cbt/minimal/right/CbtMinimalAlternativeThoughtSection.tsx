import CbtCarousel from "@/components/cbt/common/CbtCarousel";
import CbtCarouselDots from "@/components/cbt/common/CbtCarouselDots";
import { CbtLoadingState } from "@/components/cbt/common/CbtLoadingState";
import { CbtStepHeaderSection } from "@/components/cbt/common/CbtStepHeaderSection";
import { useCbtAlternativeThoughts } from "@/components/cbt/hooks/useCbtAlternativeThoughts";
import AiFallbackNotice from "@/components/common/AiFallbackNotice";
import CharacterPrompt from "@/components/ui/CharacterPrompt";
import { useEmblaPagination } from "@/lib/hooks/useEmblaPagination";
import type {
  EmotionThoughtPair,
  SelectedCognitiveError,
} from "@/lib/types/cbtTypes";
import { useEffect, useState } from "react";
import { CbtMinimalFloatingNextButton } from "../common/CbtMinimalFloatingNextButton";
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

const TITLE = "힘이 되는 새로운 생각을 골라 볼까요?";
const DESCRIPTION = (
  <div>
    <p>
      <strong>속삭이는 목소리를 바꿀 수 있다면?</strong>
    </p>
    <p>
      조금만 들여다 보아도 목소리는 잦아듭니다.
      <br />
      그리고 어쩌면 우리는 이곳에 더 나은 목소리를 새길 수 있을지도 모릅니다.
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
  const [currentIndex, setCurrentIndex] = useState(0);

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
    setCurrentIndex(0);
  }, [alternativeThoughts]);

  const currentThought = alternativeThoughts[currentIndex];

  const { emblaRef, controls } = useEmblaPagination({
    slidesCount: alternativeThoughts.length,
    draggable: !thoughtsLoading,
    selectedIndex: currentIndex,
    onSelectIndex: setCurrentIndex,
  });

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

        <CbtCarousel emblaRef={emblaRef}>
          {alternativeThoughts.map((thought, index) => (
            <div
              key={`${thought.thought}-${index}`}
              className={styles.emblaSlide}
            >
              <div className={styles.inlineCard}>
                <CbtMinimalAlternativeThoughtBodySection
                  thought={thought.thought ?? ""}
                  technique={thought.technique}
                  fallback="대안사고를 불러오는 중입니다."
                />
              </div>
            </div>
          ))}
        </CbtCarousel>

        <div className={styles.formStack}>
          <CbtMinimalFloatingNextButton
            onClick={() =>
              currentThought?.thought && onSelect(currentThought.thought)
            }
            ariaLabel="이 생각으로 진행"
            disabled={!currentThought?.thought}
          />
          <CbtCarouselDots
            count={alternativeThoughts.length}
            currentIndex={currentIndex}
            onSelect={controls.scrollTo}
          />
        </div>
      </div>
    </div>
  );
}
