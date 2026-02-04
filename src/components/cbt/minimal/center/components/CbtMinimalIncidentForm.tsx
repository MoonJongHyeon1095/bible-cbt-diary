import { useCbtAutoResizeTextarea } from "@/components/cbt/hooks/useCbtAutoResizeTextarea";
import SafeButton from "@/components/ui/SafeButton";
import { useRef } from "react";
import type { RefObject } from "react";
import styles from "../../MinimalStyles.module.css";

interface CbtMinimalIncidentFormProps {
  userInput: string;
  onInputChange: (value: string) => void;
  onShowExample: () => void;
  highlightInput?: boolean;
  textareaRef?: RefObject<HTMLTextAreaElement>;
}

export function CbtMinimalIncidentForm({
  userInput,
  onInputChange,
  onShowExample,
  highlightInput = false,
  textareaRef,
}: CbtMinimalIncidentFormProps) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const resolvedRef = textareaRef ?? localRef;
  useCbtAutoResizeTextarea(resolvedRef, [userInput]);

  return (
    <div className={styles.formStack}>
      <div
        className={`${styles.inputWrap} ${styles.incidentInputCard} ${
          userInput.trim() ? styles.inputWrapFilled : ""
        } ${highlightInput ? styles.inputWrapHighlight : ""}`}
      >
        <textarea
          ref={resolvedRef}
          value={userInput}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="구체적으로 적을 수록 효과적입니다."
          rows={1}
          data-tour="minimal-incident-input"
          className={`${styles.textarea} ${styles.incidentTextarea}`}
        />
      </div>
      <SafeButton
        type="button"
        variant="unstyled"
        onClick={onShowExample}
        data-tour="minimal-incident-example"
        className={styles.exampleButton}
      >
        예시를 보여주세요
      </SafeButton>
    </div>
  );
}
