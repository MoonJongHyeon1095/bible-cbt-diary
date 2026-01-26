import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { validateUserText } from "@/components/cbt/utils/validation";
import { MinimalAutoThoughtHintSection } from "@/components/cbt/minimal/center/components/MinimalAutoThoughtHintSection";
import { MinimalAutoThoughtInputForm } from "@/components/cbt/minimal/center/components/MinimalAutoThoughtInputForm";
import { MinimalAutoThoughtTextSection } from "@/components/cbt/minimal/center/components/MinimalAutoThoughtTextSection";
import { MinimalFloatingNextButton } from "@/components/cbt/minimal/common/MinimalFloatingNextButton";
import { MinimalLoadingState } from "@/components/cbt/minimal/common/MinimalLoadingState";
import { MinimalStepHeaderSection } from "@/components/cbt/minimal/common/MinimalStepHeaderSection";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import Button from "@/components/ui/Button";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { EmotionNote } from "@/lib/types/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useDeepAutoThought } from "../hooks/useDeepAutoThought";

interface DeepAutoThoughtSectionProps {
  userInput: string;
  emotion: string;
  mainNote: EmotionNote;
  subNotes: EmotionNote[];
  internalContext: DeepInternalContext | null;
  onComplete: (autoThought: string) => void;
}

const TITLE = "어쩌면 지긋지긋한 생각들일지도 모릅니다.";

export function DeepAutoThoughtSection({
  userInput,
  emotion,
  mainNote,
  subNotes,
  internalContext,
  onComplete,
}: DeepAutoThoughtSectionProps) {
  const { pushToast } = useCbtToast();
  const { items, loading, error, reload } = useDeepAutoThought({
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
      <MinimalLoadingState
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
            <MinimalStepHeaderSection title={TITLE} />
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
          <MinimalStepHeaderSection title={TITLE} />
        </div>

        {wantsCustom ? (
          <div className={styles.inlineCard}>
            <MinimalAutoThoughtInputForm
              value={customThought}
              onChange={setCustomThought}
            />
          </div>
        ) : (
          <div className={styles.inlineCard}>
            <MinimalAutoThoughtTextSection
              belief={currentThought?.belief ?? ""}
              emotionReason={currentThought?.emotionReason ?? ""}
              fallback="생각을 불러오는 중입니다."
            />
          </div>
        )}

        <div className={styles.formStack}>
          <MinimalFloatingNextButton onClick={handleSelect} />
          {wantsCustom ? (
            <MinimalAutoThoughtHintSection />
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
