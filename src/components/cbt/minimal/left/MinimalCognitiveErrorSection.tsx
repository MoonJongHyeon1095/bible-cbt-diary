import { RefreshCw } from "lucide-react";
import type { SelectedCognitiveError } from "@/lib/cbtTypes";
import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { MinimalFloatingNextButton } from "../common/MinimalFloatingNextButton";
import { MinimalLoadingState } from "../common/MinimalLoadingState";
import { MinimalStepHeaderSection } from "../common/MinimalStepHeaderSection";
import { useCognitiveErrorRanking } from "@/components/cbt/hooks/useCognitiveErrorRanking";
import { MinimalCognitiveErrorCard } from "./components/MinimalCognitiveErrorCard";
import { MinimalCognitiveErrorErrorState } from "./components/MinimalCognitiveErrorErrorState";
import styles from "../MinimalStyles.module.css";

interface MinimalCognitiveErrorSectionProps {
  userInput: string;
  thought: string;
  onSelect: (errors: SelectedCognitiveError[]) => void;
}

const HEADER_TEXT = "혹시 이런 경향이 있지 않을까요?";

export function MinimalCognitiveErrorSection({
  userInput,
  thought,
  onSelect,
}: MinimalCognitiveErrorSectionProps) {
  const { pushToast } = useCbtToast();
  const {
    currentRankItem,
    currentDetail,
    currentMeta,
    loading,
    error,
    rankLoading,
    handleNext,
    reload,
  } = useCognitiveErrorRanking({ userInput, thought });

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
      <MinimalLoadingState
        title={HEADER_TEXT}
        message="인지오류를 분석하고 있어요."
        variant="page"
      />
    );
  }

  if (error) {
    return <MinimalCognitiveErrorErrorState error={error} onRetry={reload} />;
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <MinimalStepHeaderSection title={HEADER_TEXT} />

        {currentRankItem && (
          <MinimalCognitiveErrorCard
            title={currentMeta?.title ?? "인지오류"}
            infoDescription={currentMeta?.description}
            evidenceQuote={currentRankItem.evidenceQuote}
            reason={currentRankItem.reason}
            detail={currentDetail?.analysis}
          />
        )}

        <div className={styles.formStack}>
          <MinimalFloatingNextButton
            onClick={handleSelect}
            ariaLabel="이 오류로 진행"
          />
          <button
            type="button"
            onClick={handleNext}
            aria-label="다른 오류 보기"
            disabled={rankLoading}
            className={styles.smallIconButton}
          >
            <RefreshCw size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
