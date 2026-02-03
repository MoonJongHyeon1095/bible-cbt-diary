import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { useCbtCognitiveErrorRanking } from "@/components/cbt/hooks/useCbtCognitiveErrorRanking";
import type { SelectedCognitiveError } from "@/lib/types/cbtTypes";
import { CbtMinimalFloatingNextButton } from "../common/CbtMinimalFloatingNextButton";
import { CbtMinimalLoadingState } from "../common/CbtMinimalLoadingState";
import { CbtMinimalStepHeaderSection } from "../common/CbtMinimalStepHeaderSection";
import styles from "../MinimalStyles.module.css";
import { CbtMinimalCognitiveErrorCard } from "./components/CbtMinimalCognitiveErrorCard";
import { CbtMinimalCognitiveErrorErrorState } from "./components/CbtMinimalCognitiveErrorErrorState";
import AiFallbackNotice from "@/components/common/AiFallbackNotice";
import CbtCarousel from "@/components/cbt/common/CbtCarousel";
import { useEmblaPagination } from "@/lib/hooks/useEmblaPagination";
import { COGNITIVE_ERRORS_BY_INDEX } from "@/lib/ai";
import CbtCarouselDots from "@/components/cbt/common/CbtCarouselDots";

interface CbtMinimalCognitiveErrorSectionProps {
  userInput: string;
  thought: string;
  onSelect: (errors: SelectedCognitiveError[]) => void;
}

const HEADER_TEXT = "혹시 이런 경향이\u00a0있지 않을까요?";

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
      <CbtMinimalLoadingState
        title={HEADER_TEXT}
        message="생각을 살펴보고 있어요."
        variant="page"
      />
    );
  }

  if (error) {
    return <CbtMinimalCognitiveErrorErrorState error={error} onRetry={reload} />;
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.headerInset}>
          <CbtMinimalStepHeaderSection title={HEADER_TEXT} />
        </div>
        {isFallback && (
          <AiFallbackNotice onRetry={() => void reload()} />
        )}

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
