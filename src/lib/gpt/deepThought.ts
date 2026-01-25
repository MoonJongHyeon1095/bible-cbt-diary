// src/lib/gpt/deepThought.ts
import { callGptText } from "./client";
import { cleanText, extractJsonObject } from "./cognitiveRank";
import { DeepInternalContext, formatDeepInternalContext } from "./deepContext";
import type { DeepNoteContext, SDTKey } from "./deepThought.types";

export type DeepAutoThoughtResult = {
  sdt: Record<
    SDTKey,
    {
      belief: [string, string]; // EXACTLY 2 Korean sentences
      emotion_reason: string; // EXACTLY 1 Korean sentence
    }
  >;
};

type LlmThoughtItem = {
  belief?: unknown;
  emotion_reason?: unknown;
};

type LlmResponseShape = {
  sdt?: Partial<Record<SDTKey, unknown>>;
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
- [Internal Context - English] (pattern summary to help integration)

Your job:
From the SDT lenses (relatedness / competence / autonomy), generate 3 automatic-thought items.
In this module, the SDT-lens belief itself is the automatic thought.

Writing style (same spirit as the minimal session):
- Write in natural Korean, first-person automatic-thought voice.
- Do not narrate events; write the interpretation / belief / rule inferred from them.
- Not surface-level: make the negative meaning / feared outcome explicit.
- Keep it tied to the present context (relationship / performance / control) rather than vague life philosophy.
- Let the selected emotion shape the wording.

Per-item requirements:
1) belief (EXACT format)
- Must be an array of EXACTLY 2 Korean sentences.
- Sentence 1: the core claim / belief / rule (card-ready), one-step generalized from notes.
- Sentence 2: feared consequence / meaning that follows from sentence 1.
- Do not copy note sentences; infer and rephrase.

2) emotion_reason
- EXACTLY 1 Korean sentence.
- Explain why this belief makes the current emotion strong right now.

Output requirements:
- Output JSON only (no extra text).
- All strings MUST be Korean.
- Generate exactly 1 item for each: relatedness, competence, autonomy.

Output schema (exactly):
{
  "sdt": {
    "relatedness": [
      { "belief": ["...", "..."], "emotion_reason": "..." }
    ],
    "competence": [
      { "belief": ["...", "..."], "emotion_reason": "..." }
    ],
    "autonomy": [
      { "belief": ["...", "..."], "emotion_reason": "..." }
    ]
  }
}
`.trim();

// ----------------------
// helpers
// ----------------------
function normalizeTextValue(v: unknown): string {
  return typeof v === "string" ? cleanText(v) : "";
}

function normalizeStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(cleanText).filter(Boolean);
}

function toTwoSentencesArray(v: unknown): [string, string] | null {
  const arr = normalizeStringArray(v);
  if (arr.length >= 2) return [arr[0], arr[1]];
  if (arr.length === 1) return [arr[0], "그래서 지금 감정이 더 크게 느껴진다."];
  return null;
}

function normalizeThoughtItem(
  v: unknown,
): { belief: [string, string]; emotion_reason: string } | null {
  if (!v || typeof v !== "object") return null;
  const obj = v as LlmThoughtItem;

  const belief = toTwoSentencesArray(obj.belief);
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
  { belief: [string, string]; emotion_reason: string }
> = {
  relatedness: {
    belief: [
      "나는 내 마음을 드러내면 상대가 나를 부담스러워할 거라고 느낀다.",
      "그러면 결국 나는 이해받지 못하고 더 멀어질 것 같아 두렵다.",
    ],
    emotion_reason: "그래서 지금 감정이 더 크게 느껴진다.",
  },
  competence: {
    belief: [
      "나는 기대를 충족하지 못하면 곧바로 무가치해질 것 같다고 믿는다.",
      "그래서 작은 흔들림도 실패로 이어질 것 같아 불안해진다.",
    ],
    emotion_reason: "그래서 지금 감정이 더 크게 느껴진다.",
  },
  autonomy: {
    belief: [
      "나는 상황이 내 의지와 상관없이 흘러가고 있다고 느낀다.",
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

  try {
    const raw = await callGptText(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
    });

    const jsonText = extractJsonObject(raw);
    if (!jsonText) throw new Error("No JSON object in LLM output");

    const parsed = JSON.parse(jsonText) as LlmResponseShape;
    const sdt = (parsed.sdt ?? {}) as Partial<Record<SDTKey, unknown>>;

    // schema expects arrays with 1 object each
    const relItem =
      normalizeThoughtItem(pickFirstItem(sdt.relatedness)) ??
      FALLBACK.relatedness;
    const comItem =
      normalizeThoughtItem(pickFirstItem(sdt.competence)) ??
      FALLBACK.competence;
    const autItem =
      normalizeThoughtItem(pickFirstItem(sdt.autonomy)) ?? FALLBACK.autonomy;

    return {
      sdt: {
        relatedness: relItem,
        competence: comItem,
        autonomy: autItem,
      },
    };
  } catch (error) {
    console.error("deep sdt automatic thoughts error:", error);
    return {
      sdt: {
        relatedness: FALLBACK.relatedness,
        competence: FALLBACK.competence,
        autonomy: FALLBACK.autonomy,
      },
    };
  }
}
