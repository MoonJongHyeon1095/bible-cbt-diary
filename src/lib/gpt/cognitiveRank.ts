// src/lib/gpt/cognitiveRank.ts
import { formatCognitiveErrorsReference } from "./utils/cognitive/prompt";
import { parseCognitiveRankResponse } from "./utils/cognitive/parseRank";
import { buildPrompt } from "./utils/core/prompt";
import { runGptJson } from "./utils/core/run";
import { type CognitiveErrorRankResult, defaultRank } from "./utils/cognitive/rankMeta";
import { normalizeCognitiveRank } from "./utils/cognitive/rankNormalize";

/**
 * ✅ 기존 단일 분석 결과(호환용)
 * - 최종 API(analyzeCognitiveErrors)는 cognitiveAnalysis.ts에 존재
 */
export type CognitiveErrorAnalysisResult = {
  errors: Array<{
    title: string;
    description: string;
    analysis: string;
  }>;
};

export { defaultRank, isValidIndex, type ErrorIndex, type CognitiveErrorRankResult } from "./utils/cognitive/rankMeta";
export const FALLBACK_INDICES: import("./utils/cognitive/rankMeta").ErrorIndex[] = [1, 5, 7];

// const RANK_SYSTEM_PROMPT = `
// 너는 인지행동치료(CBT) 관점에서 "인지오류(생각의 왜곡)" 가능성을 우선순위로 정렬하는 전문가다.

// 입력은 [상황]과 [자동사고]로 주어진다.
// 너의 목표:
// - 아래 10가지 인지오류를 "해당 가능성이 높은 순서"로 10개 모두 정렬한다. (1~10 전부 포함, 중복 금지)
// - 각 항목에 대해 reason(1~2문장)으로 왜 유력한지 짧게 설명한다. 설명의 끝은 "~에 해당합니다." 또는 "~로 보입니다." 또는 "~로 의심됩니다." 또는 그와 유사한 표현을 사용한다. (정의/교과서 설명 금지)
// - evidenceQuote를 1개 포함한다. evidenceQuote는 반드시 [자동사고]에서 문장을 그대로 복사한다. (의역/요약 금지)
// - 확신이 낮은 항목은 reason에서 "가능성은 낮지만" 같은 표현으로 톤을 조절한다.

// 중요 규칙:
// 1) 출력은 오직 JSON만 허용한다. (설명/주석/코드블록/번호/불릿 금지)
// 2) ranked 배열은 정확히 10개여야 한다.
// 3) index는 1..10만 가능하다.
// 4) evidenceQuote를 넣을 때는 반드시 원문 그대로 복사한다.

// 출력 스키마:
// {
//   "ranked": [
//     { "index": 1, "reason": "...", "evidenceQuote": "..." }
//   ]
// }

// 인지오류 index 의미:
// 1. 전부 아니면 전무 사고(흑백논리)
// 2. 과잉일반화
// 3. 정신적 여과
// 4. 긍정 무시
// 5. 성급한 결론
// 6. 확대와 축소
// 7. 감정적 추론
// 8. 당위적 진술
// 9. 이름 붙이기
// 10. 개인화
// `.trim();
const COGNITIVE_ERRORS_REFERENCE = formatCognitiveErrorsReference();

const RANK_SYSTEM_PROMPT = `
You are an expert who ranks the likelihood of "cognitive distortions" from a Cognitive Behavioral Therapy (CBT) perspective.

The input is provided as [Situation] and [Automatic Thought].
You will also receive a Cognitive Distortion Reference (index, name, description).
Your goals:
- Sort all 10 cognitive distortions below in order from most likely to least likely. (Include all indices 1–10, no duplicates.)
- "evidenceQuote": MUST be copied verbatim from [Automatic Thought]. (No paraphrasing or summarizing.)
- "reason": Explain (1–2 sentences) why that distortion is plausible, based on the evidenceQuote, but WITHOUT copying or quoting the evidenceQuote text.

Important rules:
1) Output must be JSON only. (No explanations, comments, code blocks, numbering, or bullets.)
2) The ranked array must have exactly 10 items.
3) index can only be an integer from 1 to 10.
4) evidenceQuote must be copied exactly as-is from the input.
5) Output language: All string values in the JSON (especially "reason") MUST be written in Korean. Do NOT use English.
6) DO NOT include the evidenceQuote text inside "reason". "reason" must be a paraphrased explanation why you consider the distortion plausible.
7) DO NOT output indices in ascending numeric order (1,2,3,...,10). Sort them based on your evaluation in order from most likely to least likely.
8) Write the "reason" as 1–2 complete Korean sentences that naturally end with a polite judgment tone

Output schema:
{
  "ranked": [
    { "index": 1, "evidenceQuote": "...", "reason": "..." }
  ]
}

Cognitive distortion reference (index, name, description):
${COGNITIVE_ERRORS_REFERENCE}
`.trim();
/**
 * ✅ 2.a 랭킹
 */
export async function rankCognitiveErrors(
  situation: string,
  thought: string,
): Promise<CognitiveErrorRankResult> {
  const prompt = buildPrompt([
    { title: "Situation", body: situation },
    { title: "Automatic Thought", body: thought },
  ]);

  try {
    const { parsed } = await runGptJson({
      prompt,
      systemPrompt: RANK_SYSTEM_PROMPT,
      model: "gpt-4o-mini",
      parse: parseCognitiveRankResponse,
      tag: "cognitiveRank",
    });
    const arr = parsed;
    return normalizeCognitiveRank(arr);
  } catch (e) {
    console.error("인지오류 랭킹 실패(JSON):", e);
    return defaultRank();
  }
}
