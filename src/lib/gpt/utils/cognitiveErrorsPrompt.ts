import {
  COGNITIVE_ERRORS_EN,
  type CognitiveErrorIndex,
} from "../../constants/errors";

export function formatCognitiveErrorsReference(): string {
  return COGNITIVE_ERRORS_EN
    .map((err) => `${err.index}. ${err.title}: ${err.description}`)
    .join("\n");
}

export function formatCognitiveErrorsReferenceForCandidates(
  candidates: CognitiveErrorIndex[],
): string {
  const set = new Set<CognitiveErrorIndex>(candidates);
  return COGNITIVE_ERRORS_EN
    .filter((err) => set.has(err.index))
    .map((err) => `${err.index}. ${err.title}: ${err.description}`)
    .join("\n");
}
