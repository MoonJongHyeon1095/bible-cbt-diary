import { parseJsonObject } from "../core/json";
import type { DeepMontageScenario } from "../../deepMontageScenario";

export function parseDeepMontageScenarioResponse(
  raw: string,
): DeepMontageScenario | null {
  const parsed = parseJsonObject<DeepMontageScenario>(raw);
  if (parsed) return parsed;
  return {
    atoms: [],
    montage: { caption: "", sequence: [] },
    freezeFrames: [],
  };
}
