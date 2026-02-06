"use client";

import styles from "@/app/page.module.css";
import EmotionNoteTodaySection from "@/components/emotion-notes/EmotionNoteTodaySection";
import {
  buildTodayTourSteps,
  TODAY_TOUR_STORAGE_KEY,
} from "@/components/emotion-notes/onboarding/todayOnboarding";
import { useGate } from "@/components/gate/GateProvider";
import AppHeader from "@/components/header/AppHeader";
import OnboardingTour from "@/components/ui/OnboardingTour";
import { useOnboardingTourControls } from "@/components/ui/useOnboardingTourControls";
import { fetchEmotionNotes } from "@/lib/api/emotion-notes/getEmotionNotes";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useStorageBlockedRedirect } from "@/lib/hooks/useStorageBlockedRedirect";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { safeLocalStorage } from "@/lib/utils/safeStorage";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

type TourProgress = {
  lastStep: number;
  lastTotal: number;
};

const getTodayLabel = () => {
  return formatKoreanDateTime(new Date(), {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
};

export default function EmotionNoteTodayPage() {
  const {
    accessMode,
    accessToken,
    isLoading: isAccessLoading,
  } = useAccessContext();
  const [notes, setNotes] = useState<EmotionNote[]>([]);
  const { blocker, canShowOnboarding } = useGate();
  const todayLabel = useMemo(() => getTodayLabel(), []);
  const access = useMemo<AccessContext>(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );
  const tourSteps = useMemo(
    () => buildTodayTourSteps(notes.length),
    [notes.length],
  );

  const persistTourProgress = useCallback(
    (stepIndex: number) => {
      if (!safeLocalStorage.isAvailable()) return;
      safeLocalStorage.setItem(
        TODAY_TOUR_STORAGE_KEY,
        JSON.stringify({
          lastStep: stepIndex,
          lastTotal: tourSteps.length,
        }),
      );
    },
    [tourSteps.length],
  );

  const {
    isOpen: isTourOpen,
    setIsOpen: setIsTourOpen,
    currentStep,
    setCurrentStep,
    onFinish: handleTourFinish,
    onClose: handleTourClose,
    onMaskClick: handleTourMaskClick,
  } = useOnboardingTourControls({ onPersist: persistTourProgress });

  const notesQuery = useQuery({
    queryKey: queryKeys.emotionNotes.list(access),
    queryFn: async () => {
      const { response, data } = await fetchEmotionNotes(access);
      if (!response.ok) {
        throw new Error("emotion_notes fetch failed");
      }
      return data.notes ?? [];
    },
    enabled: access.mode !== "blocked",
  });

  const isLoading = notesQuery.isPending || notesQuery.isFetching;

  useEffect(() => {
    if (access.mode === "blocked") {
      setNotes([]);
      return;
    }
    if (notesQuery.data) {
      setNotes(notesQuery.data);
    }
    if (notesQuery.isError) {
      setNotes([]);
    }
  }, [access.mode, notesQuery.data, notesQuery.isError]);
  useStorageBlockedRedirect({
    enabled: !isAccessLoading && accessMode === "blocked",
  });

  useEffect(() => {
    if (blocker && isTourOpen) {
      setIsTourOpen(false);
    }
  }, [blocker, isTourOpen, setIsTourOpen]);

  useEffect(() => {
    if (!safeLocalStorage.isAvailable()) return;
    if (access.mode === "blocked" || isLoading || isAccessLoading) return;
    if (!canShowOnboarding) return;
    if (isTourOpen) return;
    const stored = safeLocalStorage.getItem(TODAY_TOUR_STORAGE_KEY);
    const maxStepIndex = tourSteps.length - 1;
    let progress: TourProgress | null = null;
    if (stored) {
      try {
        progress = JSON.parse(stored) as TourProgress;
      } catch {
        progress = null;
      }
    }

    if (!progress) {
      setCurrentStep(0);
      setIsTourOpen(true);
      return;
    }

    if (tourSteps.length > progress.lastTotal) {
      const nextStep = Math.max(
        0,
        Math.min(progress.lastStep + 1, maxStepIndex),
      );
      setCurrentStep(nextStep);
      setIsTourOpen(true);
    }
  }, [
    access.mode,
    isLoading,
    isTourOpen,
    isAccessLoading,
    canShowOnboarding,
    tourSteps.length,
    setCurrentStep,
    setIsTourOpen,
  ]);

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          {isAccessLoading || accessMode === "blocked" ? null : (
            <EmotionNoteTodaySection
              notes={notes}
              todayLabel={todayLabel}
              isLoading={isLoading}
              canGoDeeper={accessMode === "auth"}
              getDetailHref={(note) => `/detail?id=${note.id}&from=today`}
            />
          )}
        </div>
      </main>
      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        setIsOpen={setIsTourOpen}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        onFinish={handleTourFinish}
        onClose={handleTourClose}
        onMaskClick={handleTourMaskClick}
      />
    </div>
  );
}
