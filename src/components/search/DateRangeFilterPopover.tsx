"use client";

import SafeButton from "@/components/ui/SafeButton";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import styles from "./EmotionNoteSearchSection.module.css";

type DateRangeFilterPopoverProps = {
  isOpen: boolean;
  draftRange: DateRange | undefined;
  rangeLabel: string;
  onSelect: (range: DateRange | undefined) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
};

export default function DateRangeFilterPopover({
  isOpen,
  draftRange,
  rangeLabel,
  onSelect,
  onApply,
  onClear,
  onClose,
}: DateRangeFilterPopoverProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!panelRef.current || !target) return;
      if (!panelRef.current.contains(target)) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.filterPopover}>
      <div ref={panelRef} className={styles.filterPanel}>
        <div className={styles.rangeHeader}>
          <span className={styles.rangeLabel}>기간</span>
          <span className={styles.rangeValue}>{rangeLabel}</span>
        </div>
        <div className={styles.dayPickerWrapper}>
          <DayPicker
            mode="range"
            selected={draftRange}
            onSelect={onSelect}
            numberOfMonths={1}
            className={styles.dayPicker}
          />
        </div>
        <div className={styles.filterActions}>
          <SafeButton type="button" variant="ghost" onClick={onClear}>
            <X size={16} />
            초기화
          </SafeButton>
          <SafeButton type="button" onClick={onApply}>
            적용
          </SafeButton>
        </div>
      </div>
    </div>
  );
}
