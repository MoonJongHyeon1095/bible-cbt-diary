import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import {
  EMOTION_NOTE_STARTED_KEY,
  HOME_TOUR_STORAGE_KEY,
  LIST_TOUR_STORAGE_KEY,
  UNIFIED_TOUR_STORAGE_KEY,
} from "@/lib/storage/keys/onboarding";

const ONBOARDING_KEYS = [
  UNIFIED_TOUR_STORAGE_KEY,
  HOME_TOUR_STORAGE_KEY,
  LIST_TOUR_STORAGE_KEY,
  EMOTION_NOTE_STARTED_KEY,
] as const;

export const clearOnboardingStorage = () => {
  if (!safeLocalStorage.isAvailable()) return;

  ONBOARDING_KEYS.forEach((key) => {
    safeLocalStorage.removeItem(key);
  });
};
