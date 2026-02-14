// src/lib/gpt/thoughts.ts
import { markAiFallback } from "@/lib/utils/aiFallback";
import { normalizeStringArray } from "./utils/core/array";
import { buildPrompt } from "./utils/core/prompt";
import { runGptJson } from "./utils/core/run";
import { normalizeTextValue } from "./utils/core/text";
import { parseSdtResponse } from "./utils/sdt/parse";

type SDTKey = "relatedness" | "competence" | "autonomy";
type SDTLabel = "관계성" | "유능감" | "자율성";

export type ExtendedThoughtsResult = {
  sdtThoughts: Array<{
    category: SDTLabel;
    belief: string;
    emotionReason: string;
  }>;
};

type LlmThoughtItem = {
  belief?: unknown;
  emotion_reason?: unknown;
};

const DEFAULT_SDT: Record<SDTKey, { category: SDTLabel; thoughts: string[] }> =
  {
    relatedness: {
      category: "관계성",
      thoughts: [
        "사람들이 나를 이해하지 못할 것 같다. 그래서 더 혼자 남게 될 것 같다.",
        "내 마음을 드러내면 부담스러워할 것 같다. 결국 나는 소외될 것 같다.",
      ],
    },
    competence: {
      category: "유능감",
      thoughts: [
        "나는 이 일을 제대로 해낼 수 없을 것 같다. 결국 또 실망만 안길 것 같다.",
        "조금만 흔들려도 나는 무너질 사람 같다. 그래서 무엇을 맡아도 불안하다.",
      ],
    },
    autonomy: {
      category: "자율성",
      thoughts: [
        "내가 통제할 수 있는 게 거의 없다고 느껴진다. 상황에 끌려다니는 기분이다.",
        "내 선택이 반영되지 않고 흘러갈 것 같다. 결국 나는 내 삶에서도 주도권이 없다고 느낄 것 같다.",
      ],
    },
  };

// const SYSTEM_PROMPT = `
// You are a CBT (Cognitive Behavioral Therapy) counselor who answers in Korean.

// The input is provided as [Situation] and [Emotion].
// Your goals:
// - Based on the situation the user experienced and the emotion they selected, your job is to articulate the hidden "underlying thought (automatic thought)" in clear sentences.
// - Focus only on revealing the "core claim" that makes the user feel the selected emotion right now.

// Important rules:
// - Must be written in Korean, as a natural first-person automatic thought. (e.g., "나는 …다", "분명 …일 것이다")
// - Consider the SDT perspectives (autonomy / relatedness / competence), generate 3 items.

// Important rules for each item:
// - belief (at least 2 sentences, ideally 3):
//   - Sentence 1: the hidden core claim / belief / viewpoint  (card-ready).
//   - Sentence 2: the feared consequence / meaning / rule that follows from it.
//   - Not a surface-level thought: make the negative belief/meaning/interpretation/feared outcome explicit.
//   - Avoid vague life-philosophy statements. Keep it tightly connected to the current situation and relationship context.
//   - Do NOT copy or restate the situation text; write a one-step-generalized belief/rule inferred from it.
//   - Reflect the emotion label in the wording.
// - emotion_reason
//   - one sentence explaining why the above belief creates the current emotion, referencing the selected emotion.
//   - Write only as supporting explanation to understand the belief.

// Formatting constraints:
// - Output must be JSON only.
// - Do not output any text before or after the JSON object.
// - Generate exactly 3 items total: 1 for relatedness, 1 for competence, 1 for autonomy.
// - Output language: All string values in the JSON (especially "belief") MUST be written in Korean. Do NOT use English.

// Output schema (exactly):
// {
//   "sdt": {
//     "relatedness": [
//       { "belief": ["...", "..."], "emotion_reason": "..." }
//     ],
//     "competence": [
//       { "belief": ["...", "..."], "emotion_reason": "..." }
//     ],
//     "autonomy": [
//       { "belief": ["...", "..."], "emotion_reason": "..." }
//     ]
//   }
// }

// `.trim();

