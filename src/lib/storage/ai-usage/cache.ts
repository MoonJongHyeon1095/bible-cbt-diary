"use client";

import { safeSessionStorage } from "@/lib/storage/core/safeStorage";
import { AI_USAGE_GUARD_CACHE_KEY } from "@/lib/storage/keys/aiUsage";
export { AI_USAGE_GUARD_CACHE_KEY } from "@/lib/storage/keys/aiUsage";

export type UsageCacheEntry = {
  allowed: boolean;
  checkedAt: number;
  message?: string;
};

let cachedUsage: UsageCacheEntry | null = null;

export const readAiUsageGuardCache = (): UsageCacheEntry | null => {
  if (cachedUsage) return cachedUsage;
  try {
    const raw = safeSessionStorage.getItem(AI_USAGE_GUARD_CACHE_KEY);
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
  try {
    safeSessionStorage.setItem(
      AI_USAGE_GUARD_CACHE_KEY,
      JSON.stringify(entry),
    );
  } catch {
    // Ignore storage errors (private mode, quota, etc.).
  }
};

export const clearAiUsageGuardCache = () => {
  cachedUsage = null;
  try {
    safeSessionStorage.removeItem(AI_USAGE_GUARD_CACHE_KEY);
  } catch {
    // Ignore storage errors (private mode, quota, etc.).
  }
};
