import { COGNITIVE_BEHAVIORS } from "@/lib/constants/behaviors";
import { EMOTIONS } from "@/lib/constants/emotions";
import { COGNITIVE_ERRORS } from "@/lib/constants/errors";

const EMOTION_BY_LABEL = new Map<string, (typeof EMOTIONS)[number]>(
  EMOTIONS.map((emotion) => [emotion.label, emotion])
);

const COGNITIVE_ERROR_BY_TITLE = new Map<
  string,
  (typeof COGNITIVE_ERRORS)[number]
>(COGNITIVE_ERRORS.map((error) => [error.title, error]));

const COGNITIVE_BEHAVIOR_BY_LABEL = new Map<
  string,
  (typeof COGNITIVE_BEHAVIORS)[number]
>(
  COGNITIVE_BEHAVIORS.flatMap((behavior) => [
    [behavior.replacement_title, behavior],
    [behavior.title, behavior],
  ])
);

export type PopoverAlign = "start" | "center" | "end";

export function getEmotionMeta(label?: string) {
  if (!label) return undefined;
  return EMOTION_BY_LABEL.get(label);
}

export function getCognitiveErrorMeta(label?: string) {
  if (!label) return undefined;
  return COGNITIVE_ERROR_BY_TITLE.get(label);
}

export function getBehaviorMeta(label?: string) {
  if (!label) return undefined;
  return COGNITIVE_BEHAVIOR_BY_LABEL.get(label);
}
