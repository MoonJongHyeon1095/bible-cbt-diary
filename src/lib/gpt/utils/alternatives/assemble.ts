import { cleanText } from "../core/text";
import {
  TECHNIQUES,
  normalizeTechnique,
  toResultByTechnique,
  type AlternativeThought,
  type TechniqueType,
} from "./meta";

type RawAlternativeItem = {
  technique?: unknown;
  thought?: unknown;
};

export function assembleAlternatives(
  items: RawAlternativeItem[] | null | undefined,
): { result: AlternativeThought[]; usedFallback: boolean } {
  const arr = Array.isArray(items) ? items : [];
  const byTechnique: Partial<Record<TechniqueType, string>> = {};
  const usedThoughts = new Set<string>();

  for (const item of arr) {
    const technique = normalizeTechnique(item?.technique);
    const t = cleanText(item?.thought);
    if (!technique || !t) continue;
    if (usedThoughts.has(t)) continue;
    usedThoughts.add(t);
    byTechnique[technique] = t;
  }

  const usedFallback = TECHNIQUES.some((tech) => !byTechnique[tech.technique]);
  const result = toResultByTechnique(byTechnique);
  return { result, usedFallback };
}
