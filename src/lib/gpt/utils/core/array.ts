import { cleanText } from "./text";

export function normalizeStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(cleanText).filter(Boolean);
}
