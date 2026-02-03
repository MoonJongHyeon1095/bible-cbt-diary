"use client";

import type { ReactNode } from "react";
import styles from "@/components/cbt/minimal/MinimalStyles.module.css";

type CbtCarouselProps = {
  emblaRef: (node: HTMLDivElement | null) => void;
  children: ReactNode;
};

export default function CbtCarousel({ emblaRef, children }: CbtCarouselProps) {
  return (
    <div className={styles.embla}>
      <div className={styles.emblaViewport} ref={emblaRef}>
        <div className={styles.emblaContainer}>{children}</div>
      </div>
    </div>
  );
}
