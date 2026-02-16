import { CbtLoadingState } from "@/components/session/common/CbtLoadingState";
import { CbtStepHeaderSection } from "@/components/session/common/CbtStepHeaderSection";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { useCbtDeepDistortionCards } from "@/components/session/deep/hooks/useCbtDeepDistortionCards";
import { CbtDistortionCard } from "@/components/session/minimal/distortion/CbtDistortionCard";
import styles from "@/components/session/minimal/MinimalStyles.module.css";
import type { DistortionCard } from "@/components/session/types/distortion";
import { validateUserText } from "@/components/session/utils/validation";
import SafeButton from "@/components/ui/SafeButton";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { SelectedCognitiveError } from "@/lib/types/sessionTypes";
import { useMemo, useState } from "react";

type CbtDeepDistortionSectionProps = {
  userInput: string;
  emotion: string;
  internalContext: DeepInternalContext | null;
  onSelect: (thought: string, error: SelectedCognitiveError) => void;
};

const TITLE = "어쩌면 지긋지긋한 생각일지 모릅니다.";
const HEADER_TITLE = (
  <>
    어쩌면 지긋지긋한{" "}
    <br className={styles.mobileOnlyBreak} />
    생각일지 모릅니다.
  </>
);
const DESCRIPTION =
  "어떤 생각은 반복적으로 우리를 어디론가 데려갑니다. 우리 의사와 상관 없이요.";

export function CbtDeepDistortionSection({
  userInput,
  emotion,
  internalContext,
  onSelect,
}: CbtDeepDistortionSectionProps) {
  const { pushToast } = useCbtToast();
  const { cards, canLoadMore, addCard, regenerateCard, toSelectedError } =
    useCbtDeepDistortionCards({ userInput, emotion, internalContext });
  const [openHintCardId, setOpenHintCardId] = useState<string | null>(null);
  const [hintDraft, setHintDraft] = useState("");

  const hasCards = cards.length > 0;

  const cardById = useMemo(() => {
    const map = new Map<string, DistortionCard>();
    cards.forEach((card) => map.set(card.cardId, card));
    return map;
  }, [cards]);

  const submitHint = async (cardId: string) => {
    const hint = hintDraft.trim();
    const validation = validateUserText(hint, {
      minLength: 1,
      minLengthMessage: "힌트를 1자 이상 입력해주세요.",
    });
    if (!validation.ok) {
      pushToast(validation.message, "error");
      return;
    }
    setOpenHintCardId(null);
    setHintDraft("");
    await regenerateCard(cardId, hint);
  };

  const handleSelect = (card: DistortionCard) => {
    if (!card.innerBelief.trim()) {
      pushToast("배후의 믿음이 아직 준비되지 않았습니다.", "error");
      return;
    }
    if (!card.analysis.trim()) {
      pushToast("왜곡 분석이 아직 준비되지 않았습니다.", "error");
      return;
    }
    onSelect(card.innerBelief.trim(), toSelectedError(card));
  };

  if (!internalContext) {
    return (
      <CbtLoadingState
        title={TITLE}
        description={DESCRIPTION}
        message="심화 맥락을 준비하고 있어요."
        variant="page"
      />
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.headerInset}>
          <CbtStepHeaderSection title={HEADER_TITLE} description={DESCRIPTION} />
        </div>

        {!hasCards ? (
          <CbtLoadingState message="첫 distortion 카드를 준비하고 있어요." />
        ) : (
          <div className={styles.cardList}>
            {cards.map((card) => {
              const hintOpen = openHintCardId === card.cardId;
              const currentCard = cardById.get(card.cardId) ?? card;
              return (
                <CbtDistortionCard
                  key={card.cardId}
                  card={currentCard}
                  hintOpen={hintOpen}
                  hintText={hintOpen ? hintDraft : ""}
                  onOpenHint={() => {
                    if (hintOpen) {
                      setOpenHintCardId(null);
                      setHintDraft("");
                      return;
                    }
                    setOpenHintCardId(card.cardId);
                    setHintDraft("");
                  }}
                  onChangeHint={setHintDraft}
                  onCancelHint={() => {
                    setOpenHintCardId(null);
                    setHintDraft("");
                  }}
                  onSubmitHint={() => void submitHint(card.cardId)}
                  onSelect={() => handleSelect(currentCard)}
                />
              );
            })}
          </div>
        )}

        {canLoadMore && (
          <div className={styles.listFooter}>
            <SafeButton
              type="button"
              variant="unstyled"
              className={styles.secondaryButton}
              onClick={addCard}
            >
              더보기
            </SafeButton>
          </div>
        )}
      </div>
    </div>
  );
}
