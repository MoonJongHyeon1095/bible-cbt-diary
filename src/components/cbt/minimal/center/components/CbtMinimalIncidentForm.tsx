import { useRef } from "react";
import { useCbtAutoResizeTextarea } from "@/components/cbt/hooks/useCbtAutoResizeTextarea";
import styles from "../../MinimalStyles.module.css";
import Button from "@/components/ui/Button";

interface CbtMinimalIncidentFormProps {
  userInput: string;
  onInputChange: (value: string) => void;
  onShowExample: () => void;
}

export function CbtMinimalIncidentForm({
  userInput,
  onInputChange,
  onShowExample,
}: CbtMinimalIncidentFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useCbtAutoResizeTextarea(textareaRef, [userInput]);

  return (
    <div className={styles.formStack}>
      <div
        className={`${styles.inputWrap} ${styles.incidentInputCard} ${
          userInput.trim() ? styles.inputWrapFilled : ""
        }`}
      >
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder=""
          rows={1}
          data-tour="minimal-incident-input"
          className={`${styles.textarea} ${styles.incidentTextarea}`}
        />
      </div>
      <Button
        type="button"
        variant="unstyled"
        onClick={onShowExample}
        data-tour="minimal-incident-example"
        className={styles.exampleButton}
      >
        예시를 보여주세요
      </Button>
    </div>
  );
}
