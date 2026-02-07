import { cleanText } from "../core/text";
import { defaultRank, isValidIndex, type CognitiveErrorRankResult } from "./rankMeta";

type RawCognitiveRankItem = {
  index?: unknown;
  reason?: unknown;
  evidenceQuote?: unknown;
};

export function normalizeCognitiveRank(
  items: RawCognitiveRankItem[] | null | undefined,
): CognitiveErrorRankResult {
  const arr = Array.isArray(items) ? items : [];
  const seen = new Set<number>();
  const ranked: CognitiveErrorRankResult["ranked"] = [];

  for (const item of arr) {
    const idx = item?.index;
    if (!isValidIndex(idx)) continue;
    if (seen.has(idx)) continue;

    seen.add(idx);

    const reason =
      cleanText(item?.reason) || "가능성을 평가했지만 근거가 제한적입니다.";
    const evidenceQuote = cleanText(item?.evidenceQuote);

    ranked.push({
      index: idx,
      reason,
      ...(evidenceQuote ? { evidenceQuote } : {}),
    });
  }

  if (ranked.length !== 10) return defaultRank();
  return { ranked };
}
