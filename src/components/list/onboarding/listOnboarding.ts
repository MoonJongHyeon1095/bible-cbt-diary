import type { OnboardingStep } from "@/components/onboarding/OnboardingTour";

export function buildListTourSteps(noteCount: number): OnboardingStep[] {
  const steps: OnboardingStep[] = [
    {
      selector: "[data-tour='list-calendar']",
      side: "bottom",
      content: "달력에서 날짜를 선택해 기록을 확인할 수 있어요.",
    },
    {
      selector: "[data-tour='notes-list']",
      side: "top",
      content: "선택한 날짜의 기록 목록은 여기서 확인해요.",
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
