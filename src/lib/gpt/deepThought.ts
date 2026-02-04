// src/lib/gpt/deepThought.ts
import { callGptText } from "./client";
import { DeepInternalContext, formatDeepInternalContext } from "./deepContext";
import type { DeepNoteContext, SDTKey } from "./deepThought.types";
import { normalizeStringArray } from "./utils/array";
import { normalizeTextValue } from "./utils/text";
import { parseSdtResponse } from "./utils/llm/sdtThoughts";
import { markAiFallback } from "@/lib/utils/aiFallback";

export type DeepAutoThoughtResult = {
  sdt: Record<
    SDTKey,
    {
      belief: [string, string, string]; // EXACTLY 3 Korean sentences
      emotion_reason: string; // EXACTLY 1 Korean sentence
    }
  >;
};

type LlmThoughtItem = {
  belief?: unknown;
  emotion_reason?: unknown;
};

/**
 * Deep SDT automatic thoughts prompt
 * - Keep the "minimal session" automatic-thought style
 * - Inputs: main/sub notes + internal English pattern summary
 * - Output: Korean JSON only
 */
const SYSTEM_PROMPT = `
You are a CBT (Cognitive Behavioral Therapy) counselor who answers in Korean.

The input includes:
- [User Input] (current wording)
- [Emotion]
- [Main Note] (primary context)
- [Sub Notes] (supporting contexts, latest-first, max 2)
- [Internal Context - English] (keyword anchors for grounding)

our goals:
- Based on the situation the user experienced and the emotion they selected, your job is to articulate the hidden "underlying thought (automatic thought)" in clear sentences.
- Focus only on revealing the "core claim" that makes the user feel the selected emotion right now.

Important rules:
- Must be written in Korean, as a natural first-person automatic thought. (e.g., "나는 …다", "분명 …일 것이다")
- Consider the SDT perspectives (autonomy / relatedness / competence), generate 3 items.
- Use Internal Context as the PRIMARY anchor. Use note text as SECONDARY support.
- Do NOT introduce new assumptions beyond Internal Context + Notes.

Writing style (same spirit as the minimal session):
- Write in natural Korean, first-person automatic-thought voice.
- Do not narrate events; write the interpretation / belief / rule inferred from them.
- Not surface-level: make the negative meaning / feared outcome explicit.
- Keep it tied to the present context (relationship / performance / control) rather than vague life philosophy.
- Let the selected emotion shape the wording.

Per-item requirements:
1) belief 
- Must be an array of EXACTLY 3 Korean sentences.
- Sentence 1~2: the hidden core claim / belief / viewpoint  (card-ready).
- Sentence 3: the feared consequence / meaning / rule that follows from it.
- Not a surface-level thought: make the negative belief/meaning/interpretation/feared outcome explicit.
- Avoid vague life-philosophy statements. Keep it tightly connected to the current situation and relationship context.
- Do NOT copy or restate the situation text; write a one-step-generalized belief/rule inferred from it.
- Reflect the emotion label in the wording.

2) emotion_reason
- one sentence explaining why the above belief creates the current emotion, referencing the selected emotion. 
- Write only as supporting explanation to understand the belief.

Output requirements:
- Output JSON only (no extra text).
- All strings MUST be Korean.
- Generate exactly 1 item for each: relatedness, competence, autonomy.

Output schema (exactly):
{
  "sdt": {
    "relatedness": [
      { "belief": ["...", "...", "..."], "emotion_reason": "..." }
    ],
    "competence": [
      { "belief": ["...", "...",  "..."], "emotion_reason": "..." }
    ],
    "autonomy": [
      { "belief": ["...", "...", "..."], "emotion_reason": "..." }
    ]
  }
}
`.trim();

