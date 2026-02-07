import { cleanText } from "../core/text";
import { fallbackCognitiveErrorDetail } from "./detailFallback";
import { isValidIndex, type ErrorIndex } from "./rankMeta";

type RawCognitiveDetailItem = {
  index?: unknown;
  analysis?: unknown;
};

export function normalizeCognitiveErrorDetails(
  items: RawCognitiveDetailItem[] | null | undefined,
  candidates: ErrorIndex[],
): { errors: Array<{ index: ErrorIndex; analysis: string }>; usedFallback: boolean } {
  const arr = Array.isArray(items) ? items : [];
  const seen = new Set<number>();
  const errors: Array<{ index: ErrorIndex; analysis: string }> = [];

  for (const item of arr) {
    const idx = item?.index;
    const a = cleanText(item?.analysis);

    if (!isValidIndex(idx)) continue;
    if (!candidates.includes(idx)) continue;
    if (seen.has(idx)) continue;
    if (!a) continue;

    seen.add(idx);
    errors.push({ index: idx, analysis: a });
  }

  const missing = candidates.filter((c) => !errors.some((e) => e.index === c));
  let usedFallback = false;
  if (missing.length > 0) {
    usedFallback = true;
    errors.push(...fallbackCognitiveErrorDetail(missing).errors);
  }

  errors.sort((a, b) => candidates.indexOf(a.index) - candidates.indexOf(b.index));
  return { errors, usedFallback };
}
