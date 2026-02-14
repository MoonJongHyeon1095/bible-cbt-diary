import { CbtLoadingState } from "@/components/session/common/CbtLoadingState";
import { CbtStepHeaderSection } from "@/components/session/common/CbtStepHeaderSection";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { useCbtCognitiveErrorRanking } from "@/components/session/hooks/useCbtCognitiveErrorRanking";
import AiFallbackNotice from "@/components/common/AiFallbackNotice";
import CharacterPrompt from "@/components/ui/CharacterPrompt";
import SafeButton from "@/components/ui/SafeButton";
import { COGNITIVE_ERRORS_BY_INDEX } from "@/lib/ai";
import type { SelectedCognitiveError } from "@/lib/types/sessionTypes";
import { useEffect, useMemo, useState } from "react";
import { CbtMinimalFloatingNextButton } from "../common/CbtMinimalFloatingNextButton";
import styles from "../MinimalStyles.module.css";
import { CbtMinimalCognitiveErrorCard } from "./CbtMinimalCognitiveErrorCard";
import { CbtMinimalCognitiveErrorErrorState } from "./CbtMinimalCognitiveErrorErrorState";

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
    visibleRanked,
    detailByIndex,
    loading,
    error,
    rankLoading,
    isFallback,
    reload,
    canLoadMore,
    loadMore,
  } = useCbtCognitiveErrorRanking({ userInput, thought });
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
