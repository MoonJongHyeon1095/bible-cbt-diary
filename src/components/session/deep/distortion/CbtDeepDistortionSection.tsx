import { CbtLoadingState } from "@/components/session/common/CbtLoadingState";
import { CbtStepHeaderSection } from "@/components/session/common/CbtStepHeaderSection";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { useCbtDeepDistortionCards } from "@/components/session/deep/hooks/useCbtDeepDistortionCards";
import type { DistortionCard } from "@/components/session/types/distortion";
import { CbtDistortionCard } from "@/components/session/minimal/distortion/CbtDistortionCard";
import CharacterPrompt from "@/components/ui/CharacterPrompt";
import SafeButton from "@/components/ui/SafeButton";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { SelectedCognitiveError } from "@/lib/types/sessionTypes";
import { useMemo, useState } from "react";
import styles from "@/components/session/minimal/MinimalStyles.module.css";

type CbtDeepDistortionSectionProps = {
  userInput: string;
  emotion: string;
  internalContext: DeepInternalContext | null;
  onSelect: (thought: string, error: SelectedCognitiveError) => void;
};

const TITLE = "왜곡된 해석의 축을 드러내 보겠습니다.";
const DESCRIPTION = "내면의 규칙을 먼저 보여주고, 같은 카드 안에서 왜곡 분석을 이어갑니다.";

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

  if (!internalContext) {
    return (
      <CbtLoadingState
        prompt={<CharacterPrompt name="EDi" greeting="" />}
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
          <div className={styles.headerPrompt}>
            <CharacterPrompt name="EDi" greeting="" />
          </div>
          <CbtStepHeaderSection title={TITLE} description={DESCRIPTION} />
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
