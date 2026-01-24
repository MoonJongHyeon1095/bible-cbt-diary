import { useRef } from "react";
import { useAutoResizeTextarea } from "@/components/cbt/hooks/useAutoResizeTextarea";
import styles from "../../MinimalStyles.module.css";

interface MinimalAutoThoughtInputFormProps {
  value: string;
  onChange: (value: string) => void;
}

export function MinimalAutoThoughtInputForm({
  value,
  onChange,
}: MinimalAutoThoughtInputFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useAutoResizeTextarea(textareaRef, [value]);

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
