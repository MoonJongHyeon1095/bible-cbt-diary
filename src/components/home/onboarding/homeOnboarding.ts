import type { OnboardingStep } from "@/components/onboarding/OnboardingTour";

export const HOME_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    selector: "[data-tour='home-mood-toggle']",
    side: "bottom",
    content: "표정을 먼저 고르면 다음 단계에서 감정을 선택할 수 있어요.",
  },
];
