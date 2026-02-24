"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { ButtonProps } from "@/components/ui/Button";
import SafeButton from "@/components/ui/SafeButton";
import styles from "./FloatingActionButton.module.css";

type FloatingActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon?: ReactNode;
  helperText?: string;
  placement?: "default" | "tab";
  hideWhenModalOpen?: boolean;
  loading?: boolean;
  loadingRing?: boolean;
  sparkleRing?: boolean;
  loadingText?: ButtonProps["loadingText"];
  loadingBehavior?: ButtonProps["loadingBehavior"];
};

export default function FloatingActionButton({
  label,
  icon,
  helperText,
  placement = "default",
  hideWhenModalOpen = true,
  loading,
  loadingRing,
  sparkleRing,
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
        hideWhenModalOpen ? styles.hideWhenModalOpen : "",
        placement === "tab" ? styles.placementTab : "",
        loadingRing ? styles.hasLoadingRing : "",
        sparkleRing ? styles.hasSparkleRing : "",
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
      {sparkleRing ? (
        <span className={styles.sparkleRingFrame} aria-hidden>
          <span className={styles.sparkleRing} />
          <span className={styles.sparkleRingMask} />
        </span>
      ) : null}
      <span className={styles.contentLayer}>{icon ?? label}</span>
      {helperText ? (
        <span className={styles.helperText}>{helperText}</span>
      ) : null}
    </SafeButton>
  );
}
