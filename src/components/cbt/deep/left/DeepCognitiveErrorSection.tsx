import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { MinimalFloatingNextButton } from "@/components/cbt/minimal/common/MinimalFloatingNextButton";
import { MinimalLoadingState } from "@/components/cbt/minimal/common/MinimalLoadingState";
import { MinimalStepHeaderSection } from "@/components/cbt/minimal/common/MinimalStepHeaderSection";
import { MinimalCognitiveErrorCard } from "@/components/cbt/minimal/left/components/MinimalCognitiveErrorCard";
import { MinimalCognitiveErrorErrorState } from "@/components/cbt/minimal/left/components/MinimalCognitiveErrorErrorState";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import Button from "@/components/ui/Button";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { SelectedCognitiveError } from "@/lib/types/cbtTypes";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDeepCognitiveErrorRanking } from "../hooks/useDeepCognitiveErrorRanking";

interface DeepCognitiveErrorSectionProps {
  userInput: string;
  thought: string;
  internalContext: DeepInternalContext | null;
  onSelect: (errors: SelectedCognitiveError[]) => void;
}

const HEADER_TEXT = "이제는 익숙한 오류일지도 모르겠군요.";

export function DeepCognitiveErrorSection({
  userInput,
  thought,
  internalContext,
  onSelect,
}: DeepCognitiveErrorSectionProps) {
  const { pushToast } = useCbtToast();
  const {
    currentRankItem,
    currentDetail,
    currentMeta,
    loading,
    error,
    rankLoading,
    handleNext,
    handlePrev,
    canPrev,
    canNext,
    reload,
  } = useDeepCognitiveErrorRanking({
    userInput,
    thought,
    internalContext,
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
      <MinimalLoadingState
        title={HEADER_TEXT}
        message="생각을 살펴보고 있어요."
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
        <div className={styles.headerInset}>
          <MinimalStepHeaderSection title={HEADER_TEXT} />
        </div>

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
          <div className={styles.controlRow}>
            <Button
              type="button"
              variant="unstyled"
              onClick={handlePrev}
              aria-label="이전 오류 보기"
              disabled={rankLoading || !canPrev}
              className={styles.smallIconButton}
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </Button>
            <Button
              type="button"
              variant="unstyled"
              onClick={handleNext}
              aria-label="다음 오류 보기"
              disabled={rankLoading || !canNext}
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
