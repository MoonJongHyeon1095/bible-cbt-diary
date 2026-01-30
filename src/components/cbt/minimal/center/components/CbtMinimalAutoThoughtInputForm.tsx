import { useRef } from "react";
import { useCbtAutoResizeTextarea } from "@/components/cbt/hooks/useCbtAutoResizeTextarea";
import styles from "../../MinimalStyles.module.css";

interface CbtMinimalAutoThoughtInputFormProps {
  value: string;
  onChange: (value: string) => void;
}

export function CbtMinimalAutoThoughtInputForm({
  value,
  onChange,
}: CbtMinimalAutoThoughtInputFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useCbtAutoResizeTextarea(textareaRef, [value]);

  return (
    <div
      className={`${styles.inputWrap} ${
        value.trim() ? styles.inputWrapFilled : ""
      }`}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={1}
        placeholder="예: 나는 항상 실수만 하는 사람 같아."
        className={styles.textarea}
      />
    </div>
  );
}
