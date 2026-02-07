// src/lib/gpt/alternative.ts
import { markAiFallback } from "@/lib/utils/aiFallback";
import { toResultByTechnique, type AlternativeThought } from "./utils/alternatives/meta";
import { parseAlternativesResponse } from "./utils/alternatives/parse";
import { assembleAlternatives } from "./utils/alternatives/assemble";
import { runGptJson } from "./utils/core/run";
import { buildPrompt } from "./utils/core/prompt";

export type { AlternativeThought, TechniqueType } from "./utils/alternatives/meta";

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
 * Main Function
 * ========================= */

export async function generateContextualAlternativeThoughts(
  situation: string,
  emotion: string,
  thought: string,
  cognitiveErrors: Array<string | { title: string; detail?: string }>,
  options?: { noteProposal?: boolean },
): Promise<AlternativeThought[]> {
  const cognitiveErrorText = cognitiveErrors
    .map((err) => {
      if (typeof err === "string") return err;
      return err.detail ? `${err.title}: ${err.detail}` : err.title;
    })
    .join(", ");

  const prompt = buildPrompt([
    { title: "Situation", body: situation },
    { title: "Emotion", body: emotion },
    { title: "Negative Automatic Thought", body: thought },
    { title: "Identified Cognitive Distortions", body: cognitiveErrorText },
  ]);

  try {
    const { parsed } = await runGptJson({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
      noteProposal: options?.noteProposal,
      parse: parseAlternativesResponse,
      tag: "alternative",
    });
    const arr = parsed;
    const normalized = assembleAlternatives(arr);
    const result = normalized.result;
    return normalized.usedFallback ? markAiFallback(result, "partial") : result;
  } catch (e) {
    console.error("대안사고 생성 실패(JSON):", e);
    return markAiFallback(toResultByTechnique({}));
  }
}
