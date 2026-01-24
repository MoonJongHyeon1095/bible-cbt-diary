"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./FloatingActionButton.module.css";

type FloatingActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon?: ReactNode;
  helperText?: string;
};

export default function FloatingActionButton({
  label,
  icon,
  helperText,
  className,
  ...rest
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      className={[styles.button, className].filter(Boolean).join(" ")}
      aria-label={label}
      {...rest}
    >
      {icon ?? label}
      {helperText ? (
        <span className={styles.helperText}>{helperText}</span>
      ) : null}
    </button>
  );
}
