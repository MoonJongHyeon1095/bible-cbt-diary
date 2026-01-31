
// src/lib/gpt/alternative.ts
import { callGptText } from "./client";
import { cleanText } from "./utils/text";
import { parseAlternativesResponse } from "./utils/llm/alternatives";

/** =========================
 * Types
 * ========================= */

// 내부 식별자(LLM 계약용)
export type TechniqueType =
  | "REALITY_CHECK"
  | "STRENGTHS"
  | "SELF_ACCEPTANCE";

// ✅ 최종 반환 타입: technique에 "한글 라벨"이 들어가도록
export type AlternativeThought = {
  thought: string;
  technique: string; // "현실검증" | "강점 발견" | "자기수용"
  techniqueDescription: string;
};


/** =========================
 * Technique Metadata
 * ========================= */

const TECHNIQUES: Array<{
  technique: TechniqueType; // 내부 enum
  label: string; // ✅ 한글 라벨
  techniqueDescription: string;
}> = [
  {
    technique: "REALITY_CHECK",
    label: "현실검증",
    techniqueDescription:
      "사실과 증거, 가능한 대안적 해석을 통해 극단적인 사고를 현실적으로 재평가합니다.",
  },
  {
    technique: "STRENGTHS",
    label: "강점 발견",
    techniqueDescription:
      "이미 해낸 것과 버텨온 경험에서 회복 자원과 자기 효능감을 찾습니다.",
  },
  {
    technique: "SELF_ACCEPTANCE",
    label: "자기수용",
    techniqueDescription:
      "완벽주의와 자기비난을 완화하고 지금의 자신을 존중하는 관점을 기릅니다.",
  },
];

// ✅ return 시 technique에 넣을 한글 라벨 매핑
const TECHNIQUE_LABEL_MAP: Record<TechniqueType, string> = {
  REALITY_CHECK: "현실검증",
  STRENGTHS: "강점 발견",
  SELF_ACCEPTANCE: "자기수용",
};

/** =========================
 * Fallback Thoughts
 * ========================= */

const DEFAULT_THOUGHTS: Record<TechniqueType, string> = {
  REALITY_CHECK:
    "지금 떠오르는 생각이 사실인지, 아니면 감정이 강해져서 한쪽으로 치우친 해석인지 차분히 구분해볼 필요가 있어요. 모든 상황에는 여러 가능성이 있는데, 지금은 가장 불리한 해석 하나만 붙잡고 있는 것 같아요. 증거와 반증을 함께 살펴보면 생각의 무게가 조금은 달라질 수 있어요.",
  STRENGTHS:
    "이 상황에 오기까지 이미 많은 것들을 감당하고 버텨왔다는 점은 분명해요. 쉽지 않은 조건에서도 계속 움직여 왔다는 사실 자체가 당신의 자원이에요. 지금은 그 강점이 잘 보이지 않지만, 사라진 건 아니에요.",
  SELF_ACCEPTANCE:
    "이렇게 힘들다고 느끼는 자신을 나약하다고 판단할 필요는 없어요. 누구라도 이 정도 상황에서는 흔들릴 수 있어요. 지금의 모습도 충분히 존중받아야 할 나의 한 부분이에요.",
};

/** =========================
 * System Prompt
 * ========================= */

// const SYSTEM_PROMPT = `
// 너는 한국어로 답하는 CBT(인지행동치료) 기반 상담자다.
// 사용자가 겪은 [상황], [감정], [부정적 자동사고], [발견된 인지오류]를 바탕으로
// 아래 3가지 기법에 대해 각각 "하나의 대안사고"를 생성하라.

// [기법]
// 1) REALITY_CHECK (현실검증)
// - 인지행치료의 증거사실 수집 및 설문 기법을 적용한다.
// - 사실, 증거, 가능성, 대안적 해석을 통해 지나치게 극단적인 사고를 현실적으로 재평가한다.
// - 4~5문장으로 작성한다.

// 2) STRENGTHS (강점 발견)
// - 인지치료에서의 긍정적 재구성 기법과 긍정심리학에서의 칭찬기법을 바탕으로 한다.
// - 사용자가 이미 해낸 것, 버텨온 경험, 쌓아온 자원과 능력을 발견해 회복감과 자기 효능감을 돕는다.
// - 3~5문장으로 작성한다.

// 3) SELF_ACCEPTANCE (자기수용)
// - 이야기 치료의 대얀서사기법, 자비중심치료의 자기연민 기법을 기반으로 한다.
// - 완벽해야 한다는 압박과 자기비난을 완화하고 지금의 자신을 존중하는 관점을 제시한다.
// - 3~5문장으로 작성한다.

