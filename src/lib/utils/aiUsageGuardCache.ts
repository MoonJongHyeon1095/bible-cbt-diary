"use client";

export type UsageCacheEntry = {
  allowed: boolean;
  checkedAt: number;
  message?: string;
};

export const AI_USAGE_GUARD_CACHE_KEY = "aiUsageGuard:last";

let cachedUsage: UsageCacheEntry | null = null;

export const readAiUsageGuardCache = (): UsageCacheEntry | null => {
  if (cachedUsage) return cachedUsage;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(AI_USAGE_GUARD_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UsageCacheEntry;
    if (
      typeof parsed?.allowed !== "boolean" ||
      typeof parsed?.checkedAt !== "number"
    ) {
      return null;
    }
    cachedUsage = parsed;
    return parsed;
  } catch {
    return null;
  }
};

export const writeAiUsageGuardCache = (entry: UsageCacheEntry) => {
  cachedUsage = entry;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      AI_USAGE_GUARD_CACHE_KEY,
      JSON.stringify(entry),
    );
  } catch {
    // Ignore storage errors (private mode, quota, etc.).
  }
};

export const clearAiUsageGuardCache = () => {
  cachedUsage = null;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(AI_USAGE_GUARD_CACHE_KEY);
  } catch {
    // Ignore storage errors (private mode, quota, etc.).
  }
};
