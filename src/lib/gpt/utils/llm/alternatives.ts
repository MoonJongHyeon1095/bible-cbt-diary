import { parseJsonObject } from "../json";

export type AlternativeItem = {
  technique?: string;
  thought?: string;
};

type AlternativesResponseShape = {
  result?: {
    alternatives?: AlternativeItem[];
  };
  alternatives?: AlternativeItem[];
};

export function parseAlternativesResponse(
  raw: string,
): AlternativeItem[] | null {
  const parsed = parseJsonObject<AlternativesResponseShape>(raw);
  if (!parsed) return null;

  const arr = parsed.result?.alternatives ?? parsed.alternatives;
  return Array.isArray(arr) ? arr : [];
}
