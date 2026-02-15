import { CbtLoadingState } from "@/components/session/common/CbtLoadingState";
import { CbtStepHeaderSection } from "@/components/session/common/CbtStepHeaderSection";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { useCbtDistortionCards } from "@/components/session/hooks/useCbtDistortionCards";
import type { DistortionCard } from "@/components/session/types/distortion";
import SafeButton from "@/components/ui/SafeButton";
import type { SelectedCognitiveError } from "@/lib/types/sessionTypes";
import { useMemo, useState } from "react";
import styles from "../MinimalStyles.module.css";
import { CbtDistortionCard } from "./CbtDistortionCard";

type CbtMinimalDistortionSectionProps = {
  userInput: string;
  emotion: string;
  onSelect: (thought: string, error: SelectedCognitiveError) => void;
};

const TITLE = (
  <>
    혹시 이런 생각이 <br className={styles.mobileOnlyBreak} />
    숨어있지 않았을까요?
  </>
);
const DESCRIPTION = (
  <>
    생각은 가끔 우리를 어디론가 데려가버립니다.
    <br />
    우리 뜻과 상관없이 떠오르는 생각들이 있죠.
  </>
);

export function CbtMinimalDistortionSection({
  userInput,
  emotion,
  onSelect,
}: CbtMinimalDistortionSectionProps) {
  const { pushToast } = useCbtToast();
  const { cards, canLoadMore, addCard, regenerateCard, toSelectedError } =
    useCbtDistortionCards({ userInput, emotion });
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
    if (!hint) {
      pushToast("힌트를 1자 이상 입력해주세요.", "error");
      return;
    }
    await regenerateCard(cardId, hint);
    setOpenHintCardId(null);
    setHintDraft("");
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

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.headerInset}>
          <CbtStepHeaderSection title={TITLE} description={DESCRIPTION} />
        </div>

        <div data-tour="minimal-distortion-list">
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
        </div>

        {canLoadMore && (
          <div className={styles.listFooter}>
            <SafeButton
              type="button"
              variant="unstyled"
              className={styles.secondaryButton}
              onClick={addCard}
              data-tour="minimal-distortion-more"
            >
              더보기
            </SafeButton>
          </div>
        )}
      </div>
    </div>
  );
}
