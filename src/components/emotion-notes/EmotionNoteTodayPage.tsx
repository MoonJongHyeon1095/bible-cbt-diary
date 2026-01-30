"use client";

import RequireLoginPrompt from "@/components/common/RequireLoginPrompt";
import EmotionNoteTodaySection from "@/components/emotion-notes/EmotionNoteTodaySection";
import { fetchEmotionNotes } from "@/components/emotion-notes/utils/emotionNotesListApi";
import AppHeader from "@/components/header/AppHeader";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import type { AccessContext } from "@/lib/types/access";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { formatKoreanDateTime } from "@/lib/utils/time";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "@/app/page.module.css";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [disabledActions, setDisabledActions] = useState(false);
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

  const fetchNotes = useCallback(async () => {
    if (access.mode === "blocked") {
      setNotes([]);
      return;
    }
    const { response, data } = await fetchEmotionNotes(access);
    if (!response.ok) {
      setNotes([]);
      return;
    }
    setNotes(data.notes ?? []);
  }, [access]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchNotes();
      setIsLoading(false);
    };
    load();
  }, [fetchNotes, accessMode, accessToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (access.mode === "blocked" || isLoading || isAccessLoading) return;
    if (isTourOpen) return;
    const stored = window.localStorage.getItem(TOUR_STORAGE_KEY);
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
  }, [access.mode, isLoading, isTourOpen, isAccessLoading, tourSteps.length]);

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          {isAccessLoading ? null : accessMode === "blocked" ? (
            <RequireLoginPrompt />
          ) : (
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
          showCloseButton
          components={{
            Close: ({ onClick }) => (
              <button
                type="button"
                onClick={onClick}
                aria-label="온보딩 닫기"
                style={{
                  position: "absolute",
                  top: -10,
                  right: 10,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 999,
                  background: "rgba(22, 26, 33, 0.96)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
                  cursor: "pointer",
                }}
              >
                닫기
              </button>
            ),
          }}
          onClickClose={({ currentStep: step, setIsOpen }) => {
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                TOUR_STORAGE_KEY,
                JSON.stringify({
                  lastStep: step,
                  lastTotal: tourSteps.length,
                }),
              );
            }
            setIsOpen(false);
          }}
          onClickMask={({ currentStep: step, setIsOpen }) => {
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                TOUR_STORAGE_KEY,
                JSON.stringify({
                  lastStep: step,
                  lastTotal: tourSteps.length,
                }),
              );
            }
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
            close: (base) => ({
              ...base,
              color: "#ffffff",
              background: "rgba(22, 26, 33, 0.96)",
              borderRadius: 999,
              width: 26,
              height: 26,
              right: 10,
              top: -10,
              boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              zIndex: 3,
              opacity: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
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
