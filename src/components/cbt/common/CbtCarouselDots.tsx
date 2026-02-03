"use client";

import styles from "@/components/cbt/minimal/MinimalStyles.module.css";

type CbtCarouselDotsProps = {
  count: number;
  currentIndex: number;
  onSelect: (index: number) => void;
  disabled?: boolean;
  className?: string;
};

export default function CbtCarouselDots({
  count,
  currentIndex,
  onSelect,
  disabled = false,
  className,
}: CbtCarouselDotsProps) {
  if (count <= 1) return null;

  const safeIndex = Number.isFinite(currentIndex)
    ? Math.max(0, Math.min(currentIndex, count - 1))
    : 0;
  const windowSize = Math.min(5, count);
  const half = Math.floor(windowSize / 2);
  const start = Math.max(0, Math.min(safeIndex - half, count - windowSize));
  const end = start + windowSize;
  const visible = Array.from({ length: windowSize }, (_, i) => start + i);

  return (
    <div className={`${styles.carouselDots} ${className ?? ""}`.trim()}>
      {visible.map((index) => {
        const isActive = index === safeIndex;
        return (
          <button
            key={`dot-${index}`}
            type="button"
            className={`${styles.carouselDot} ${
              isActive ? styles.carouselDotActive : ""
            }`.trim()}
            aria-label={`${index + 1} / ${count}`}
            aria-current={isActive ? "true" : undefined}
            onClick={() => onSelect(index)}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}
