// src/lib/gpt/deepCognitiveAnalysis.ts
import { markAiFallback } from "@/lib/utils/aiFallback";
import { callGptText } from "./client";
import { type ErrorIndex, isValidIndex } from "./cognitiveRank";
import {
  type DeepInternalContext,
  formatDeepInternalContext,
} from "./deepContext";
import { formatCognitiveErrorsReferenceForCandidates } from "./utils/cognitiveErrorsPrompt";
import { parseCognitiveErrorsResponse } from "./utils/llm/cognitiveErrors";
import { cleanText } from "./utils/text";

export type DeepCognitiveErrorDetailResult = {
  errors: Array<{
    index: ErrorIndex;
    analysis: string;
  }>;
};

const DETAIL_SYSTEM_PROMPT = `
You are an expert who analyzes "cognitive distortions" in detail from a Cognitive Behavioral Therapy (CBT) perspective.
The input includes [Situation], [Automatic Thought], [Internal Context], and a list of candidate cognitive distortion indices (candidates).
You will also receive a [Cognitive Distortion Reference - Candidates Only] section that lists the names and descriptions for those indices.

[Internal Context structure]
- salient: actors/events/needs/threats/emotions (short keywords)
- cbt: topDistortions (1–2), coreBeliefsHypothesis (1–2)
- openQuestions: exactly 2 questions
- nextStepHint: one short sentence

Your goals:
- Write analyses ONLY for the cognitive distortion indices included in candidates. (No other indices allowed.)
- For each item, write an "analysis" in Korean with 3–5 sentences.
- Use Internal Context as the PRIMARY anchor. Use Situation/Automatic Thought as SECONDARY support.
- Do NOT introduce new assumptions beyond Internal Context + Notes.

Most important rules (must follow):
1) Each analysis MUST be at least 3 sentences. (3–5 sentences total)
2) Do NOT provide definitions or textbook explanations. Instead, point out the inference jump(s), distortions, or reasoning gaps that appear in the user’s wording.
3) The analysis MUST concretely reflect the user’s situation, internal context, and underlying thought.
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

function fallbackDetail(
  candidates: ErrorIndex[],
): DeepCognitiveErrorDetailResult {
  const make = (idx: ErrorIndex) => {
    if (idx === 1) {
      return "이 문장에서는 성공/실패처럼 두 극단으로 생각이 기울어져 있어요. 중간 가능성을 스스로 배제하면 감정이 더 커질 수 있어요. 지금 상황에서 ‘중간 단계의 가능성’이 하나라도 있는지, 구체적으로 무엇인지 확인해볼 수 있을까요?";
    }
    if (idx === 5) {
      return "이 문장에서는 확인되지 않은 가정이 빠르게 결론으로 굳어지는 흐름이 보여요. 근거가 부족한 채로 최악의 결과를 확정하면 감정이 더 커질 수 있어요. 실제로 확인된 사실과 아직 추정인 부분을 나눠보면, 지금은 어떤 것이 사실에 더 가까울까요?";
    }
    if (idx === 7) {
      return "이 문장에서는 지금의 느낌이 사실을 증명하는 것처럼 연결되는 지점이 있어요. ‘느껴지니까 사실’로 굳어지면 감정이 더 커질 수 있어요. 지금의 느낌을 뒷받침하는 ‘사실’은 무엇이고, 느낌만으로 채운 부분은 어디일까요?";
    }
    return "이 문장에서는 해석이 한 방향으로 빠르게 굳어지면서 다른 가능성이 줄어드는 흐름이 보여요. 이렇게 한 가지 해석만 남으면 감정이 더 커질 수 있어요. 지금 해석 말고, 조금 덜 아픈 해석이 하나라도 가능한지 확인해볼 수 있을까요?";
  };

  return {
    errors: candidates.map((idx) => ({
      index: idx,
      analysis: make(idx),
    })),
  };
}

export async function analyzeDeepCognitiveErrorDetails(
  situation: string,
  thought: string,
  internal: DeepInternalContext,
  candidates: ErrorIndex[],
): Promise<DeepCognitiveErrorDetailResult> {
  const uniq = Array.from(new Set(candidates)).filter((x) =>
    isValidIndex(x),
  ) as ErrorIndex[];

  const candidatesReference = formatCognitiveErrorsReferenceForCandidates(uniq);

  const prompt = `
[Situation]
${situation}

[Automatic Thought]
${thought}

[Internal Context - Structured]
${formatDeepInternalContext(internal)}

[Cognitive Distortion Reference - Candidates Only]
${candidatesReference || "(none)"}

[candidates]
${uniq.join(", ")}
`.trim();

  let usedFallback = false;
  try {
    const raw = await callGptText(prompt, {
      systemPrompt: DETAIL_SYSTEM_PROMPT,
      model: "gpt-4o-mini",
    });

    const arr = parseCognitiveErrorsResponse(raw);
    if (!arr) throw new Error("No JSON object in LLM output (detail)");

    const seen = new Set<number>();
    const errors: DeepCognitiveErrorDetailResult["errors"] = [];

    for (const item of arr) {
      const idx = item?.index;
      const a = cleanText(item?.analysis);

      if (!isValidIndex(idx)) continue;
      if (!uniq.includes(idx)) continue;
      if (seen.has(idx)) continue;
      if (!a) continue;

      seen.add(idx);
      errors.push({ index: idx, analysis: a });
    }

    const missing = uniq.filter((c) => !errors.some((e) => e.index === c));
    if (missing.length > 0) {
      usedFallback = true;
      errors.push(...fallbackDetail(missing).errors);
    }

    errors.sort((a, b) => uniq.indexOf(a.index) - uniq.indexOf(b.index));

    const result = { errors };
    return usedFallback ? markAiFallback(result, "partial") : result;
  } catch (e) {
    console.error("deep 인지오류 상세 분석 실패(JSON):", e);
    return markAiFallback(fallbackDetail(uniq));
  }
}
