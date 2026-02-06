"use client";

import { MessageCircleMore } from "lucide-react";
import styles from "./CharacterPrompt.module.css";

type CharacterPromptProps = {
  name: string;
  greeting: string;
  className?: string;
};

export default function CharacterPrompt({
  name,
  greeting,
  className,
}: CharacterPromptProps) {
  return (
    <span className={[styles.root, className].filter(Boolean).join(" ")}>
      <span className={styles.badge}>
        <span className={styles.badgeText}>{name}</span>
        <MessageCircleMore className={styles.icon} aria-hidden="true" />
      </span>
      <span className={styles.greeting}>{greeting}</span>
    </span>
  );
}
