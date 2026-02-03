"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useModalOpen } from "@/components/common/useModalOpen";
import { useEmblaPagination } from "@/lib/hooks/useEmblaPagination";
import CbtCarousel from "./CbtCarousel";
import CbtCarouselDots from "./CbtCarouselDots";
import Button from "@/components/ui/Button";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";

type CbtCarouselModalItem = {
  id: string;
  title?: string;
  body: string;
  applyText?: string;
  lines?: { label: string; text: string }[];
};

type CbtCarouselModalProps = {
  open: boolean;
  title: string;
  items: CbtCarouselModalItem[];
  onClose: () => void;
  onSelect: (value: string) => void;
  selectLabel?: string;
  emptyMessage?: string;
  selectOnSlide?: boolean;
  showSelectButton?: boolean;
  plainSlides?: boolean;
};

export default function CbtCarouselModal({
  open,
  title,
  items,
  onClose,
  onSelect,
  selectLabel = "이 내용 사용하기",
  emptyMessage = "표시할 내용이 없습니다.",
  selectOnSlide = false,
  showSelectButton = true,
  plainSlides = false,
}: CbtCarouselModalProps) {
  useModalOpen(open);

  const [currentIndex, setCurrentIndex] = useState(0);
  const { emblaRef, controls } = useEmblaPagination({
    slidesCount: items.length,
    selectedIndex: currentIndex,
    onSelectIndex: setCurrentIndex,
  });

  useEffect(() => {
    if (!open) return;
    setCurrentIndex(0);
  }, [open, items.length]);

  const currentItem = useMemo(
    () => items[currentIndex] ?? null,
    [currentIndex, items],
  );

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalCard}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <p className={styles.modalTitle}>{title}</p>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {items.length === 0 ? (
            <div className={styles.modalEmpty}>{emptyMessage}</div>
          ) : (
            <CbtCarousel emblaRef={emblaRef}>
              {items.map((item) => (
                <div key={item.id} className={styles.emblaSlide}>
                  <button
                    type="button"
                    className={
                      plainSlides
                        ? styles.modalSlidePlain
                        : styles.modalSlideCard
                    }
                    onClick={() => {
                      if (!selectOnSlide) return;
                      const text = item.applyText ?? item.body;
                      onSelect(text);
                      onClose();
                    }}
                    disabled={!selectOnSlide}
                  >
                    {item.title ? (
                      <p className={styles.modalSlideTitle}>{item.title}</p>
                    ) : null}
                    {item.lines?.length ? (
                      <div className={styles.modalLineList}>
                        {item.lines.map((line, lineIndex) => (
                          <div
                            key={`${item.id}-line-${lineIndex}`}
                            className={styles.modalLine}
                          >
                            <span className={styles.modalLineLabel}>
                              {line.label}
                            </span>
                            <span className={styles.modalLineText}>
                              {line.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.modalSlideText}>{item.body}</p>
                    )}
                  </button>
                </div>
              ))}
            </CbtCarousel>
          )}
        </div>

        <div className={styles.modalFooter}>
          <CbtCarouselDots
            count={items.length}
            currentIndex={currentIndex}
            onSelect={controls.scrollTo}
          />
          {showSelectButton && (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                if (!currentItem) return;
                const text = currentItem.applyText ?? currentItem.body;
                onSelect(text);
                onClose();
              }}
              disabled={!currentItem}
            >
              {selectLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
