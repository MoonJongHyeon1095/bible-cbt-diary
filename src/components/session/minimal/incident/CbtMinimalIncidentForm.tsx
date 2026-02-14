import { useCbtAutoResizeTextarea } from "@/components/session/hooks/useCbtAutoResizeTextarea";
import { useRef } from "react";
import type { RefObject } from "react";
import styles from "../MinimalStyles.module.css";

interface CbtMinimalIncidentFormProps {
  userInput: string;
  onInputChange: (value: string) => void;
  highlightInput?: boolean;
  textareaRef?: RefObject<HTMLTextAreaElement>;
  action?: React.ReactNode;
  actionRow?: React.ReactNode;
}

export function CbtMinimalIncidentForm({
  userInput,
  onInputChange,
  highlightInput = false,
  textareaRef,
  action,
  actionRow,
}: CbtMinimalIncidentFormProps) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const resolvedRef = textareaRef ?? localRef;
  useCbtAutoResizeTextarea(resolvedRef, [userInput]);

  return (
    <div className={styles.formStack}>
      <div
        className={`${styles.inputWrap} ${styles.incidentInputCard} ${
          userInput.trim() ? styles.inputWrapFilled : ""
        } ${highlightInput ? styles.inputWrapHighlight : ""} ${
          action ? styles.inputWrapWithFab : ""
        }`}
      >
        <div
          className={`${styles.textareaShell} ${
            action ? styles.textareaShellWithFab : ""
          }`}
        >
          <textarea
            ref={resolvedRef}
            value={userInput}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="구체적으로 적을 수록 효과적입니다."
            rows={1}
            data-tour="minimal-incident-input"
            className={`${styles.textarea} ${styles.incidentTextarea} ${
              action ? styles.textareaWithFab : ""
            }`}
          />
          {actionRow ? (
            <div className={styles.textareaActionRow}>{actionRow}</div>
          ) : null}
          {action ? action : null}
        </div>
      </div>
    </div>
  );
}
