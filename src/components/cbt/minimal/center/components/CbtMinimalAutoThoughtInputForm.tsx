import { useCbtAutoResizeTextarea } from "@/components/cbt/hooks/useCbtAutoResizeTextarea";
import { useRef } from "react";
import styles from "../../MinimalStyles.module.css";

interface CbtMinimalAutoThoughtInputFormProps {
  value: string;
  onChange: (value: string) => void;
  action?: React.ReactNode;
}

export function CbtMinimalAutoThoughtInputForm({
  value,
  onChange,
  action,
}: CbtMinimalAutoThoughtInputFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useCbtAutoResizeTextarea(textareaRef, [value]);

  return (
    <div
      className={`${styles.inputWrap} ${
        value.trim() ? styles.inputWrapFilled : ""
      } ${action ? styles.inputWrapWithFab : ""}`}
    >
      <div
        className={`${styles.textareaShell} ${
          action ? styles.textareaShellWithFab : ""
        }`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={1}
          placeholder="당신의 생각을 적어주세요."
          className={`${styles.textarea} ${action ? styles.textareaWithFab : ""}`}
        />
        {action ? action : null}
      </div>
    </div>
  );
}
