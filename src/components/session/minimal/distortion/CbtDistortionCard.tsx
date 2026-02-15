import { CbtLoadingState } from "@/components/session/common/CbtLoadingState";
import type { DistortionCard } from "@/components/session/types/distortion";
import SafeButton from "@/components/ui/SafeButton";
import Textarea from "@/components/ui/Textarea";
import { ArrowRight } from "lucide-react";
import styles from "../MinimalStyles.module.css";

type CbtDistortionCardProps = {
  card: DistortionCard;
  hintOpen: boolean;
  hintText: string;
  onOpenHint: () => void;
  onChangeHint: (value: string) => void;
  onCancelHint: () => void;
  onSubmitHint: () => void;
  onSelect: () => void;
};

export function CbtDistortionCard({
  card,
  hintOpen,
  hintText,
  onOpenHint,
  onChangeHint,
  onCancelHint,
  onSubmitHint,
  onSelect,
}: CbtDistortionCardProps) {
  const canSelect =
    Boolean(card.innerBelief.trim()) &&
    Boolean(card.analysis.trim()) &&
    !card.isGenerating;

  return (
    <div className={styles.inlineCard}>
      <div>
        <p className={styles.detailTitle}>{card.errorTitle}</p>
        <p className={styles.detailSubtext}>{card.errorDescription}</p>
      </div>

      {card.isGenerating ? (
        <CbtLoadingState message="당신의 마음을 살펴보고 있어요.." />
      ) : (
        <>
          <div className={styles.sectionBlock}>
            <span className={styles.sectionLabel}>INNER BELIEF</span>
            <p className={styles.textBlock}>{card.innerBelief || "-"}</p>
          </div>

          <div className={styles.sectionBlock}>
            <span className={styles.sectionLabel}>ANALYSIS</span>
            <p className={styles.textBlock}>{card.analysis || "-"}</p>
          </div>

          <div className={styles.sectionBlock}>
            <span className={styles.sectionLabel}>EMOTION REASON</span>
            <p className={styles.textBlock}>{card.emotionReason || "-"}</p>
          </div>
        </>
      )}

      {card.errorMessage && (
        <p className={styles.helperText}>{card.errorMessage}</p>
      )}

      <div className={styles.cardActionRow}>
        <SafeButton
          type="button"
          variant="unstyled"
          className={styles.distortionHintButton}
          onClick={onOpenHint}
          disabled={card.isGenerating}
        >
          힌트로 재생성
        </SafeButton>
        <SafeButton
          type="button"
          variant="unstyled"
          className={styles.distortionProceedButton}
          onClick={onSelect}
          disabled={!canSelect}
        >
          <span>이 distortion으로 진행</span>
          <ArrowRight className={styles.distortionProceedIcon} />
        </SafeButton>
      </div>

      {hintOpen && (
        <div className={styles.hintInlinePanel}>
          <Textarea
            value={hintText}
            onChange={(event) => onChangeHint(event.target.value)}
            rows={3}
            placeholder="원하는 방향이나 강조하고 싶은 문장을 적어주세요."
            className={styles.hintTextarea}
          />
          <div className={styles.hintActionRow}>
            <SafeButton
              type="button"
              variant="unstyled"
              className={styles.hintCancelButton}
              onClick={onCancelHint}
            >
              취소
            </SafeButton>
            <SafeButton
              type="button"
              variant="unstyled"
              className={styles.hintApplyButton}
              onClick={onSubmitHint}
            >
              재생성
            </SafeButton>
          </div>
        </div>
      )}
    </div>
  );
}
