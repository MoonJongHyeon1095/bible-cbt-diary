import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { validateUserText } from "@/components/cbt/utils/validation";
import { CbtMinimalAutoThoughtHintSection } from "@/components/cbt/minimal/center/components/CbtMinimalAutoThoughtHintSection";
import { CbtMinimalAutoThoughtInputForm } from "@/components/cbt/minimal/center/components/CbtMinimalAutoThoughtInputForm";
import { CbtMinimalAutoThoughtTextSection } from "@/components/cbt/minimal/center/components/CbtMinimalAutoThoughtTextSection";
import { CbtMinimalFloatingNextButton } from "@/components/cbt/minimal/common/CbtMinimalFloatingNextButton";
import { CbtMinimalLoadingState } from "@/components/cbt/minimal/common/CbtMinimalLoadingState";
import { CbtMinimalStepHeaderSection } from "@/components/cbt/minimal/common/CbtMinimalStepHeaderSection";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import Button from "@/components/ui/Button";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const { items, loading, error, reload } = useCbtDeepAutoThought({
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
    setWantsCustom(false);
    setCustomThought("");
  }, [items]);

  const currentThought = items[currentIndex] ?? null;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < items.length - 1;
  const showCustomButton = currentIndex >= 2;

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
            <Button
              type="button"
              variant="unstyled"
              onClick={() => void reload()}
              className={styles.exampleButton}
            >
              다시 불러오기
            </Button>
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

        {wantsCustom ? (
          <div className={styles.inlineCard}>
            <CbtMinimalAutoThoughtInputForm
              value={customThought}
              onChange={setCustomThought}
            />
          </div>
        ) : (
          <div className={styles.inlineCard}>
            <CbtMinimalAutoThoughtTextSection
              belief={currentThought?.belief ?? ""}
              emotionReason={currentThought?.emotionReason ?? ""}
              fallback="생각을 불러오는 중입니다."
            />
          </div>
        )}

        <div className={styles.formStack}>
          <CbtMinimalFloatingNextButton onClick={handleSelect} />
          {wantsCustom ? (
            <CbtMinimalAutoThoughtHintSection />
          ) : (
            <div className={styles.controlRow}>
              <Button
                type="button"
                variant="unstyled"
                onClick={() => canGoPrev && setCurrentIndex((prev) => prev - 1)}
                aria-label="이전 생각 보기"
                disabled={!canGoPrev}
                className={styles.smallIconButton}
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </Button>
              <Button
                type="button"
                variant="unstyled"
                onClick={() => canGoNext && setCurrentIndex((prev) => prev + 1)}
                aria-label="다음 생각 보기"
                disabled={!canGoNext}
                className={styles.smallIconButton}
              >
                <ChevronRight size={18} strokeWidth={2.5} />
              </Button>
              {showCustomButton && (
                <Button
                  type="button"
                  variant="unstyled"
                  onClick={() => setWantsCustom(true)}
                  className={styles.secondaryButton}
                >
                  또는 직접 생각을 작성해보세요
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
