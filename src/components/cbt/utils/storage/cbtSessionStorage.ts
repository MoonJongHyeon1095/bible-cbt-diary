import { safeSessionStorage } from "@/lib/utils/safeStorage";

const CBT_SESSION_KEYS = [
  "cbt_saved_error_keys",
  "cbt_saved_alternative_keys",
  "cbt_saved_behavior_keys",
  "cbt_saved_detail_keys",
  "cbt_active_note",
] as const;

export function clearCbtSessionStorage() {
  try {
    CBT_SESSION_KEYS.forEach((key) => safeSessionStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}
