import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { CbtMinimalAutoThoughtHintSection } from "@/components/cbt/minimal/center/components/CbtMinimalAutoThoughtHintSection";
import { CbtMinimalAutoThoughtInputForm } from "@/components/cbt/minimal/center/components/CbtMinimalAutoThoughtInputForm";
import { CbtMinimalAutoThoughtTextSection } from "@/components/cbt/minimal/center/components/CbtMinimalAutoThoughtTextSection";
import { CbtInlineNextButton } from "@/components/cbt/minimal/common/CbtInlineNextButton";
import { CbtMinimalFloatingCustomThoughtButton } from "@/components/cbt/minimal/common/CbtMinimalFloatingCustomThoughtButton";
import { CbtMinimalFloatingNextButton } from "@/components/cbt/minimal/common/CbtMinimalFloatingNextButton";
import { CbtLoadingState } from "@/components/cbt/common/CbtLoadingState";
import { CbtStepHeaderSection } from "@/components/cbt/common/CbtStepHeaderSection";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import { validateUserText } from "@/components/cbt/utils/validation";
import AiFallbackNotice from "@/components/common/AiFallbackNotice";
import CharacterPrompt from "@/components/ui/CharacterPrompt";
import SafeButton from "@/components/ui/SafeButton";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { useEffect, useMemo, useState } from "react";
import { useCbtDeepAutoThought } from "../hooks/useCbtDeepAutoThought";

interface CbtDeepAutoThoughtSectionProps {
  userInput: string;
  emotion: string;
  mainNote: EmotionNote;
  subNotes: EmotionNote[];
  internalContext: DeepInternalContext | null;
  wantsCustom: boolean;
  onWantsCustomChange: (next: boolean) => void;
  onComplete: (autoThought: string) => void;
}

const TITLE = "어쩌면 지긋지긋한 생각들일지도 모릅니다.";

export function CbtDeepAutoThoughtSection({
  userInput,
  emotion,
  mainNote,
  subNotes,
  internalContext,
  wantsCustom,
  onWantsCustomChange,
  onComplete,
}: CbtDeepAutoThoughtSectionProps) {
  const { pushToast } = useCbtToast();
  const { items, loading, error, reload, isFallback } = useCbtDeepAutoThought({
    userInput,
    emotion,
    mainNote,
    subNotes,
    internalContext,
  });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [customThought, setCustomThought] = useState("");

  useEffect(() => {
    setCustomThought("");
    setSelectedIndex(null);
  }, [items]);
  const selectedThought = useMemo(
    () => (selectedIndex === null ? null : items[selectedIndex] ?? null),
    [items, selectedIndex],
  );

  useEffect(() => {
    if (!wantsCustom) {
      setSelectedIndex(null);
      setCustomThought("");
    }
  }, [wantsCustom]);

  const handleSelect = () => {
    if (wantsCustom) {
      const validation = validateUserText(customThought, {
        minLength: 10,
        minLengthMessage: "직접 입력한 생각을 10자 이상 적어주세요.",
      });
      if (!validation.ok) {
        pushToast(validation.message, "error");
        return;
      }
      onComplete(customThought.trim());
      return;
    }
    if (!selectedThought?.belief?.trim()) {
      pushToast("생각을 선택해주세요.", "error");
      return;
    }
    onComplete(selectedThought.belief.trim());
  };

  if (loading) {
    return (
      <CbtLoadingState
        prompt={<CharacterPrompt name="EDi" greeting="" />}
        title={TITLE}
        message="생각을 정리하고 있어요."
        variant="page"
      />
    );
  }

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.headerInset}>
            <div className={styles.headerPrompt}>
              <CharacterPrompt name="EDi" greeting="" />
            </div>
            <CbtStepHeaderSection title={TITLE} />
          </div>
          <div className={styles.inlineCard}>
            <p className={styles.textBlock}>{error}</p>
            <SafeButton
              type="button"
              variant="unstyled"
              onClick={() => void reload()}
              className={styles.exampleButton}
            >
              다시 불러오기
            </SafeButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.headerInset}>
          <div className={styles.headerPrompt}>
            <CharacterPrompt name="EDi" greeting="" />
          </div>
          <CbtStepHeaderSection title={TITLE} />
        </div>
        {isFallback && <AiFallbackNotice onRetry={() => void reload()} />}

        {wantsCustom ? (
          <div className={styles.inlineCard}>
            <CbtMinimalAutoThoughtInputForm
              value={customThought}
              onChange={setCustomThought}
              action={
                <CbtInlineNextButton
                  onClick={handleSelect}
                  ariaLabel="다음으로"
                />
              }
            />
          </div>
        ) : (
          <div className={styles.cardList}>
            {items.map((item, index) => {
              const isSelected = selectedIndex === index;
              return (
                <SafeButton
                  key={`${item.belief}-${index}`}
                  type="button"
                  variant="unstyled"
                  onClick={() => setSelectedIndex(index)}
                  aria-pressed={isSelected}
                  className={`${styles.selectableCard} ${
                    isSelected ? styles.selectableCardSelected : ""
                  }`}
                >
                  <div className={styles.inlineCard}>
                  <CbtMinimalAutoThoughtTextSection
                    belief={item.belief ?? ""}
                    emotionReason={item.emotionReason ?? ""}
                    fallback="생각을 불러오는 중입니다."
                  />
                  </div>
                </SafeButton>
              );
            })}
          </div>
        )}

        <div className={styles.formStack}>
          {!wantsCustom && (
            <CbtMinimalFloatingNextButton
              onClick={handleSelect}
              disabled={!selectedThought}
            />
          )}
          {wantsCustom && <CbtMinimalAutoThoughtHintSection />}
        </div>

        {!wantsCustom && (
          <CbtMinimalFloatingCustomThoughtButton
            onClick={() => {
              onWantsCustomChange(true);
              setCustomThought("");
              setSelectedIndex(null);
            }}
            disabled={loading}
          />
        )}
      </div>
    </div>
  );
}
