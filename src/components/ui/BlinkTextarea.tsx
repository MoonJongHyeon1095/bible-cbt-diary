import type { ChangeEvent } from "react";
import { useRef } from "react";
import { useCbtAutoResizeTextarea } from "@/components/session/hooks/useCbtAutoResizeTextarea";
import styles from "./BlinkTextarea.module.css";

type BlinkTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  disabled?: boolean;
  className?: string;
  textareaClassName?: string;
};

export default function BlinkTextarea({
  value,
  onChange,
  placeholder,
  minRows = 1,
  disabled,
  className,
  textareaClassName,
}: BlinkTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useCbtAutoResizeTextarea(textareaRef, [value]);

  return (
    <div
      className={[
        styles.inputWrap,
        value.trim() ? styles.inputWrapFilled : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={minRows}
        disabled={disabled}
        className={[styles.textarea, textareaClassName]
          .filter(Boolean)
          .join(" ")}
      />
    </div>
  );
}
