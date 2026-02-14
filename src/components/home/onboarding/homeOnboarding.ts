import type { OnboardingStep } from "@/components/onboarding/OnboardingTour";

export const HOME_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    selector: "[data-tour='home-new-note']",
    side: "bottom",
    content: "만나서 반가워요.\n오늘 하루를 기록해볼까요?",
    completeOnTargetClick: true,
  },
];