// [출력 규칙]
// - [발견된 인지오류]에서 지적하는 것을 반복하지 않고, 대안적인 주장 형태의 문장을 만든다.
// - 사용자가 겪은 상황, 감정, 부정적 자동사고, 인지오류를 반드시 반영한다.
// - 근거 없는 낙관, 과장된 긍정(희망회로)은 금지한다.
// - 서로 다른 기법 간 내용이 중복되지 않도록 한다.
// - 출력은 오직 JSON만 허용한다.
// - 아래 스키마를 정확히 따른다.

// {
//   "result": {
//     "alternatives": [
//       { "technique": "REALITY_CHECK", "thought": "..." },
//       { "technique": "STRENGTHS", "thought": "..." },
//       { "technique": "SELF_ACCEPTANCE", "thought": "..." }
//     ]
//   }
// }
// `.trim();
const SYSTEM_PROMPT = `
You are a CBT (Cognitive Behavioral Therapy) counselor who answers in Korean.

Based on the user's [Situation], [Emotion], [Negative Automatic Thought], and [Identified Cognitive Distortions],
generate exactly ONE alternative thought for each of the three techniques below.

[Techniques]
1) REALITY_CHECK
- Apply CBT evidence-based questioning / reality testing.
- Reevaluate an overly extreme thought using facts, evidence, likelihoods, and alternative interpretations.
- Write 3–5 Korean sentences.

2) STRENGTHS
- Use positive reframing in CBT and strengths-based affirmation approaches from positive psychology.
- Help the user recognize what they have already done, endured, and the resources/abilities they have built, to support resilience and self-efficacy.
- Write 3–5 Korean sentences.

3) SELF_ACCEPTANCE
- Draw from narrative therapy (re-authoring) and compassion-focused self-compassion approaches.
- Reduce perfectionistic pressure and self-blame, and present a perspective that respects the user as they are.
- Write 3–5 Korean sentences.

[Output rules]
- Do NOT simply repeat what was pointed out in [Identified Cognitive Distortions]. Instead, write an alternative claim in the form of a statement.
- You MUST reflect the user's situation, emotion, negative automatic thought, and cognitive distortions.
- No baseless optimism or exaggerated positivity.
- Avoid content overlap across techniques (each should feel meaningfully different).
- Output must be JSON only.
- Do not output any text before or after the JSON object.
- Follow the schema exactly.

Output schema (exactly):
{
  "result": {
    "alternatives": [
      { "technique": "REALITY_CHECK", "thought": "..." },
      { "technique": "STRENGTHS", "thought": "..." },
      { "technique": "SELF_ACCEPTANCE", "thought": "..." }
    ]
  }
}

Language constraint:
- All string values in the JSON (especially "thought") MUST be written in Korean.
`.trim();


/** =========================
 * Utils
 * ========================= */

function normalizeTechnique(v: unknown): TechniqueType | null {
  const t = cleanText(v);
  if (t === "REALITY_CHECK") return "REALITY_CHECK";
  if (t === "STRENGTHS") return "STRENGTHS";
  if (t === "SELF_ACCEPTANCE") return "SELF_ACCEPTANCE";
  return null;
}

/** =========================
 * Mapping
 * ========================= */

function toResultByTechnique(
  map: Partial<Record<TechniqueType, string>>
): AlternativeThought[] {
  return TECHNIQUES.map((tech) => ({
    thought: map[tech.technique] ?? DEFAULT_THOUGHTS[tech.technique],
    technique: TECHNIQUE_LABEL_MAP[tech.technique], // ✅ 최종 반환은 한글
    techniqueDescription: tech.techniqueDescription,
  }));
}

/** =========================
 * Main Function
 * ========================= */

export async function generateContextualAlternativeThoughts(
  situation: string,
  emotion: string,
  thought: string,
  cognitiveErrors: Array<string | { title: string; detail?: string }>,
  options?: { noteProposal?: boolean }
): Promise<AlternativeThought[]> {
  const cognitiveErrorText = cognitiveErrors
    .map((err) => {
      if (typeof err === "string") return err;
      return err.detail ? `${err.title}: ${err.detail}` : err.title;
    })
    .join(", ");

  const prompt = `
[Situation]
${situation}

[Emotion]
${emotion}

[Negative Automatic Thought]
${thought}

[Identified Cognitive Distortions]
${cognitiveErrorText}
`.trim();

  try {
    const raw = await callGptText(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
      noteProposal: options?.noteProposal,
    });

    const arr = parseAlternativesResponse(raw);
    if (!arr) throw new Error("No JSON object in LLM output");

    const byTechnique: Partial<Record<TechniqueType, string>> = {};
    const usedThoughts = new Set<string>();

    for (const item of arr) {
      const technique = normalizeTechnique(item?.technique);
      const t = cleanText(item?.thought);
      if (!technique || !t) continue;
      if (usedThoughts.has(t)) continue;

      if (!byTechnique[technique]) {
        byTechnique[technique] = t;
        usedThoughts.add(t);
      }
    }

    return toResultByTechnique(byTechnique);
  } catch (e) {
    console.error("대안사고 생성 실패(JSON):", e);
    return toResultByTechnique({});
  }
}
