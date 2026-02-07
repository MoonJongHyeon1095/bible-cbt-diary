import CbtCarousel from "@/components/cbt/common/CbtCarousel";
import CbtCarouselDots from "@/components/cbt/common/CbtCarouselDots";
import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { useCbtCognitiveErrorRanking } from "@/components/cbt/hooks/useCbtCognitiveErrorRanking";
import AiFallbackNotice from "@/components/common/AiFallbackNotice";
import CharacterPrompt from "@/components/ui/CharacterPrompt";
import { COGNITIVE_ERRORS_BY_INDEX } from "@/lib/ai";
import { useEmblaPagination } from "@/lib/hooks/useEmblaPagination";
import type { SelectedCognitiveError } from "@/lib/types/cbtTypes";
import { CbtMinimalFloatingNextButton } from "../common/CbtMinimalFloatingNextButton";
import { CbtLoadingState } from "@/components/cbt/common/CbtLoadingState";
import { CbtStepHeaderSection } from "@/components/cbt/common/CbtStepHeaderSection";
import styles from "../MinimalStyles.module.css";
import { CbtMinimalCognitiveErrorCard } from "./components/CbtMinimalCognitiveErrorCard";
import { CbtMinimalCognitiveErrorErrorState } from "./components/CbtMinimalCognitiveErrorErrorState";

interface CbtMinimalCognitiveErrorSectionProps {
  userInput: string;
  thought: string;
  onSelect: (errors: SelectedCognitiveError[]) => void;
}

const HEADER_TEXT = "혹시 이런 생각의 습관이 있지 않을까요?";
const HEADER_DESCRIPTION = (
  <div>
    <p>
      <strong>생각은 우리를 어디론가 데려가지만...</strong>
    </p>
    <p>
      어떤 장소에 도착했습니다.
      <br />
      속삭이는 목소리들이 들립니다.
      <br />
      하지만 진실만 말하는 것 같지는 않습니다.
    </p>
  </div>
);

export function CbtMinimalCognitiveErrorSection({
  userInput,
  thought,
  onSelect,
}: CbtMinimalCognitiveErrorSectionProps) {
  const { pushToast } = useCbtToast();
  const {
    ranked,
    detailByIndex,
    currentRankItem,
    currentDetail,
    currentMeta,
    currentIndex,
    setCurrentIndex,
    loading,
    error,
    rankLoading,
    isFallback,
    reload,
  } = useCbtCognitiveErrorRanking({ userInput, thought });
  const detailCount = ranked.reduce(
    (count, item) => (detailByIndex[item.index]?.analysis ? count + 1 : count),
    0,
  );
  const { emblaRef, controls } = useEmblaPagination({
    slidesCount: ranked.length,
    draggable: !loading && !rankLoading,
    selectedIndex: currentIndex,
    onSelectIndex: setCurrentIndex,
  });

  const handleSelect = () => {
    if (!currentRankItem) {
      pushToast("인지오류를 불러오는 중입니다.", "error");
      return;
    }
    if (!currentMeta) return;
    if (!currentDetail) {
      pushToast("설명을 불러오는 중입니다.", "error");
      return;
    }
    const payload: SelectedCognitiveError = {
      id: currentMeta.id,
      index: currentMeta.index,
      title: currentMeta.title,
      detail: currentDetail.analysis,
    };
    onSelect([payload]);
  };

  if (loading) {
    return (
      <CbtLoadingState
        prompt={<CharacterPrompt name="EDi" greeting="" />}
        title={HEADER_TEXT}
        description={HEADER_DESCRIPTION}
        message="생각을 살펴보고 있어요."
        variant="page"
      />
    );
  }

  if (error) {
    return (
      <CbtMinimalCognitiveErrorErrorState error={error} onRetry={reload} />
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.headerInset}>
          <div className={styles.headerPrompt}>
            <CharacterPrompt name="EDi" greeting="" />
          </div>
          <CbtStepHeaderSection
            title={HEADER_TEXT}
            description={HEADER_DESCRIPTION}
          />
        </div>
        {isFallback && <AiFallbackNotice onRetry={() => void reload()} />}

        {currentRankItem && (
          <CbtCarousel emblaRef={emblaRef}>
            {ranked.map((item, index) => {
              const meta = COGNITIVE_ERRORS_BY_INDEX[item.index];
              const detail = detailByIndex[item.index];
              return (
                <div
                  key={`${item.index}-${index}`}
                  className={styles.emblaSlide}
                >
                  <CbtMinimalCognitiveErrorCard
                    title={meta?.title ?? "인지오류"}
                    infoDescription={meta?.description}
                    evidenceQuote={item.evidenceQuote}
                    reason={item.reason}
                    detail={detail?.analysis}
                  />
                </div>
              );
            })}
          </CbtCarousel>
        )}

        <div className={styles.formStack}>
          <CbtMinimalFloatingNextButton
            onClick={handleSelect}
            ariaLabel="이 오류로 진행"
          />
          <CbtCarouselDots
            count={detailCount}
            currentIndex={currentIndex < detailCount ? currentIndex : -1}
            onSelect={controls.scrollTo}
            disabled={rankLoading}
          />
        </div>
      </div>
    </div>
  );
}
