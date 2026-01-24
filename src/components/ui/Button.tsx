"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "unstyled";

type ButtonSize = "sm" | "md" | "lg" | "icon";
type LoadingBehavior = "inline" | "replace";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  loadingBehavior?: LoadingBehavior;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  loadingBehavior = "inline",
  icon,
  iconPosition = "left",
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const baseClass = variant === "unstyled" ? "" : styles.button;
  const variantClass = variant === "unstyled" ? "" : styles[variant];
  const sizeClass = variant === "unstyled" ? "" : styles[size];
  const classes = [baseClass, variantClass, sizeClass, className]
    .filter(Boolean)
    .join(" ");

  const hideContent = loading && loadingBehavior === "replace" && !loadingText;
  const content = loading
    ? loadingText ?? (hideContent ? null : children)
    : children;
  const contentClass =
    variant === "unstyled" ? styles.unstyledContent : styles.content;

  return (
    <button
      type={rest.type ?? "button"}
      {...rest}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
    >
      {loading && <span className={styles.spinner} aria-hidden />}
      {!loading && icon && iconPosition === "left" ? icon : null}
      {content !== null && content !== undefined ? (
        <span className={contentClass}>{content}</span>
      ) : null}
      {!loading && icon && iconPosition === "right" ? icon : null}
    </button>
  );
}
