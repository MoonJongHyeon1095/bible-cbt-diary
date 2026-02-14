"use client";

import { useOnboardingDriver } from "./hooks/useOnboardingDriver";
import type { OnboardingStep, OnboardingTourProps } from "./types";

export type { OnboardingStep, OnboardingTourProps };

export default function OnboardingTour(props: OnboardingTourProps) {
  useOnboardingDriver(props);
  return null;
}

