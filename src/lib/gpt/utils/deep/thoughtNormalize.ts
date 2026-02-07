import { normalizeStringArray } from "../core/array";
import { normalizeTextValue } from "../core/text";

type LlmThoughtItem = {
  belief?: unknown;
  emotion_reason?: unknown;
};

export function toThreeSentencesArray(
  v: unknown,
): [string, string, string] | null {
  const arr = normalizeStringArray(v);
  if (arr.length >= 3) return [arr[0], arr[1], arr[2]];
  if (arr.length === 2)
    return [arr[0], arr[1], "그래서 결국 더 불안해질 것 같다고 느낀다."];
  if (arr.length === 1)
    return [
      arr[0],
      "그래서 상황이 더 나빠질 것 같다고 생각한다.",
      "그래서 결국 더 불안해질 것 같다고 느낀다.",
    ];
  return null;
}

export function normalizeThoughtItem(
  v: unknown,
): { belief: [string, string, string]; emotion_reason: string } | null {
  if (!v || typeof v !== "object") return null;
  const obj = v as LlmThoughtItem;

  const belief = toThreeSentencesArray(obj.belief);
  const emotion_reason = normalizeTextValue(obj.emotion_reason);

  if (!belief || !emotion_reason) return null;
  return { belief, emotion_reason };
}

export function pickFirstItem(arr: unknown): unknown {
  return Array.isArray(arr) ? arr[0] : null;
}
