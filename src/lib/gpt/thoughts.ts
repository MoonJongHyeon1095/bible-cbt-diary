// src/lib/gpt/thoughts.ts
import { callGptText } from "./client";

type SDTKey = "relatedness" | "competence" | "autonomy";
type SDTLabel = "관계성" | "유능감" | "자율성";

export type ExtendedThoughtsResult = {
  sdtThoughts: Array<{ category: SDTLabel; belief: string; emotionReason: string }>;
};

type LlmThoughtItem = {
  belief?: unknown;
  emotion_reason?: unknown;
};

type LlmResponseShape = {
  sdt?: Partial<Record<SDTKey, unknown>>;
};

const DEFAULT_SDT: Record<SDTKey, { category: SDTLabel; thoughts: string[] }> = {
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
    ],
  },
};

// const SYSTEM_PROMPT = `
// 너는 한국어로 답하는 인지행동치료(CBT) 상담자다.

// 역할:
// - 사용자가 겪은 사건, 선택한 감정을 바탕으로 그 뒤에 숨은 "배후 생각(자동사고)"을 또렷하게 문장으로 잡아주는 것이 너의 일이다.
// - 오로지 "지금 이 감정이 이렇게 강하게 느껴지도록 만드는 핵심 주장"을 드러내는 데 집중한다.

// 스타일:
// - 반드시 한국어로, 자연스러운 1인칭 자동사고 형태로 쓴다. ("나는 …다", "분명 …일 것이다" 등)
// - 표면적인 생각이 아니라, 그 뒤에 있는 부정적인 신념·의미·해석·두려워하는 결과가 드러나도록 쓴다.
// - 구체적인 사건 묘사를 그대로 반복하지 말고, 그 사건들에서 사용자가 스스로에 대해 형성한 ‘한 단계 일반화된 믿음’이나 ‘규칙’의 형태로 표현한다.
// - 다만 너무 막연한 인생 전체에 대한 철학이 아니라, 현재 상황·관계 맥락에 밀접하게 연결된 믿음으로 쓴다.
// - 감정 이름을 반영한다.
// - 자율성/관계성/유능성(SDT) 관점을 고려하되, "자율성 / 관계성 / 유능성"이라는 단어 자체는 사용하지 않는다.

// 형식 제약:
// - 출력은 오직 JSON만.
// - 아래 스키마를 정확히 지킨다.
// - 총 5개만 생성한다: relatedness 2개, competence 2개, autonomy 1개.
// - 각 항목은 belief, emotion_reason 두 필드로 구성된다.
//   - belief: 숨겨진 핵심 주장, 신념, 믿음, 관점. (1인칭 시점, 자동사고 문장 1~2문장. 상황서술을 그대로 반복하지 말고, 그 문장이 의미하는 바를 한 단계 일반화하여 표현한다. **사용자가 카드에 적어 넣을 핵심 문장이라고 생각하고 쓴다.**)
//   - emotion_reason: 선택한 감정을 참고하여, 위 belief가 지금 감정을 만들어내는 이유를 설명하는 한 문장. **belief를 이해하기 위한 부연 설명으로만 쓴다.**

// 출력 스키마(정확히):
// {
//   "sdt": {
//     "relatedness": [
//       { "belief": ["...","..."], "emotion_reason": ["...","..."] },
//       { "belief": ["...","..."], "emotion_reason": ["...","..."] }
//     ],
//     "competence": [
//       { "belief": ["...","..."], "emotion_reason": ["...","..."] },
//       { "belief": ["...","..."], "emotion_reason": ["...","..."] }
//     ],
//     "autonomy": [
//       { "belief": ["...","..."], "emotion_reason": ["...","..."] }
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
- Consider the SDT perspectives (autonomy / relatedness / competence), generate 3 items.

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
- Generate exactly 3 items total: 1 for relatedness, 1 for competence, 1 for autonomy.
- Output language: All string values in the JSON (especially "belief") MUST be written in Korean. Do NOT use English.

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

function extractJsonObject(raw: string): string | null {
  const cleaned = raw.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  if (s === -1 || e === -1 || e <= s) return null;
  return cleaned.slice(s, e + 1);
}

function cleanText(v: unknown): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
}

function normalizeTextValue(v: unknown): string {
  if (typeof v === "string") return cleanText(v);
  return "";
}

function normalizeStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(cleanText).filter(Boolean);
}

function normalizeThoughtItems(
  v: unknown
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
const prompt = `[Situation]
${situation}

[Emotion]
${emotion}
`.trim();

  try {
    const raw = await callGptText(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
      noteProposal: options?.noteProposal,
    });
    const jsonText = extractJsonObject(raw);
    if (!jsonText) throw new Error("No JSON object in LLM output");

    const parsed = JSON.parse(jsonText) as LlmResponseShape;
    const sdt = (parsed.sdt ?? {}) as Partial<Record<SDTKey, unknown>>;

    const rel = normalizeThoughtItems(sdt.relatedness)
      .map(toThoughtParts)
      .filter((item) => item.belief || item.emotionReason);
    const com = normalizeThoughtItems(sdt.competence)
      .map(toThoughtParts)
      .filter((item) => item.belief || item.emotionReason);
    const aut = normalizeThoughtItems(sdt.autonomy)
      .map(toThoughtParts)
      .filter((item) => item.belief || item.emotionReason);

    const out: ExtendedThoughtsResult["sdtThoughts"] = [];

    // ✅ 정확히 1/1/1 채우기 (부족하면 fallback로 보충)
    const rel1 = [
      ...rel,
      ...DEFAULT_SDT.relatedness.thoughts.map((t) => ({
        belief: t,
        emotionReason: "",
      })),
    ].slice(0, 1);
    const com1 = [
      ...com,
      ...DEFAULT_SDT.competence.thoughts.map((t) => ({
        belief: t,
        emotionReason: "",
      })),
    ].slice(0, 1);
    const aut1 = [
      ...aut,
      ...DEFAULT_SDT.autonomy.thoughts.map((t) => ({
        belief: t,
        emotionReason: "",
      })),
    ].slice(0, 1);

    for (const t of rel1) out.push({ category: "관계성", ...t });
    for (const t of com1) out.push({ category: "유능감", ...t });
    for (const t of aut1) out.push({ category: "자율성", ...t });

    return { sdtThoughts: out };
  } catch (e) {
    console.error("확장 자동사고(SDT) 생성 실패:", e);
    return {
      sdtThoughts: [
        ...DEFAULT_SDT.relatedness.thoughts.slice(0, 1).map((t) => ({
          category: "관계성" as const,
          belief: t,
          emotionReason: "",
        })),
        ...DEFAULT_SDT.competence.thoughts.slice(0, 1).map((t) => ({
          category: "유능감" as const,
          belief: t,
          emotionReason: "",
        })),
        ...DEFAULT_SDT.autonomy.thoughts.slice(0, 1).map((t) => ({
          category: "자율성" as const,
          belief: t,
          emotionReason: "",
        })),
      ],
    };
  }
}
