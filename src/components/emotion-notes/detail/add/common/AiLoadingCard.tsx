"use client";

import { Loader2 } from "lucide-react";
import styles from "./AiLoadingCard.module.css";

interface AiLoadingCardProps {
  title: string;
  description: string;
  tone?: "blue" | "green" | "amber" | "rose";
}

const toneStyles: Record<"blue" | "green" | "amber" | "rose", string> = {
  blue: styles.toneBlue,
  green: styles.toneGreen,
  amber: styles.toneAmber,
  rose: styles.toneRose,
};

export function AiLoadingCard({
  title,
  description,
  tone = "blue",
}: AiLoadingCardProps) {
  const toneClass = toneStyles[tone];
  return (
    <div className={[styles.card, toneClass].join(" ")}>
      <div className={styles.row}>
        <Loader2 className={[styles.icon, styles.spin].join(" ")} size={20} />
        <div>
          <p className={styles.title}>{title}</p>
          <p className={styles.description}>{description}</p>
        </div>
      </div>
      <div className={[styles.pulse, styles.pulseAnim].join(" ")}>
        <div className={[styles.pulseLine, styles.pulseLineWide].join(" ")} />
        <div className={[styles.pulseLine, styles.pulseLineMedium].join(" ")} />
        <div className={[styles.pulseLine, styles.pulseLineShort].join(" ")} />
      </div>
    </div>
  );
}
