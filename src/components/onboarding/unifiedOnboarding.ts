import type { MinimalStep } from "@/components/session/hooks/useCbtMinimalSessionFlow";
import type { OnboardingStep } from "@/components/onboarding/OnboardingTour";
import { UNIFIED_TOUR_STORAGE_KEY as UNIFIED_ONBOARDING_KEY } from "@/lib/storage/keys/onboarding";

export const UNIFIED_TOUR_STORAGE_KEY = UNIFIED_ONBOARDING_KEY;

export const MINIMAL_TOUR_STEP_ORDER: MinimalStep[] = [
  "incident",
  "thought",
  "errors",
  "alternative",
];

export const MINIMAL_TOUR_STEPS_BY_FLOW: Record<MinimalStep, OnboardingStep[]> =
  {
    incident: [
      {
        selector: "[data-tour='minimal-incident-input']",
        side: "bottom",
        content: "오늘 있었던 일을 간단히 적어주세요.",
      },
      {
        selector: "[data-tour='minimal-incident-example']",
        side: "bottom",
        content: "직접 쓰시거나 예시를 살짝 보실 수도 있어요.",
      },
      {
        selector: "[data-tour='minimal-incident-next']",
        side: "bottom",
        content: "이 이야기를 바탕으로 다음 단계로 넘어가요.",
      },
    ],
    thought: [
      {
        selector: "[data-tour='minimal-thought-carousel']",
        side: "bottom",
        content: "감정을 불러일으킨 생각을 찾아볼까요?",
      },
      {
        selector: "[data-tour='minimal-thought-next']",
        side: "bottom",
        content: "지금 고른 생각을 같이 탐구해봐요.",
      },
    ],
    errors: [],
    alternative: [],
  };

export const MINIMAL_TOUR_TOTAL = MINIMAL_TOUR_STEP_ORDER.reduce(
  (total, step) => total + MINIMAL_TOUR_STEPS_BY_FLOW[step].length,
  0,
);

export const UNIFIED_TOUR_BASE_TOTAL = 1 + MINIMAL_TOUR_TOTAL;

export const getMinimalTourOffset = (step: MinimalStep) => {
  let offset = 0;
  for (const key of MINIMAL_TOUR_STEP_ORDER) {
    if (key === step) break;
    offset += MINIMAL_TOUR_STEPS_BY_FLOW[key].length;
  }
  return offset;
};
