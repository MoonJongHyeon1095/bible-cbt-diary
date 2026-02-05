"use client";

import EmotionNoteTodaySection from "@/components/emotion-notes/EmotionNoteTodaySection";
import { fetchEmotionNotes } from "@/lib/api/emotion-notes/getEmotionNotes";
import { queryKeys } from "@/lib/queryKeys";
import AppHeader from "@/components/header/AppHeader";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useStorageBlockedRedirect } from "@/lib/hooks/useStorageBlockedRedirect";
import type { AccessContext } from "@/lib/types/access";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { safeLocalStorage } from "@/lib/utils/safeStorage";
import { formatKoreanDateTime } from "@/lib/utils/time";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import styles from "@/app/page.module.css";
import { useGate } from "@/components/gate/GateProvider";
import { useQuery } from "@tanstack/react-query";

const TOUR_STORAGE_KEY = "today-onboarding-step";

type TourProgress = {
  lastStep: number;
  lastTotal: number;
};

const Tour = dynamic(() => import("@reactour/tour").then((mod) => mod.Tour), {
  ssr: false,
});

const getTodayLabel = () => {
  return formatKoreanDateTime(new Date(), {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
};

export default function EmotionNoteTodayPage() {
  const { accessMode, accessToken, isLoading: isAccessLoading } =
    useAccessContext();
  const [notes, setNotes] = useState<EmotionNote[]>([]);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [disabledActions, setDisabledActions] = useState(false);
  const { blocker, canShowOnboarding } = useGate();
  const todayLabel = useMemo(() => getTodayLabel(), []);
  const access = useMemo<AccessContext>(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );
  const tourSteps = useMemo(() => {
    const steps = [
      {
        selector: "[data-tour='new-note']",
        content: "버튼을 누르면 기록을 위한 세션이 시작됩니다.",
      },
      {
        selector: "[data-tour='notes-list']",
        content: "오늘 기록 목록은 이곳에서 볼 수 있습니다.",
      },
    ];

    if (notes.length > 0) {
      steps.push(
        {
          selector: "[data-tour='note-card']",
          content: "카드를 누르면 상세 페이지로 이동합니다.",
        },
        {
          selector: "[data-tour='note-card']",
          content:
            "카드를 길게 눌러보십시오. 이 기록에 대해 더 많은 작업을 할 수 있습니다.",
        },
      );
    }

    return steps;
  }, [notes.length]);

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
  }, [blocker, isTourOpen]);

  useEffect(() => {
    if (!safeLocalStorage.isAvailable()) return;
    if (access.mode === "blocked" || isLoading || isAccessLoading) return;
    if (!canShowOnboarding) return;
    if (isTourOpen) return;
    const stored = safeLocalStorage.getItem(TOUR_STORAGE_KEY);
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
  ]);

  const persistTourProgress = (stepIndex: number) => {
    if (!safeLocalStorage.isAvailable()) return;
    safeLocalStorage.setItem(
      TOUR_STORAGE_KEY,
      JSON.stringify({
        lastStep: stepIndex,
        lastTotal: tourSteps.length,
      }),
    );
  };

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
      {isTourOpen ? (
        <Tour
          steps={tourSteps}
          isOpen={isTourOpen}
          setIsOpen={setIsTourOpen}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          disabledActions={disabledActions}
          setDisabledActions={setDisabledActions}
          showCloseButton={false}
          components={{
            Close: () => null,
          }}
          nextButton={({
            Button,
            currentStep: nextStepIndex,
            setCurrentStep: setTourStepIndex,
            setIsOpen,
            stepsLength,
          }) => {
            const lastStepIndex = Math.max(0, stepsLength - 1);
            const isLastStep = nextStepIndex >= lastStepIndex;
            return (
              <Button
                kind="next"
                hideArrow={isLastStep}
                onClick={() => {
                  if (isLastStep) {
                    persistTourProgress(lastStepIndex);
                    setIsOpen(false);
                    return;
                  }
                  setTourStepIndex(nextStepIndex + 1);
                }}
              >
                {isLastStep ? <Check size={16} strokeWidth={2.4} /> : null}
              </Button>
            );
          }}
          onClickClose={({ currentStep: step, setIsOpen }) => {
            persistTourProgress(step);
            setIsOpen(false);
          }}
          onClickMask={({ currentStep: step, setIsOpen }) => {
            persistTourProgress(step);
            setIsOpen(false);
          }}
          styles={{
            popover: (base) => ({
              ...base,
              borderRadius: 16,
              background: "rgba(22, 26, 33, 0.96)",
              color: "#e6e7ea",
              border: "1px solid rgba(143, 167, 200, 0.24)",
              boxShadow:
                "0 18px 40px rgba(8, 9, 12, 0.65), 0 0 0 1px rgba(255,255,255,0.04) inset",
              padding: "28px 18px 16px",
              overflow: "visible",
            }),
            badge: (base) => ({
              ...base,
              background: "#f2c96d",
              color: "#0f1114",
              fontWeight: 700,
              boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
            }),
            dot: (base, state) => ({
              ...base,
              width: 6,
              height: 6,
              margin: "0 4px",
              background: state?.current ? "#f2c96d" : "rgba(255,255,255,0.25)",
            }),
            arrow: (base) => ({
              ...base,
              color: "rgba(22, 26, 33, 0.96)",
            }),
            maskArea: (base) => ({
              ...base,
              rx: 16,
              ry: 16,
            }),
            highlightedArea: (base) => ({
              ...base,
              boxShadow: "0 0 0 9999px rgba(5, 7, 10, 0.7)",
              borderRadius: 16,
              border: "1px solid rgba(242, 201, 109, 0.55)",
            }),
            navigation: (base) => ({
              ...base,
              marginTop: 16,
            }),
            button: (base) => ({
              ...base,
              background: "rgba(143, 167, 200, 0.18)",
              color: "#e6e7ea",
              borderRadius: 999,
              padding: "6px 12px",
              fontWeight: 600,
              border: "1px solid rgba(143, 167, 200, 0.25)",
            }),
          }}
        />
      ) : null}
    </div>
  );
}
