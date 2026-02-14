import { CbtLoadingState } from "@/components/session/common/CbtLoadingState";
import { CbtStepHeaderSection } from "@/components/session/common/CbtStepHeaderSection";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { CbtMinimalFloatingNextButton } from "@/components/session/minimal/common/CbtMinimalFloatingNextButton";
import { CbtMinimalCognitiveErrorCard } from "@/components/session/minimal/cognitive-error/CbtMinimalCognitiveErrorCard";
import { CbtMinimalCognitiveErrorErrorState } from "@/components/session/minimal/cognitive-error/CbtMinimalCognitiveErrorErrorState";
import styles from "@/components/session/minimal/MinimalStyles.module.css";
import AiFallbackNotice from "@/components/common/AiFallbackNotice";
import CharacterPrompt from "@/components/ui/CharacterPrompt";
import SafeButton from "@/components/ui/SafeButton";
import { COGNITIVE_ERRORS_BY_INDEX } from "@/lib/ai";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { SelectedCognitiveError } from "@/lib/types/sessionTypes";
import { useEffect, useMemo, useState } from "react";
import { useCbtDeepCognitiveErrorRanking } from "../hooks/useCbtDeepCognitiveErrorRanking";

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
    visibleRanked,
    detailByIndex,
    loading,
    error,
    rankLoading,
    isFallback,
    reload,
    canLoadMore,
    loadMore,
  } = useCbtDeepCognitiveErrorRanking({
    userInput,
    thought,
    internalContext,
  });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    setSelectedIndex(null);
  }, [ranked]);

  const selectedRankItem = useMemo(
    () => (selectedIndex === null ? null : ranked[selectedIndex] ?? null),
    [ranked, selectedIndex],
  );
  const selectedMeta = selectedRankItem
    ? COGNITIVE_ERRORS_BY_INDEX[selectedRankItem.index]
    : null;
  const selectedDetail = selectedRankItem
    ? detailByIndex[selectedRankItem.index]
    : null;

  const handleSelect = () => {
    if (!selectedRankItem) {
      pushToast("카드를 선택해주세요.", "error");
      return;
    }
    if (!selectedMeta) return;
    if (!selectedDetail) {
      pushToast("자세한 내용을 불러오는 중입니다.", "error");
      return;
    }
    const payload: SelectedCognitiveError = {
      id: selectedMeta.id,
      index: selectedMeta.index,
      title: selectedMeta.title,
      detail: selectedDetail.analysis,
    };
    onSelect([payload]);
  };

  if (loading) {
    return (
      <CbtLoadingState
        prompt={<CharacterPrompt name="EDi" greeting="" />}
        title={HEADER_TEXT}
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
          <CbtStepHeaderSection title={HEADER_TEXT} />
        </div>
        {isFallback && <AiFallbackNotice onRetry={() => void reload()} />}

        {visibleRanked.length > 0 && (
          <div className={styles.cardList}>
            {visibleRanked.map((item, index) => {
              const meta = COGNITIVE_ERRORS_BY_INDEX[item.index];
              const detail = detailByIndex[item.index];
              const isSelected = selectedIndex === index;
              return (
                <SafeButton
                  key={`${item.index}-${index}`}
                  type="button"
                  variant="unstyled"
                  onClick={() => setSelectedIndex(index)}
                  aria-pressed={isSelected}
                  className={`${styles.selectableCard} ${
                    isSelected ? styles.selectableCardSelected : ""
                  }`}
                >
                  <CbtMinimalCognitiveErrorCard
                    title={meta?.title ?? "인지오류"}
                    infoDescription={meta?.description}
                    evidenceQuote={item.evidenceQuote}
                    reason={item.reason}
                    detail={detail?.analysis}
                  />
                </SafeButton>
              );
            })}
            {canLoadMore && (
              <div className={styles.listFooter}>
                <SafeButton
                  type="button"
                  variant="unstyled"
                  onClick={loadMore}
                  disabled={rankLoading}
                  className={styles.secondaryButton}
                >
                  더보기
                </SafeButton>
              </div>
            )}
          </div>
        )}

        <div className={styles.formStack}>
          <CbtMinimalFloatingNextButton
            onClick={handleSelect}
            ariaLabel="이 오류로 진행"
            disabled={selectedRankItem === null}
          />
        </div>
      </div>
    </div>
  );
}
