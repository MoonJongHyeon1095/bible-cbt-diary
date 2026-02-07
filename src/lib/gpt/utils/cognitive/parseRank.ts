import { parseJsonObject } from "../core/json";

export type CognitiveRankItem = {
  index?: number;
  reason?: string;
  evidenceQuote?: string;
};

type CognitiveRankResponseShape = {
  ranked?: CognitiveRankItem[];
};

export function parseCognitiveRankResponse(
  raw: string,
): CognitiveRankItem[] | null {
  const parsed = parseJsonObject<CognitiveRankResponseShape>(raw);
  if (!parsed) return null;
  const arr = parsed.ranked;
  return Array.isArray(arr) ? arr : [];
}
