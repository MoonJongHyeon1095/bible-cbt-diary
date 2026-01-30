"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Undo2 } from "lucide-react";
import pageStyles from "@/app/page.module.css";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import AppHeader from "@/components/header/AppHeader";
import styles from "./EmotionNoteAddPageLayout.module.css";

type EmotionNoteAddPageLayoutProps = {
  title: string;
  tone: "amber" | "rose" | "green" | "blue";
  icon: LucideIcon;
  onClose: () => void;
  children: ReactNode;
};

export default function EmotionNoteAddPageLayout({
  title,
  tone,
  icon,
  onClose,
  children,
}: EmotionNoteAddPageLayoutProps) {
  const Icon = icon;
  const toneClass =
    tone === "amber"
      ? styles.toneAmber
      : tone === "rose"
        ? styles.toneRose
        : tone === "green"
          ? styles.toneGreen
          : styles.toneBlue;

  return (
    <div className={pageStyles.page}>
      <AppHeader />
      <main className={pageStyles.main}>
        <div className={pageStyles.shell}>
          <section className={styles.shell}>
            <header className={[styles.header, toneClass].join(" ")}>
              <div className={styles.headerTitle}>
                <span className={styles.headerIcon} aria-hidden>
                  <Icon size={18} />
                </span>
                <h2>{title}</h2>
              </div>
            </header>
            <div className={styles.body}>{children}</div>
          </section>
        </div>
      </main>
      <FloatingActionButton
        label="뒤로"
        icon={<Undo2 size={22} />}
        onClick={onClose}
        style={{
          right: "auto",
          left: "24px",
          bottom: "120px",
          backgroundColor: "rgba(255, 255, 255, 0.72)",
          borderColor: "rgba(255, 255, 255, 0.55)",
          color: "rgba(31, 35, 40, 0.8)",
          width: "56px",
          height: "56px",
          ["--fab-helper-translate-x" as string]: "22px",
        }}
      />
    </div>
  );
}
