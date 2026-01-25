import { validateUserText } from "@/components/cbt/utils/validation";
import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { MinimalFloatingNextButton } from "@/components/cbt/minimal/common/MinimalFloatingNextButton";
import { MinimalStepHeaderSection } from "@/components/cbt/minimal/common/MinimalStepHeaderSection";
import { useRef } from "react";
import { useAutoResizeTextarea } from "@/components/cbt/hooks/useAutoResizeTextarea";
import type { EmotionNote } from "@/lib/types";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";
import deepStyles from "../DeepStyles.module.css";
import Button from "@/components/ui/Button";

interface DeepIncidentSectionProps {
  userInput: string;
  onInputChange: (value: string) => void;
  onNext: () => void;
  mainNote: EmotionNote;
  subNotes: EmotionNote[];
}

export function DeepIncidentSection({
  userInput,
  onInputChange,
  onNext,
  mainNote,
  subNotes,
}: DeepIncidentSectionProps) {
  const { pushToast } = useCbtToast();
  const title = (
    <>
      다시, 이 일에 대해
      <span className={deepStyles.titleBreak} aria-hidden="true" />
      생각해봅니다.
    </>
  );

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useAutoResizeTextarea(textareaRef, [userInput]);

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

  const normalizeTrigger = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");
  const mainTriggerKey = normalizeTrigger(mainNote.trigger_text ?? "");
  const seenTriggers = new Set<string>(mainTriggerKey ? [mainTriggerKey] : []);
  const sortedSubs = [...subNotes]
    .sort((a, b) => b.id - a.id)
    .filter((note) => {
      const key = normalizeTrigger(note.trigger_text ?? "");
      if (!key || seenTriggers.has(key)) {
        return false;
      }
      seenTriggers.add(key);
      return true;
    });
  const description = (
    <div className={deepStyles.triggerList}>
      <div className={`${deepStyles.triggerItem} ${deepStyles.triggerItemMain}`}>
        <p className={deepStyles.triggerText}>{mainNote.trigger_text}</p>
      </div>
      {sortedSubs.map((note, index) => {
        const opacity = Math.max(0.28, 0.7 - index * 0.14);
        const scale = Math.max(0.85, 1 - index * 0.06);
        return (
          <div
            key={note.id}
            className={deepStyles.triggerItem}
            style={{ opacity, transform: `scale(${scale})` }}
          >
            <p className={deepStyles.triggerText}>{note.trigger_text}</p>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.headerInset}>
          <MinimalStepHeaderSection title={title} description={description} />
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

        <MinimalFloatingNextButton onClick={handleNext} />
      </div>
    </div>
  );
}
