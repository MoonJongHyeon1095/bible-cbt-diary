import { parseJsonObject } from "../core/json";

export type DeepContextResponseShape = {
  salient?: unknown;
  cbt?: unknown;
  deep?: unknown;
};

export function parseDeepContextResponse(
  raw: string,
): DeepContextResponseShape | null {
  return parseJsonObject<DeepContextResponseShape>(raw);
}