const SYSTEM_PROMPT = `
You are a CBT (Cognitive Behavioral Therapy) counselor who answers in Korean.

The input is provided as [Situation] and [Emotion].
Your goals:
- Based on the situation the user experienced and the emotion they selected, your job is to articulate the hidden "underlying thought (automatic thought)" in clear sentences.
- Focus only on revealing the "core claim" that makes the user feel the selected emotion right now.

Important rules:
- Must be written in Korean, as a natural first-person automatic thought. (e.g., "나는 …다", "분명 …일 것이다")
- Consider the SDT perspectives (autonomy / relatedness / competence), generate 6 items.

Important rules for each item:
- belief (at least 2 sentences, ideally 3): 
  - Sentence 1: the hidden core claim / belief / viewpoint  (card-ready).
  - Sentence 2: the feared consequence / meaning / rule that follows from it.
  - Not a surface-level thought: make the negative belief/meaning/interpretation/feared outcome explicit.
  - Avoid vague life-philosophy statements. Keep it tightly connected to the current situation and relationship context.
  - Do NOT copy or restate the situation text; write a one-step-generalized belief/rule inferred from it.
  - Reflect the emotion label in the wording.
- emotion_reason
  - one sentence explaining why the above belief creates the current emotion, referencing the selected emotion. 
  - Write only as supporting explanation to understand the belief.


Formatting constraints:
- Output must be JSON only.
- Do not output any text before or after the JSON object.
- Generate exactly 6 items total: 2 for relatedness, 2 for competence, 2 for autonomy.
- Output language: All string values in the JSON (especially "belief") MUST be written in Korean. Do NOT use English.

Output schema (exactly):
{
  "sdt": {
    "relatedness": [
      { "belief": ["...", "..."], "emotion_reason": "..." },
      { "belief": ["...", "..."], "emotion_reason": "..." }
    ],
    "competence": [
      { "belief": ["...", "..."], "emotion_reason": "..." },
      { "belief": ["...", "..."], "emotion_reason": "..." }
    ],
    "autonomy": [
      { "belief": ["...", "..."], "emotion_reason": "..." },
      { "belief": ["...", "..."], "emotion_reason": "..." }
    ]
  }
}

`.trim();

function normalizeThoughtItems(
  v: unknown,
): Array<{ belief: string[]; emotion_reason: string }> {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as LlmThoughtItem;

      const belief = normalizeStringArray(obj.belief);
      const emotion_reason = normalizeTextValue(obj.emotion_reason);

      if (belief.length === 0 && !emotion_reason) return null;
      return { belief, emotion_reason };
    })
    .filter(Boolean) as Array<{ belief: string[]; emotion_reason: string }>;
}

// ✅ belief/emotion_reason 분리 출력
function toThoughtParts(item: { belief: string[]; emotion_reason: string }) {
  return {
    belief: item.belief.join(" ").trim(),
    emotionReason: item.emotion_reason,
  };
}

export async function generateExtendedAutomaticThoughts(
  situation: string,
  emotion: string,
  options?: { noteProposal?: boolean },
): Promise<ExtendedThoughtsResult> {
  const prompt = buildPrompt([
    { title: "Situation", body: situation },
    { title: "Emotion", body: emotion },
  ]);

  let usedFallback = false;
  try {
    const { parsed } = await runGptJson({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
      noteProposal: options?.noteProposal,
      parse: parseSdtResponse,
      tag: "thoughts",
    });

    const sdt = (parsed ?? {}) as Partial<Record<SDTKey, unknown>>;

    const rel = normalizeThoughtItems(sdt.relatedness)
      .map(toThoughtParts)
      .filter((item) => item.belief || item.emotionReason);
    const com = normalizeThoughtItems(sdt.competence)
      .map(toThoughtParts)
      .filter((item) => item.belief || item.emotionReason);
    const aut = normalizeThoughtItems(sdt.autonomy)
      .map(toThoughtParts)
      .filter((item) => item.belief || item.emotionReason);
    usedFallback = rel.length === 0 || com.length === 0 || aut.length === 0;

    const out: ExtendedThoughtsResult["sdtThoughts"] = [];

    // ✅ 정확히 2/2/2 채우기 (부족하면 fallback로 보충)
    const rel1 = [
      ...rel,
      ...DEFAULT_SDT.relatedness.thoughts.map((t) => ({
        belief: t,
        emotionReason: "",
      })),
    ].slice(0, 2);
    const com1 = [
      ...com,
      ...DEFAULT_SDT.competence.thoughts.map((t) => ({
        belief: t,
        emotionReason: "",
      })),
    ].slice(0, 2);
    const aut1 = [
      ...aut,
      ...DEFAULT_SDT.autonomy.thoughts.map((t) => ({
        belief: t,
        emotionReason: "",
      })),
    ].slice(0, 2);

    for (const t of rel1) out.push({ category: "관계성", ...t });
    for (const t of com1) out.push({ category: "유능감", ...t });
    for (const t of aut1) out.push({ category: "자율성", ...t });

    const result = { sdtThoughts: out };
    return usedFallback ? markAiFallback(result, "partial") : result;
  } catch (e) {
    console.error("확장 자동사고(SDT) 생성 실패:", e);
    return markAiFallback({
      sdtThoughts: [
        ...DEFAULT_SDT.relatedness.thoughts.slice(0, 2).map((t) => ({
          category: "관계성" as const,
          belief: t,
          emotionReason: "",
        })),
        ...DEFAULT_SDT.competence.thoughts.slice(0, 2).map((t) => ({
          category: "유능감" as const,
          belief: t,
          emotionReason: "",
        })),
        ...DEFAULT_SDT.autonomy.thoughts.slice(0, 2).map((t) => ({
          category: "자율성" as const,
          belief: t,
          emotionReason: "",
        })),
      ],
    });
  }
}
