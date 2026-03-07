import { CbtLoadingState } from "@/components/session/common/CbtLoadingState";
import type { SdtCard } from "@/components/session/types/sdt";
import SafeButton from "@/components/ui/SafeButton";
import Textarea from "@/components/ui/Textarea";
import { ArrowRight, Sparkles } from "lucide-react";
import styles from "../MinimalStyles.module.css";

type CbtPositiveSdtCardProps = {
  card: SdtCard;
  hintOpen: boolean;
  hintText: string;
  onOpenHint: () => void;
  onChangeHint: (value: string) => void;
  onCancelHint: () => void;
  onSubmitHint: () => void;
  onSelect: () => void;
};

export function CbtPositiveSdtCard({
  card,
  hintOpen,
  hintText,
  onOpenHint,
  onChangeHint,
  onCancelHint,
  onSubmitHint,
  onSelect,
}: CbtPositiveSdtCardProps) {
  const canSelect =
    Boolean(card.innerBelief.trim()) &&
    Boolean(card.empathyText.trim()) &&
    Boolean(card.behaviorLabel.trim()) &&
    Boolean(card.behaviorDescription.trim()) &&
    Boolean(card.reflectionQuestion.trim()) &&
    !card.isGenerating;

  return (
    <div className={styles.inlineCard}>
      <div>
        <p className={styles.detailTitle}>{card.sdtLabel}</p>
        <p className={styles.detailSubtext}>{card.sdtSummary}</p>
        <p className={styles.helperText}>{card.sdtDescription}</p>
      </div>

      {card.isGenerating ? (
        <CbtLoadingState message="지금의 감정을 오래 붙잡을 실마리를 찾고 있어요." />
      ) : (
        <>
          <div className={styles.sectionBlock}>
            <span className={styles.sectionLabel}>INNER BELIEF</span>
            <p className={styles.textBlock}>{card.innerBelief || "-"}</p>
          </div>

          <div className={styles.sectionBlock}>
            <span className={styles.sectionLabel}>EMPATHY</span>
            <p className={styles.textBlock}>{card.empathyText || "-"}</p>
          </div>

          <div className={styles.sectionBlock}>
            <span className={styles.sectionLabel}>BEHAVIOR</span>
            {card.behaviorLabel ? (
              <span className={styles.tag}>{card.behaviorLabel}</span>
            ) : null}
            <p className={styles.textBlock}>{card.behaviorDescription || "-"}</p>
          </div>

          <div className={styles.sectionBlock}>
            <span className={styles.sectionLabel}>REFLECTION</span>
            <p className={styles.textBlock}>{card.reflectionQuestion || "-"}</p>
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
          aria-label="생성 가이드 입력"
          aria-expanded={hintOpen}
        >
          <Sparkles className={styles.distortionHintIcon} />
          <span className={styles.distortionHintLabel}>User Hint</span>
        </SafeButton>
        <SafeButton
          type="button"
          variant="unstyled"
          className={styles.distortionProceedButton}
          onClick={onSelect}
          disabled={!canSelect}
          aria-label="이 SDT로 진행"
        >
          <ArrowRight className={styles.distortionProceedIcon} />
        </SafeButton>
      </div>

      {hintOpen && (
        <>
          <div className={styles.hintPanelHeader}>
            <p className={styles.hintPanelMeta}>{hintText.trim().length}/160</p>
          </div>
          <Textarea
            value={hintText}
            onChange={(event) => onChangeHint(event.target.value)}
            rows={3}
            maxLength={160}
            placeholder="이 감정에서 더 붙잡고 싶은 포인트를 짧게 알려주세요."
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
        </>
      )}
    </div>
  );
}
