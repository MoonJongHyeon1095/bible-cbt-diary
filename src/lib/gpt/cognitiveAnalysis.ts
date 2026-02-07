
// src/lib/gpt/cognitiveAnalysis.ts
import { type ErrorIndex, isValidIndex } from "./cognitiveRank";
import { parseCognitiveErrorsResponse } from "./utils/cognitive/parseErrors";
import { formatCognitiveErrorsReferenceForCandidates } from "./utils/cognitive/prompt";
import { markAiFallback } from "@/lib/utils/aiFallback";
import { buildPrompt } from "./utils/core/prompt";
import { runGptJson } from "./utils/core/run";
import { fallbackCognitiveErrorDetail } from "./utils/cognitive/detailFallback";
import { normalizeCognitiveErrorDetails } from "./utils/cognitive/detailNormalize";

export type CognitiveErrorDetailResult = {
  errors: Array<{
    index: ErrorIndex; // candidates에 포함된 것만
    analysis: string; // 3~5문장 + 마지막에 확인 질문
  }>;
};


// const DETAIL_SYSTEM_PROMPT = `
// 너는 인지행동치료(CBT) 관점에서 "인지오류"를 구체적으로 분석하는 전문가다.

// 입력에는 [상황], [자동사고], 그리고 후보 인지오류 index 목록(candidates)이 주어진다.

// 너의 목표:
// - candidates에 포함된 인지오류에 대해서만 분석을 작성한다. (다른 index 금지)
// - 각 항목에 대해 analysis(3~5문장)를 작성한다.

// 가장 중요한 규칙 (반드시 지켜):
// 1) analysis는 반드시 3문장 이상이어야 한다. (3~5 문장)
// 2) analysis는 '정의/교과서 설명'을 하지 않는다. 대신 이 문장에서 일어난 추론 점프나 왜곡 등을 지적한다.
// 3) analysis에는 사용자의 상황, 배후 사고를 반드시 구체적으로 반영한다.
// 4) analysis의 마지막에는 그 감정이 더 커질 수 있음을 지적하고, 구체적인 확인 질문 예시를 제시한다.
// 5) candidates의 순서대로 작성하되, 근거가 너무 약하면 "가능성은 낮지만" 같은 톤 조절은 허용한다.

// 출력은 오직 JSON만 허용한다. (설명/주석/코드블록/번호/불릿 금지)
// 출력 스키마:
// {
//   "errors": [
//     { "index": 1, "analysis": "..." }
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

const DETAIL_SYSTEM_PROMPT = `
You are an expert who analyzes "cognitive distortions" in detail from a Cognitive Behavioral Therapy (CBT) perspective.
The input includes [Situation], [Automatic Thought], and a list of candidate cognitive distortion indices (candidates).
You will also receive a [Cognitive Distortion Reference - Candidates Only] section that lists the names and descriptions for those indices.

Your goals:
- Write analyses ONLY for the cognitive distortion indices included in candidates. (No other indices allowed.)
- For each item, write an "analysis" in Korean with 3–5 sentences.

Most important rules (must follow):
1) Each analysis MUST be at least 3 sentences. (3–5 sentences total)
2) Do NOT provide definitions or textbook explanations. Instead, point out the inference jump(s), distortions, or reasoning gaps that appear in the user’s wording.
3) The analysis MUST concretely reflect the user’s situation and underlying thought.
4) The analysis MUST end by pointing out that the emotion could intensify and provide a specific example of a clarifying question.
5) Write analyses in the order of candidates, but if the evidence is weak, tone adjustments like "가능성은 낮지만" are allowed.
6) Output language: All string values in the JSON (especially "analysis") MUST be written in Korean. Do NOT use English.

Output must be JSON only. (No explanations, comments, code blocks, numbering, or bullets.)
Output schema:
{
  "errors": [
    { "index": 1, "analysis": "..." }
  ]
}

Cognitive distortion index meanings:
1. All-or-nothing thinking (black-and-white thinking)
2. Overgeneralization
3. Mental filter
4. Disqualifying or discounting the positive
5. Jumping to conclusions
6. Magnification and minimization
7. Emotional reasoning
8. Should statements
9. Labeling
10. Personalization
`.trim();

/**
 * ✅ 2.b 후보 상세(상위3 등 candidates만)
 */
export async function analyzeCognitiveErrorDetails(
  situation: string,
  thought: string,
  candidates: ErrorIndex[],
  options?: { noteProposal?: boolean }
): Promise<CognitiveErrorDetailResult> {
  const uniq = Array.from(new Set(candidates)).filter((x) =>
    isValidIndex(x)
  ) as ErrorIndex[];

  const candidatesReference = formatCognitiveErrorsReferenceForCandidates(uniq);

  const prompt = buildPrompt([
    { title: "Situation", body: situation },
    { title: "Automatic Thought", body: thought },
    {
      title: "Cognitive Distortion Reference - Candidates Only",
      body: candidatesReference,
      emptyFallback: "(none)",
    },
    { title: "candidates", body: uniq.join(", ") },
  ]);

  try {
    const { parsed } = await runGptJson({
      prompt,
      systemPrompt: DETAIL_SYSTEM_PROMPT,
      model: "gpt-4o-mini",
      noteProposal: options?.noteProposal,
      parse: parseCognitiveErrorsResponse,
      tag: "cognitiveAnalysis",
    });
    const arr = parsed;
    const normalized = normalizeCognitiveErrorDetails(arr, uniq);
    const result = { errors: normalized.errors };
    return normalized.usedFallback ? markAiFallback(result, "partial") : result;
  } catch (e) {
    console.error("인지오류 상세 분석 실패(JSON):", e);
    return markAiFallback(fallbackCognitiveErrorDetail(uniq));
  }
}

/**
 * ✅ (호환) 기존 단일 분석 API
 * - legacy 제거
 * - 항상 (rank → top3 → detail)로만 반환
 */
// export async function analyzeCognitiveErrors(
//   situation: string,
//   thought: string
// ): Promise<CognitiveErrorAnalysisResult> {
//   try {
//     const rank: CognitiveErrorRankResult =
//       (await rankCognitiveErrors(situation, thought)) ?? defaultRank();

//     const top3 = rank.ranked.map((x) => x.index).slice(0, 3);
//     const detail = await analyzeCognitiveErrorDetails(situation, thought, top3);

//     return {
//       errors: detail.errors.map((d) => {
//         const meta = COGNITIVE_ERRORS_BY_INDEX[d.index];
//         return {
//           title: meta.title,
//           description: meta.description,
//           // ✅ userQuote 제거됨
//           analysis: d.analysis,
//         };
//       }),
//     };
//   } catch (e) {
//     console.error("인지오류 분석 실패(JSON):", e);

//     const detail = fallbackDetail(FALLBACK_INDICES, situation, thought);
//     return {
//       errors: detail.errors.map((d) => {
//         const meta = COGNITIVE_ERRORS_BY_INDEX[d.index];
//         return {
//           title: meta.title,
//           description: meta.description,
//           // ✅ userQuote 제거됨
//           analysis: d.analysis,
//         };
//       }),
//     };
//   }
// }
