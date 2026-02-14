import { safeSessionStorage } from "@/lib/storage/core/safeStorage";
import {
  MINIMAL_AUTO_THOUGHT_STORAGE_PREFIX,
} from "@/lib/storage/keys/session";

export type AutoThoughtCacheEntry = {
  thoughts: Array<{ belief: string; emotionReason: string }>;
  index: number;
  hasShownCustomPrompt: boolean;
  isFallback?: boolean;
};

const autoThoughtCache = new Map<string, AutoThoughtCacheEntry>();

export function getAutoThoughtCache(cacheKey: string) {
  const cached = autoThoughtCache.get(cacheKey);
  if (cached) return cached;
  try {
    const raw = safeSessionStorage.getItem(
      `${MINIMAL_AUTO_THOUGHT_STORAGE_PREFIX}${cacheKey}`,
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as
      | AutoThoughtCacheEntry
      | {
          thoughts?: string[];
          index?: number;
          hasShownCustomPrompt?: boolean;
        };
    const thoughts = Array.isArray(parsed?.thoughts) ? parsed.thoughts : [];
    if (!thoughts.length) return null;
    const normalized =
      typeof thoughts[0] === "string"
        ? {
            thoughts: (thoughts as string[]).map((thought) => ({
              belief: thought,
              emotionReason: "",
            })),
            index: parsed.index ?? 0,
            hasShownCustomPrompt: parsed.hasShownCustomPrompt ?? false,
            isFallback: false,
          }
        : (parsed as AutoThoughtCacheEntry);
    autoThoughtCache.set(cacheKey, normalized);
    return normalized;
  } catch {
    return null;
  }
}

export function setAutoThoughtCache(
  cacheKey: string,
  entry: AutoThoughtCacheEntry,
) {
  autoThoughtCache.set(cacheKey, entry);
  try {
    safeSessionStorage.setItem(
      `${MINIMAL_AUTO_THOUGHT_STORAGE_PREFIX}${cacheKey}`,
      JSON.stringify(entry),
    );
  } catch {
    /* ignore */
  }
}

export function clearAutoThoughtCache() {
  autoThoughtCache.clear();
  try {
    const keys: string[] = [];
    for (let i = 0; i < safeSessionStorage.length; i += 1) {
      const key = safeSessionStorage.key(i);
      if (key && key.startsWith(MINIMAL_AUTO_THOUGHT_STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach((key) => safeSessionStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}
