import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { validateUserText } from "@/components/cbt/utils/validation";
import { CbtMinimalAutoThoughtHintSection } from "@/components/cbt/minimal/center/components/CbtMinimalAutoThoughtHintSection";
import { CbtMinimalAutoThoughtInputForm } from "@/components/cbt/minimal/center/components/CbtMinimalAutoThoughtInputForm";
import { CbtMinimalAutoThoughtTextSection } from "@/components/cbt/minimal/center/components/CbtMinimalAutoThoughtTextSection";
import { CbtMinimalFloatingNextButton } from "@/components/cbt/minimal/common/CbtMinimalFloatingNextButton";
import { CbtInlineNextButton } from "@/components/cbt/minimal/common/CbtInlineNextButton";
import { CbtMinimalLoadingState } from "@/components/cbt/minimal/common/CbtMinimalLoadingState";
import { CbtMinimalStepHeaderSection } from "@/components/cbt/minimal/common/CbtMinimalStepHeaderSection";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import CbtCarouselDots from "@/components/cbt/common/CbtCarouselDots";
import SafeButton from "@/components/ui/SafeButton";
import AiFallbackNotice from "@/components/common/AiFallbackNotice";
import CbtCarousel from "@/components/cbt/common/CbtCarousel";
import { useEmblaPagination } from "@/lib/hooks/useEmblaPagination";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { useEffect, useState } from "react";
import { useCbtDeepAutoThought } from "../hooks/useCbtDeepAutoThought";

interface CbtDeepAutoThoughtSectionProps {
  userInput: string;
  emotion: string;
  mainNote: EmotionNote;
  subNotes: EmotionNote[];
  internalContext: DeepInternalContext | null;
  onComplete: (autoThought: string) => void;
}

const TITLE = "어쩌면 지긋지긋한 생각들일지도 모릅니다.";

export function CbtDeepAutoThoughtSection({
  userInput,
  emotion,
  mainNote,
  subNotes,
  internalContext,
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wantsCustom, setWantsCustom] = useState(false);
  const [customThought, setCustomThought] = useState("");

  useEffect(() => {
    setCurrentIndex(0);
    setCustomThought("");
  }, [items]);

  const currentThought = items[currentIndex] ?? null;
  const { emblaRef, controls } = useEmblaPagination({
    slidesCount: items.length,
    draggable: !loading && !wantsCustom,
    selectedIndex: currentIndex,
    onSelectIndex: setCurrentIndex,
  });

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
    if (!currentThought?.belief?.trim()) {
      pushToast("생각을 불러오는 중입니다.", "error");
      return;
    }
    onComplete(currentThought.belief.trim());
  };

  if (loading) {
    return (
      <CbtMinimalLoadingState
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
            <CbtMinimalStepHeaderSection title={TITLE} />
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
          <CbtMinimalStepHeaderSection title={TITLE} />
        </div>
        {isFallback && (
          <AiFallbackNotice onRetry={() => void reload()} />
        )}

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
          <CbtCarousel emblaRef={emblaRef}>
            {items.map((item, index) => (
              <div
                key={`${item.belief}-${index}`}
                className={styles.emblaSlide}
              >
                <div className={styles.inlineCard}>
                  <CbtMinimalAutoThoughtTextSection
                    belief={item.belief ?? ""}
                    emotionReason={item.emotionReason ?? ""}
                    fallback="생각을 불러오는 중입니다."
                  />
                </div>
              </div>
            ))}
          </CbtCarousel>
        )}

        <div className={styles.formStack}>
          {!wantsCustom && (
            <CbtMinimalFloatingNextButton onClick={handleSelect} />
          )}
          {wantsCustom ? (
            <CbtMinimalAutoThoughtHintSection />
          ) : (
            <div className={styles.carouselControlStack}>
              <CbtCarouselDots
                count={items.length}
                currentIndex={currentIndex}
                onSelect={controls.scrollTo}
              />
              <SafeButton
                type="button"
                variant="unstyled"
                onClick={() => setWantsCustom(true)}
                className={`${styles.secondaryButton} ${styles.carouselCustomPrompt}`}
              >
                또는 직접 생각을 작성해보세요
              </SafeButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
