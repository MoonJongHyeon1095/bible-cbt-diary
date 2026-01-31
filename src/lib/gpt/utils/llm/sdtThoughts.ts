import { parseJsonObject } from "../json";

export type SdtResponseShape = {
  sdt?: unknown;
};

export function parseSdtResponse(raw: string): unknown | null {
  const parsed = parseJsonObject<SdtResponseShape>(raw);
  if (!parsed) return null;
  return parsed.sdt ?? null;
}
