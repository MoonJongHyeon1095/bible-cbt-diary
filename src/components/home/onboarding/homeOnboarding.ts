import type { OnboardingStep } from "@/components/onboarding/OnboardingTour";

export const HOME_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    selector: "[data-tour='home-emotion-grid']",
    side: "bottom",
    content: "감정 칩을 누르면 바로 세션이 시작돼요.",
    completeOnTargetClick: true,
  },
];
