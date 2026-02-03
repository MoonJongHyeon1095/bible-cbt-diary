"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { ButtonProps } from "@/components/ui/Button";
import SafeButton from "@/components/ui/SafeButton";
import styles from "./FloatingActionButton.module.css";

type FloatingActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon?: ReactNode;
  helperText?: string;
  loading?: boolean;
  loadingRing?: boolean;
  loadingText?: ButtonProps["loadingText"];
  loadingBehavior?: ButtonProps["loadingBehavior"];
};

export default function FloatingActionButton({
  label,
  icon,
  helperText,
  loading,
  loadingRing,
  loadingText,
  loadingBehavior,
  className,
  ...rest
}: FloatingActionButtonProps) {
  return (
    <SafeButton
      type="button"
      variant="unstyled"
      className={[
        styles.button,
        loadingRing ? styles.hasLoadingRing : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={label}
      loading={loading}
      loadingText={loadingText}
      loadingBehavior={loadingBehavior}
      {...rest}
    >
      {loadingRing ? (
        <span className={styles.loadingRing} aria-hidden />
      ) : null}
      {icon ?? label}
      {helperText ? (
        <span className={styles.helperText}>{helperText}</span>
      ) : null}
    </SafeButton>
  );
}
