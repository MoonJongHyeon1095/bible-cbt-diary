"use client";

import type { ButtonHTMLAttributes, MouseEventHandler } from "react";
import { useCallback, useRef } from "react";
import type { ButtonProps } from "./Button";
import Button from "./Button";

export type SafeButtonProps = ButtonProps & {
  guardMs?: number;
  mode?: "ui" | "native";
};

export default function SafeButton({
  guardMs = 300,
  mode = "ui",
  onClick,
  disabled,
  loading,
  ...rest
}: SafeButtonProps) {
  const lastClickAtRef = useRef(0);

  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      if (disabled || loading) {
        return;
      }

      const now = Date.now();
      if (now - lastClickAtRef.current < guardMs) {
        return;
      }

      lastClickAtRef.current = now;
      onClick?.(event);
    },
    [disabled, guardMs, loading, onClick],
  );

  if (mode === "native") {
    const nativeProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        {...nativeProps}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        onClick={handleClick}
      />
    );
  }

  return (
    <Button
      {...rest}
      disabled={disabled}
      loading={loading}
      onClick={handleClick}
    />
  );
}
