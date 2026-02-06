"use client";

import type { OnboardingStep } from "@/components/ui/OnboardingTour";

export const TODAY_TOUR_STORAGE_KEY = "today-onboarding-step";

export function buildTodayTourSteps(noteCount: number): OnboardingStep[] {
  const steps: OnboardingStep[] = [
    {
      selector: "[data-tour='new-note']",
      side: "bottom",
      content: "만나서 반가워요.\n오늘 하루를 기록해볼까요?",
    },
    {
      selector: "[data-tour='notes-list']",
      side: "top",
      content: "오늘 작성한 일기를 여기서 볼 수 있어요.",
    },
  ];

  if (noteCount > 0) {
    steps.push(
      {
        selector: "[data-tour='note-card']",
        side: "top",
        content: "카드를 누르면 기억의 방으로 갈 수 있어요.",
      },
      {
        selector: "[data-tour='note-card']",
        side: "top",
        content:
          "또는 카드를 길게 눌러 주세요.  \n감정과 생각을 더 깊이 살펴볼 수 있어요.",
      },
    );
  }

  return steps;
}
