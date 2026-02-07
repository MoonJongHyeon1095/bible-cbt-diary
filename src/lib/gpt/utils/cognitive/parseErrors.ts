import { parseJsonObject } from "../core/json";

export type CognitiveErrorItem = {
  index?: number;
  analysis?: string;
};

type CognitiveErrorsResponseShape = {
  errors?: CognitiveErrorItem[];
};

export function parseCognitiveErrorsResponse(
  raw: string,
): CognitiveErrorItem[] | null {
  const parsed = parseJsonObject<CognitiveErrorsResponseShape>(raw);
  if (!parsed) return null;
  const arr = parsed.errors;
  return Array.isArray(arr) ? arr : [];
}
