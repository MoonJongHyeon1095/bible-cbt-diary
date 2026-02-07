import { parseJsonObject } from "../json";

export type DeepContextResponseShape = {
  salient?: unknown;
  cbt?: unknown;
  deep?: unknown;
  openQuestions?: unknown;
  nextStepHint?: unknown;
};

export function parseDeepContextResponse(
  raw: string,
): DeepContextResponseShape | null {
  return parseJsonObject<DeepContextResponseShape>(raw);
}
