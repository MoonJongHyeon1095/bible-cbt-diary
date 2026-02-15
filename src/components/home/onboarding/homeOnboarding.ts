import type { OnboardingStep } from "@/components/onboarding/OnboardingTour";
import { MINIMAL_TOUR_STEPS_BY_FLOW } from "@/components/onboarding/unifiedOnboarding";

export const HOME_ONBOARDING_STEPS_BY_STEP: Record<
  "mood" | "emotion",
  OnboardingStep[]
> = {
  mood: MINIMAL_TOUR_STEPS_BY_FLOW.mood,
  emotion: MINIMAL_TOUR_STEPS_BY_FLOW.emotion,
};
