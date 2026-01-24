"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { ButtonProps } from "@/components/ui/Button";
import Button from "@/components/ui/Button";
import styles from "./FloatingActionButton.module.css";

type FloatingActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon?: ReactNode;
  helperText?: string;
  loading?: boolean;
  loadingText?: ButtonProps["loadingText"];
  loadingBehavior?: ButtonProps["loadingBehavior"];
};

export default function FloatingActionButton({
  label,
  icon,
  helperText,
  loading,
  loadingText,
  loadingBehavior,
  className,
  ...rest
}: FloatingActionButtonProps) {
  return (
    <Button
      type="button"
      variant="unstyled"
      className={[styles.button, className].filter(Boolean).join(" ")}
      aria-label={label}
      loading={loading}
      loadingText={loadingText}
      loadingBehavior={loadingBehavior}
      {...rest}
    >
      {icon ?? label}
      {helperText ? (
        <span className={styles.helperText}>{helperText}</span>
      ) : null}
    </Button>
  );
}
