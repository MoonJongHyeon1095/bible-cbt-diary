import { safeSessionStorage } from "@/lib/storage/core/safeStorage";
import { CBT_SESSION_KEYS } from "@/lib/storage/keys/session";

export function clearCbtSessionStorage() {
  try {
    CBT_SESSION_KEYS.forEach((key) => safeSessionStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}
