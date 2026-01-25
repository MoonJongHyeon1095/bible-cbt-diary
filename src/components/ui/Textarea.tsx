"use client";

import type { TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";
import styles from "./Textarea.module.css";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...rest }, ref) => (
    <textarea
      {...rest}
      ref={ref}
      className={[styles.textarea, className].filter(Boolean).join(" ")}
    />
  ),
);

Textarea.displayName = "Textarea";

export default Textarea;
