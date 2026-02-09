"use client";

import styles from "@/app/page.module.css";
import EmotionNoteTodaySection from "@/components/emotion-notes/EmotionNoteTodaySection";
import { buildTodayTourSteps } from "@/components/emotion-notes/onboarding/todayOnboarding";
import {
  UNIFIED_TOUR_BASE_TOTAL,
  UNIFIED_TOUR_STORAGE_KEY,
} from "@/components/onboarding/unifiedOnboarding";
import { useGate } from "@/components/gate/GateProvider";
import AppHeader from "@/components/header/AppHeader";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { useOnboardingTourControls } from "@/components/onboarding/useOnboardingTourControls";
import { fetchEmotionNoteList } from "@/lib/api/emotion-notes/getEmotionNoteList";
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
    isBlocked,
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
  const [activeTourGroup, setActiveTourGroup] = useState<"lead" | "tail" | null>(
    null,
  );
  const leadTourSteps = useMemo(() => tourSteps.slice(0, 1), [tourSteps]);
  const tailTourSteps = useMemo(() => tourSteps.slice(1), [tourSteps]);
  const activeTourSteps =
    activeTourGroup === "tail"
      ? tailTourSteps
      : activeTourGroup === "lead"
        ? leadTourSteps
        : [];
  const activeTourOffset =
    activeTourGroup === "tail" ? UNIFIED_TOUR_BASE_TOTAL : 0;
  const tourTotal = UNIFIED_TOUR_BASE_TOTAL + tailTourSteps.length;
  const activeTourProgress = useMemo(() => {
    if (!activeTourGroup) return null;
    return {
      offset: activeTourOffset,
      total: tourTotal,
    };
  }, [activeTourGroup, activeTourOffset, tourTotal]);

  const persistTourProgress = useCallback(
    (stepIndex: number) => {
      if (!safeLocalStorage.isAvailable()) return;
      safeLocalStorage.setItem(
        UNIFIED_TOUR_STORAGE_KEY,
        JSON.stringify({
          lastStep: activeTourOffset + stepIndex,
          lastTotal: tourTotal,
        }),
      );
    },
    [activeTourOffset, tourTotal],
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
      const { response, data } = await fetchEmotionNoteList(access);
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
    const stored = safeLocalStorage.getItem(UNIFIED_TOUR_STORAGE_KEY);
    const maxStepIndex = tourTotal - 1;
    let progress: TourProgress | null = null;
    if (stored) {
      try {
        progress = JSON.parse(stored) as TourProgress;
      } catch {
        progress = null;
      }
    }

    if (!progress) {
      if (leadTourSteps.length === 0) return;
      setActiveTourGroup("lead");
      setCurrentStep(0);
      setIsTourOpen(true);
      return;
    }

    if (progress.lastStep >= maxStepIndex) return;

    const nextStep = Math.max(
      0,
      Math.min(progress.lastStep + 1, maxStepIndex),
    );
    if (nextStep === 0 && leadTourSteps.length > 0) {
      setActiveTourGroup("lead");
      setCurrentStep(0);
      setIsTourOpen(true);
      return;
    }

    if (
      nextStep >= UNIFIED_TOUR_BASE_TOTAL &&
      nextStep < UNIFIED_TOUR_BASE_TOTAL + tailTourSteps.length &&
      tailTourSteps.length > 0
    ) {
      setActiveTourGroup("tail");
      setCurrentStep(nextStep - UNIFIED_TOUR_BASE_TOTAL);
      setIsTourOpen(true);
    }
  }, [
    access.mode,
    isLoading,
    isTourOpen,
    isAccessLoading,
    canShowOnboarding,
    leadTourSteps.length,
    tailTourSteps.length,
    tourTotal,
    setCurrentStep,
    setIsTourOpen,
    setActiveTourGroup,
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
              canGoDeeper={!isBlocked}
              getDetailHref={(note) => `/detail?id=${note.id}&from=today`}
            />
          )}
        </div>
      </main>
      <OnboardingTour
        steps={activeTourSteps}
        isOpen={isTourOpen}
        setIsOpen={setIsTourOpen}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        progress={activeTourProgress ?? undefined}
        onFinish={handleTourFinish}
        onClose={handleTourClose}
        onMaskClick={handleTourMaskClick}
      />
    </div>
  );
}
