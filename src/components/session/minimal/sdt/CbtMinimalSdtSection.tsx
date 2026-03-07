import { CbtLoadingState } from "@/components/session/common/CbtLoadingState";
import { CbtSessionDisclaimerBanner } from "@/components/session/common/CbtSessionDisclaimerBanner";
import { CbtStepHeaderSection } from "@/components/session/common/CbtStepHeaderSection";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { useCbtPositiveSdtCards } from "@/components/session/hooks/useCbtPositiveSdtCards";
import { validateUserText } from "@/components/session/utils/validation";
import SafeButton from "@/components/ui/SafeButton";
import type { PositiveSdtSelection } from "@/lib/types/sessionTypes";
import { useMemo, useState } from "react";
import styles from "../MinimalStyles.module.css";
import { CbtPositiveSdtCard } from "./CbtPositiveSdtCard";

type CbtMinimalSdtSectionProps = {
  userInput: string;
  emotion: string;
  onSelect: (selection: PositiveSdtSelection) => void;
};

const TITLE = (
  <>
    이 감정은 <br className={styles.mobileOnlyBreak} />
    어디에서 비롯되었을까요?
  </>
);

const DESCRIPTION = <>같은 기쁨도 그 뿌리는 조금씩 다를 수 있어요.</>;

export function CbtMinimalSdtSection({
  userInput,
  emotion,
  onSelect,
}: CbtMinimalSdtSectionProps) {
  const { pushToast } = useCbtToast();
  const { cards, canLoadMore, addCard, regenerateCard } =
    useCbtPositiveSdtCards({ userInput, emotion });
  const [openHintCardId, setOpenHintCardId] = useState<string | null>(null);
  const [hintDraft, setHintDraft] = useState("");

  const hasCards = cards.length > 0;
  const cardById = useMemo(() => {
    const map = new Map<string, (typeof cards)[number]>();
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

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.headerInset}>
          <div className={styles.disclaimerBannerWrap}>
            <CbtSessionDisclaimerBanner />
          </div>
          <CbtStepHeaderSection title={TITLE} description={DESCRIPTION} />
        </div>

        <div data-tour="minimal-distortion-list">
          {!hasCards ? (
            <CbtLoadingState message="첫 SDT 카드를 준비하고 있어요." />
          ) : (
            <div className={styles.cardList}>
              {cards.map((card) => {
                const hintOpen = openHintCardId === card.cardId;
                const currentCard = cardById.get(card.cardId) ?? card;
                return (
                  <CbtPositiveSdtCard
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
                    onSelect={() =>
                      onSelect({
                        sdtType: currentCard.sdtType,
                        innerBelief: currentCard.innerBelief.trim(),
                        empathyText: currentCard.empathyText.trim(),
                        behaviorLabel: currentCard.behaviorLabel.trim(),
                        behaviorDescription:
                          currentCard.behaviorDescription.trim(),
                        behaviorChecklist: currentCard.behaviorChecklist,
                        reflectionQuestion:
                          currentCard.reflectionQuestion.trim(),
                      })
                    }
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
