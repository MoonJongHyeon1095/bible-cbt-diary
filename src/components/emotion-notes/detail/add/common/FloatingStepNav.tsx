"use client";

import { ArrowLeft } from "lucide-react";
import { createPortal } from "react-dom";
import Button from "@/components/ui/Button";
import styles from "./FloatingStepNav.module.css";

interface FloatingStepNavProps {
  show: boolean;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  showBack?: boolean;
  onBack?: () => void;
  tone?: "blue" | "green" | "amber" | "rose";
}

const toneStyles: Record<"blue" | "green" | "amber" | "rose", string> = {
  blue: styles.toneBlue,
  green: styles.toneGreen,
  amber: styles.toneAmber,
  rose: styles.toneRose,
};

export function FloatingStepNav({
  show,
  onNext,
  nextDisabled,
  nextLabel = "다음",
  showBack,
  onBack,
  tone = "blue",
}: FloatingStepNavProps) {
  const floatingRoot =
    typeof document !== "undefined"
      ? document.querySelector('[data-floating-root="pattern-edit"]')
      : null;
  const toneClass = toneStyles[tone];

  if (!show || !floatingRoot) return null;

  return createPortal(
    <div className={styles.root}>
      <div className={styles.actions}>
        {showBack && onBack && (
          <Button
            size="icon"
            variant="outline"
            onClick={onBack}
            className={[styles.backButton, toneClass].join(" ")}
            aria-label="뒤로가기"
          >
            <ArrowLeft size={16} />
          </Button>
        )}
        <Button
          size="sm"
          onClick={onNext}
          disabled={nextDisabled}
          className={[styles.nextButton, toneClass].join(" ")}
        >
          {nextLabel}
        </Button>
      </div>
    </div>,
    floatingRoot
  );
}
