// src/lib/gpt/deepAlternative.ts
import { callGptText } from "./client";
import type { AlternativeThought, TechniqueType } from "./alternative";
import {
  type DeepInternalContext,
  formatDeepInternalContext,
} from "./deepContext";
import { cleanText } from "./utils/text";
import { parseAlternativesResponse } from "./utils/llm/alternatives";
import { markAiFallback } from "@/lib/utils/aiFallback";

const TECHNIQUES: Array<{
  technique: TechniqueType;
  label: string;
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

const TECHNIQUE_LABEL_MAP: Record<TechniqueType, string> = {
  REALITY_CHECK: "현실검증",
  STRENGTHS: "강점 발견",
  SELF_ACCEPTANCE: "자기수용",
};

const DEFAULT_THOUGHTS: Record<TechniqueType, string> = {
  REALITY_CHECK:
    "지금 떠오르는 생각이 사실인지, 아니면 감정이 강해져서 한쪽으로 치우친 해석인지 차분히 구분해볼 필요가 있어요. 모든 상황에는 여러 가능성이 있는데, 지금은 가장 불리한 해석 하나만 붙잡고 있는 것 같아요. 증거와 반증을 함께 살펴보면 생각의 무게가 조금은 달라질 수 있어요.",
  STRENGTHS:
    "이 상황에 오기까지 이미 많은 것들을 감당하고 버텨왔다는 점은 분명해요. 쉽지 않은 조건에서도 계속 움직여 왔다는 사실 자체가 당신의 자원이에요. 지금은 그 강점이 잘 보이지 않지만, 사라진 건 아니에요.",
  SELF_ACCEPTANCE:
    "이렇게 힘들다고 느끼는 자신을 나약하다고 판단할 필요는 없어요. 누구라도 이 정도 상황에서는 흔들릴 수 있어요. 지금의 모습도 충분히 존중받아야 할 나의 한 부분이에요.",
};


const SYSTEM_PROMPT = `
You are a CBT (Cognitive Behavioral Therapy) counselor who answers in Korean.

Based on the user's [Situation], [Emotion], [Negative Automatic Thought], [Identified Cognitive Distortions], [Internal Context],
and [Previous Alternatives], generate exactly ONE alternative thought for each of the three techniques below.

[Internal Context structure]
- salient: actors/events/needs/threats/emotions (short keywords)
- cbt: topDistortions (1–2), coreBeliefsHypothesis (1–2)
- openQuestions: exactly 2 questions
- nextStepHint: one short sentence

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
- You MUST reflect the user's situation, emotion, negative automatic thought, cognitive distortions, and internal context.
- You MUST reference or adapt prior alternatives, but do NOT copy them verbatim.
- Use Internal Context as the PRIMARY anchor. Use Situation/Thought as SECONDARY support.
- Do NOT introduce new assumptions beyond Internal Context + Notes.
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

function normalizeTechnique(v: unknown): TechniqueType | null {
  const t = cleanText(v);
  if (t === "REALITY_CHECK") return "REALITY_CHECK";
  if (t === "STRENGTHS") return "STRENGTHS";
  if (t === "SELF_ACCEPTANCE") return "SELF_ACCEPTANCE";
  return null;
}

function toResultByTechnique(
  map: Partial<Record<TechniqueType, string>>,
): AlternativeThought[] {
  return TECHNIQUES.map((tech) => ({
    thought: map[tech.technique] ?? DEFAULT_THOUGHTS[tech.technique],
    technique: TECHNIQUE_LABEL_MAP[tech.technique],
    techniqueDescription: tech.techniqueDescription,
  }));
}

export async function generateDeepAlternativeThoughts(
  situation: string,
  emotion: string,
  thought: string,
  internal: DeepInternalContext,
  cognitiveErrors: Array<string | { title: string; detail?: string }>,
  previousAlternatives: string[],
): Promise<AlternativeThought[]> {
  const cognitiveErrorText = cognitiveErrors
    .map((err) => {
      if (typeof err === "string") return err;
      return err.detail ? `${err.title}: ${err.detail}` : err.title;
    })
    .join(", ");

  const previousAltText = previousAlternatives.filter(Boolean).join(" / ");

  const prompt = `
[Situation]
${situation}

[Emotion]
${emotion}

[Negative Automatic Thought]
${thought}

[Internal Context - Structured]
${formatDeepInternalContext(internal)}

[Identified Cognitive Distortions]
${cognitiveErrorText}

[Previous Alternatives]
${previousAltText || "(none)"}
`.trim();

  let usedFallback = false;
  try {
    const raw = await callGptText(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
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
      usedThoughts.add(t);
      byTechnique[technique] = t;
    }

    usedFallback = TECHNIQUES.some((tech) => !byTechnique[tech.technique]);
    const result = toResultByTechnique(byTechnique);
    return usedFallback ? markAiFallback(result, "partial") : result;
  } catch (error) {
    console.error("deep alternative error:", error);
    return markAiFallback(toResultByTechnique({}));
  }
}
