export type AutoThoughtCacheEntry = {
  thoughts: Array<{ belief: string; emotionReason: string }>;
  index: number;
  hasShownCustomPrompt: boolean;
};

const AUTO_THOUGHT_STORAGE_PREFIX = "minimal-auto-thoughts:";
const autoThoughtCache = new Map<string, AutoThoughtCacheEntry>();

export function getAutoThoughtCache(cacheKey: string) {
  const cached = autoThoughtCache.get(cacheKey);
  if (cached) return cached;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(
      `${AUTO_THOUGHT_STORAGE_PREFIX}${cacheKey}`,
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
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `${AUTO_THOUGHT_STORAGE_PREFIX}${cacheKey}`,
      JSON.stringify(entry),
    );
  } catch {
    /* ignore */
  }
}

export function clearAutoThoughtCache() {
  autoThoughtCache.clear();
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(AUTO_THOUGHT_STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}
