import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { useCbtAutoResizeTextarea } from "@/components/cbt/hooks/useCbtAutoResizeTextarea";
import { CbtMinimalFloatingNextButton } from "@/components/cbt/minimal/common/CbtMinimalFloatingNextButton";
import { CbtMinimalStepHeaderSection } from "@/components/cbt/minimal/common/CbtMinimalStepHeaderSection";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import { validateUserText } from "@/components/cbt/utils/validation";
import Button from "@/components/ui/Button";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { useEffect, useRef } from "react";
import deepStyles from "../DeepStyles.module.css";

interface CbtDeepIncidentSectionProps {
  userInput: string;
  onInputChange: (value: string) => void;
  onNext: () => void;
  mainNote: EmotionNote;
}

export function CbtDeepIncidentSection({
  userInput,
  onInputChange,
  onNext,
  mainNote,
}: CbtDeepIncidentSectionProps) {
  const { pushToast } = useCbtToast();
  const title = (
    <>
      다시, 이 일에 대해
      <span className={deepStyles.titleBreak} aria-hidden="true" />
      생각해봅니다.
    </>
  );

  const headerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useCbtAutoResizeTextarea(textareaRef, [userInput]);

  const handleUsePrevious = () => {
    if (mainNote.trigger_text) onInputChange(mainNote.trigger_text);
  };

  const handleNext = () => {
    const validation = validateUserText(userInput, {
      minLength: 10,
      minLengthMessage: "상황을 10자 이상 입력해주세요.",
    });
    if (!validation.ok) {
      pushToast(validation.message, "error");
      return;
    }
    onNext();
  };

  const buildNoteLines = (note: EmotionNote) => {
    const thought = note.thought_details?.[0]?.automatic_thought;
    const errorDetail = note.error_details?.[0];
    const errorText =
      errorDetail?.error_description || errorDetail?.error_label || "";
    return [note.trigger_text, thought, errorText].filter(
      (value): value is string => Boolean(value?.trim()),
    );
  };
  const noteLines = buildNoteLines(mainNote);
  const description = (
    <div className={deepStyles.triggerList}>
      <div
        className={`${deepStyles.triggerItem} ${deepStyles.triggerItemMain}`}
      >
        {noteLines.map((line, index) => {
          const opacity = Math.max(0.45, 1 - index * 0.2);
          const fontScale = Math.max(0.8, 1 - index * 0.1);
          return (
            <p
              key={`${mainNote.id}-main-${index}`}
              className={deepStyles.triggerText}
              style={{
                opacity,
                fontSize: `${fontScale}em`,
              }}
            >
              {line}
            </p>
          );
        })}
      </div>
    </div>
  );

  useEffect(() => {
    const node = headerRef.current;
    if (!node || typeof window === "undefined") return;
    const rect = node.getBoundingClientRect();
    const target = window.scrollY + rect.top - (window.innerHeight / 2 - rect.height / 2);
    const top = Math.max(0, target);
    window.scrollTo({ top, behavior: "auto" });
  }, []);

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.headerInset} ref={headerRef}>
          <CbtMinimalStepHeaderSection title={title} description={description} />
        </div>

        <div className={styles.formStack}>
          <div
            className={`${styles.inputWrap} ${
              userInput.trim() ? styles.inputWrapFilled : ""
            }`}
          >
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder=""
              rows={1}
              className={styles.textarea}
            />
          </div>
          <Button
            type="button"
            variant="unstyled"
            onClick={handleUsePrevious}
            className={styles.exampleButton}
          >
            이전의 상황을 사용합니다
          </Button>
        </div>

        <CbtMinimalFloatingNextButton onClick={handleNext} />
      </div>
    </div>
  );
}
