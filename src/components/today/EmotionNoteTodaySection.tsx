"use client";

import EmotionNoteListSection from "@/components/emotion-notes/EmotionNoteListSection";
import styles from "@/components/emotion-notes/EmotionNoteSection.module.css";
import CharacterPrompt from "@/components/ui/CharacterPrompt";
import SafeButton from "@/components/ui/SafeButton";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { EMOTION_NOTE_STARTED_KEY } from "@/lib/storage/keys/onboarding";
import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";

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
  const { checkUsage } = useAiUsageGuard({
    enabled: false,
    cache: true,
    redirectTo: null,
  });
  const [isStartLoading, setIsStartLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (notes.length > 0) {
      setHasStarted(true);
      return;
    }
    if (!safeLocalStorage.isAvailable()) {
      setHasStarted(false);
      return;
    }
    const stored = safeLocalStorage.getItem(EMOTION_NOTE_STARTED_KEY);
    setHasStarted(stored === "true");
  }, [notes.length]);

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
        <h2 className={styles.todayTitle}>
          <CharacterPrompt
            name="EDi"
            greeting="안녕하세요."
            className={styles.todayPrompt}
          />
          <span className={styles.todayTitleQuestion}>
            오늘 무슨 일이 있었나요?
          </span>
        </h2>
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
        <p className={styles.todayHint}>{todayLabel}</p>
      </div>

      <EmotionNoteListSection
        title={
          notes.length > 0 ? `오늘 ${notes.length}개의 기록이 있습니다` : ""
        }
        notes={notes}
        isLoading={isLoading}
        showEmptyState={hasStarted}
        canGoDeeper={canGoDeeper}
        getDetailHref={getDetailHref}
      />
    </>
  );
}
