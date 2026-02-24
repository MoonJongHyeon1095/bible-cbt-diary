import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import {
  DEEP_SESSION_ONBOARDING_COMPLETE_KEY,
  DEEP_SESSION_ONBOARDING_PREFIX,
  EMOTION_NOTE_STARTED_KEY,
  HOME_TOUR_STORAGE_KEY,
  LIST_TOUR_STORAGE_KEY,
  UNIFIED_TOUR_STORAGE_KEY,
} from "@/lib/storage/keys/onboarding";

const ONBOARDING_KEYS = [
  UNIFIED_TOUR_STORAGE_KEY,
  HOME_TOUR_STORAGE_KEY,
  LIST_TOUR_STORAGE_KEY,
  DEEP_SESSION_ONBOARDING_COMPLETE_KEY,
  EMOTION_NOTE_STARTED_KEY,
] as const;

export const clearOnboardingStorage = () => {
  if (!safeLocalStorage.isAvailable()) return;

  ONBOARDING_KEYS.forEach((key) => {
    safeLocalStorage.removeItem(key);
  });

  for (let index = safeLocalStorage.length - 1; index >= 0; index -= 1) {
    const key = safeLocalStorage.key(index);
    if (!key) continue;
    if (!key.startsWith(`${DEEP_SESSION_ONBOARDING_PREFIX}:`)) continue;
    safeLocalStorage.removeItem(key);
  }
};
