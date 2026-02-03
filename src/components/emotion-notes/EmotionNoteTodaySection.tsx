"use client";

import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useState } from "react";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import SafeButton from "@/components/ui/SafeButton";
import EmotionNoteListSection from "./EmotionNoteListSection";
import styles from "./EmotionNoteSection.module.css";

type EmotionNoteTodaySectionProps = {
  notes: EmotionNote[];
  todayLabel: string;
  isLoading: boolean;
  canGoDeeper?: boolean;
  getDetailHref?: (note: EmotionNote) => string;
};

export default function EmotionNoteTodaySection({
  notes,
  todayLabel,
  isLoading,
  canGoDeeper = true,
  getDetailHref,
}: EmotionNoteTodaySectionProps) {
  const router = useRouter();
  const { checkUsage } = useAiUsageGuard({ enabled: false, cache: true });
  const [isStartLoading, setIsStartLoading] = useState(false);

  const handleStartSession = async (event: MouseEvent<HTMLButtonElement>) => {
    if (isStartLoading) {
      return;
    }
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    setIsStartLoading(true);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    const allowed = await checkUsage();
    if (!allowed) {
      setIsStartLoading(false);
      return;
    }
    router.push("/session");
  };

  return (
    <>
      <div className={styles.todayCard}>
        <p className={styles.todayLabel}>{todayLabel}</p>
        <h2 className={styles.todayTitle}>오늘의 감정 기록</h2>
        <SafeButton
          type="button"
          variant="unstyled"
          className={[
            styles.plusButton,
            isStartLoading ? styles.plusButtonLoading : "",
          ]
            .filter(Boolean)
            .join(" ")}
          data-tour="new-note"
          onClick={handleStartSession}
        >
          {isStartLoading ? (
            <span className={styles.plusButtonRing} aria-hidden />
          ) : null}
          <span className={styles.plusIcon} aria-hidden>
            +
          </span>
          <span className={styles.plusText}>새 기록 추가</span>
        </SafeButton>
        <p className={styles.todayHint}>오늘 무슨 일이 있었나요?</p>
      </div>

      <EmotionNoteListSection
        title={
          notes.length > 0 ? `오늘 ${notes.length}개의 기록이 있습니다` : ""
        }
        notes={notes}
        isLoading={isLoading}
        canGoDeeper={canGoDeeper}
        getDetailHref={getDetailHref}
      />
    </>
  );
}
