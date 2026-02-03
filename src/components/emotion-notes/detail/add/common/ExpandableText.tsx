"use client";

import styles from "./ExpandableText.module.css";
import SafeButton from "@/components/ui/SafeButton";

interface ExpandableTextProps {
  text: string;
  expanded: boolean;
  onToggle: () => void;
  tone?: "blue" | "green" | "amber" | "rose";
}

const toneText: Record<"blue" | "green" | "amber" | "rose", string> = {
  blue: styles.toneBlue,
  green: styles.toneGreen,
  amber: styles.toneAmber,
  rose: styles.toneRose,
};

export function ExpandableText({
  text,
  expanded,
  onToggle,
  tone = "blue",
}: ExpandableTextProps) {
  return (
    <>
      <p
        className={[
          styles.text,
          expanded ? styles.expanded : styles.collapsed,
        ].join(" ")}
      >
        {text}
      </p>
      <SafeButton mode="native"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className={[styles.toggle, toneText[tone]].join(" ")}
      >
        {expanded ? "접기" : "더보기"}
      </SafeButton>
    </>
  );
}
