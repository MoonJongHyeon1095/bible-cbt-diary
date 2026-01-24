import { useRef } from "react";
import { useAutoResizeTextarea } from "@/components/cbt/hooks/useAutoResizeTextarea";
import styles from "../../MinimalStyles.module.css";
import Button from "@/components/ui/Button";

interface MinimalIncidentFormProps {
  userInput: string;
  onInputChange: (value: string) => void;
  onShowExample: () => void;
}

export function MinimalIncidentForm({
  userInput,
  onInputChange,
  onShowExample,
}: MinimalIncidentFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useAutoResizeTextarea(textareaRef, [userInput]);

  return (
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
        onClick={onShowExample}
        className={styles.exampleButton}
      >
        예시를 보여주세요
      </Button>
    </div>
  );
}
