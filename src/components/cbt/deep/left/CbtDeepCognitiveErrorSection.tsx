import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { CbtMinimalFloatingNextButton } from "@/components/cbt/minimal/common/CbtMinimalFloatingNextButton";
import { CbtMinimalLoadingState } from "@/components/cbt/minimal/common/CbtMinimalLoadingState";
import { CbtMinimalStepHeaderSection } from "@/components/cbt/minimal/common/CbtMinimalStepHeaderSection";
import { CbtMinimalCognitiveErrorCard } from "@/components/cbt/minimal/left/components/CbtMinimalCognitiveErrorCard";
import { CbtMinimalCognitiveErrorErrorState } from "@/components/cbt/minimal/left/components/CbtMinimalCognitiveErrorErrorState";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import AiFallbackNotice from "@/components/common/AiFallbackNotice";
import { COGNITIVE_ERRORS_BY_INDEX } from "@/lib/ai";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { SelectedCognitiveError } from "@/lib/types/cbtTypes";
import { useCbtDeepCognitiveErrorRanking } from "../hooks/useCbtDeepCognitiveErrorRanking";
import CbtCarousel from "@/components/cbt/common/CbtCarousel";
import { useEmblaPagination } from "@/lib/hooks/useEmblaPagination";
import CbtCarouselDots from "@/components/cbt/common/CbtCarouselDots";

interface CbtDeepCognitiveErrorSectionProps {
  userInput: string;
  thought: string;
  internalContext: DeepInternalContext | null;
  onSelect: (errors: SelectedCognitiveError[]) => void;
}

const HEADER_TEXT = "이제는 익숙한 오류일지도 모르겠군요.";

export function CbtDeepCognitiveErrorSection({
  userInput,
  thought,
  internalContext,
  onSelect,
}: CbtDeepCognitiveErrorSectionProps) {
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
  } = useCbtDeepCognitiveErrorRanking({
    userInput,
    thought,
    internalContext,
  });
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