// ----------------------
// helpers
// ----------------------
function toThreeSentencesArray(v: unknown): [string, string, string] | null {
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

function normalizeThoughtItem(
  v: unknown,
): { belief: [string, string, string]; emotion_reason: string } | null {
  if (!v || typeof v !== "object") return null;
  const obj = v as LlmThoughtItem;

  const belief = toThreeSentencesArray(obj.belief);
  const emotion_reason = normalizeTextValue(obj.emotion_reason);

  if (!belief || !emotion_reason) return null;
  return { belief, emotion_reason };
}

function formatNote(note: DeepNoteContext) {
  const emotions = note.emotions.filter(Boolean).join(", ");
  const thoughts = note.automaticThoughts.filter(Boolean).join(" / ");
  const errors = note.cognitiveErrors
    .map((err) => (err.detail ? `${err.title}: ${err.detail}` : err.title))
    .filter(Boolean)
    .join(" / ");
  const alternatives = note.alternatives.filter(Boolean).join(" / ");

  return `- id: ${note.id}
- trigger: ${note.triggerText}
- emotions: ${emotions}
- automatic_thoughts: ${thoughts}
- cognitive_errors: ${errors}
- alternatives: ${alternatives}`.trim();
}

const FALLBACK: Record<
  SDTKey,
  { belief: [string, string, string]; emotion_reason: string }
> = {
  relatedness: {
    belief: [
      "나는 내 마음을 드러내면 상대가 나를 부담스러워할 거라고 느낀다.",
      "그래서 상대가 나를 멀리할 거라고 믿는다.",
      "그러면 결국 나는 이해받지 못하고 더 멀어질 것 같아 두렵다.",
    ],
    emotion_reason: "그래서 지금 감정이 더 크게 느껴진다.",
  },
  competence: {
    belief: [
      "나는 기대를 충족하지 못하면 곧바로 무가치해질 것 같다고 믿는다.",
      "내 가치는 내가 성취하는 것으로만 결정된다고 생각한다.",
      "그래서 작은 흔들림도 실패로 이어질 것 같아 불안해진다.",
    ],
    emotion_reason: "그래서 지금 감정이 더 크게 느껴진다.",
  },
  autonomy: {
    belief: [
      "나는 상황이 내 의지와 상관없이 흘러가고 있다고 느낀다.",
      "그래서 내가 선택할 여지가 거의 없다고 생각한다.",
      "그래서 결국 나는 끌려다니며 더 나빠질 것 같아 답답하다.",
    ],
    emotion_reason: "그래서 지금 감정이 더 크게 느껴진다.",
  },
};

function pickFirstItem(arr: unknown): unknown {
  return Array.isArray(arr) ? arr[0] : null;
}

// ----------------------
// main API
// ----------------------
export async function generateDeepSdtAutomaticThoughts(
  userInput: string,
  emotion: string,
  main: DeepNoteContext,
  subs: DeepNoteContext[],
  internal: DeepInternalContext,
): Promise<DeepAutoThoughtResult> {
  const subs2 = subs.slice(0, 2);

  const prompt = `
[User Input]
${userInput}

[Emotion]
${emotion}

[Main Note]
${formatNote(main)}

[Sub Notes] (latest first, max 2)
${subs2.map(formatNote).join("\n\n") || "(none)"}

[Internal Context - English]
${formatDeepInternalContext(internal)}
`.trim();

  let usedFallback = false;
  try {
    const raw = await callGptText(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
    });

    const parsed = parseSdtResponse(raw);
    if (!parsed) throw new Error("No JSON object in LLM output");

    const sdt = (parsed ?? {}) as Partial<Record<SDTKey, unknown>>;

    // schema expects arrays with 1 object each
    const relCandidate = normalizeThoughtItem(pickFirstItem(sdt.relatedness));
    const comCandidate = normalizeThoughtItem(pickFirstItem(sdt.competence));
    const autCandidate = normalizeThoughtItem(pickFirstItem(sdt.autonomy));
    const relItem = relCandidate ?? FALLBACK.relatedness;
    const comItem = comCandidate ?? FALLBACK.competence;
    const autItem = autCandidate ?? FALLBACK.autonomy;
    usedFallback = !relCandidate || !comCandidate || !autCandidate;

    const result = {
      sdt: {
        relatedness: relItem,
        competence: comItem,
        autonomy: autItem,
      },
    };
    return usedFallback ? markAiFallback(result, "partial") : result;
  } catch (error) {
    console.error("deep sdt automatic thoughts error:", error);
    return markAiFallback({
      sdt: {
        relatedness: FALLBACK.relatedness,
        competence: FALLBACK.competence,
        autonomy: FALLBACK.autonomy,
      },
    });
  }
}
