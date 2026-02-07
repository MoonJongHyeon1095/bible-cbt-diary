// src/lib/gpt/deepCognitiveAnalysis.ts
import { markAiFallback } from "@/lib/utils/aiFallback";
import { type ErrorIndex, isValidIndex } from "./cognitiveRank";
import { type DeepInternalContext } from "./deepContext";
import { formatCognitiveErrorsReferenceForCandidates } from "./utils/cognitive/prompt";
import { parseCognitiveErrorsResponse } from "./utils/cognitive/parseErrors";
import { buildPrompt } from "./utils/core/prompt";
import { runGptJson } from "./utils/core/run";
import { fallbackCognitiveErrorDetail } from "./utils/cognitive/detailFallback";
import { normalizeCognitiveErrorDetails } from "./utils/cognitive/detailNormalize";
import { buildDeepCognitiveAnalysisInternal } from "./utils/deep/analysisPrompt";

export type DeepCognitiveErrorDetailResult = {
  errors: Array<{
    index: ErrorIndex;
    analysis: string;
  }>;
};

const DETAIL_SYSTEM_PROMPT = `
You are an expert who analyzes "cognitive distortions" in detail from a Cognitive Behavioral Therapy (CBT) perspective.
The input includes [Situation], [Automatic Thought], [Internal Context - English], and a list of candidate cognitive distortion indices (candidates).
You will also receive a [Cognitive Distortion Reference - Candidates Only] section that lists the names and descriptions for those indices.

[Internal Context - English format]
- deep (PRIMARY): repeatingPatterns / tensions / invariants / conditionalRules / leveragePoints / bridgeHypothesis
- secondary: salient.actors/events/needs/threats/emotions, cbt.topDistortions/coreBeliefsHypothesis

Anchor priority (MUST):
1) Use internal.deep as PRIMARY anchor (especially conditionalRules + tensions/bridgeHypothesis).
2) Use internal.cbt and internal.salient as SECONDARY anchor.
3) Use Situation/Automatic Thought only to point to concrete wording evidence, but do NOT quote large chunks.

Your goals:
- Write analyses ONLY for the cognitive distortion indices included in candidates. (No other indices allowed.)
- For each item, write an "analysis" in Korean with 3–5 sentences.
- Do NOT introduce new assumptions beyond Internal Context + Notes.

Most important rules (must follow):
1) Each analysis MUST be at least 3 sentences. (3–5 sentences total)
2) Do NOT provide definitions or textbook explanations. Instead, point out the inference jump(s), distortions, or reasoning gaps that appear in the user’s wording.
3) Each analysis MUST explicitly reflect at least:
   (a) one item from internal.deep.conditionalRules OR internal.deep.invariants
   AND
   (b) one item from internal.deep.tensions OR internal.deep.bridgeHypothesis.
4) The final sentence MUST mention that the emotion could intensify and end with ONE specific clarifying question that targets the conditional rule or tension.
5) Write analyses in the order of candidates; if evidence is weak, tone like "가능성은 낮지만" is allowed.
6) Output language: All string values in the JSON MUST be written in Korean. Do NOT use English.

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

  const prompt = buildPrompt([
    { title: "Situation", body: situation },
    { title: "Automatic Thought", body: thought },
    {
      title: "Internal Context - English (DO NOT IGNORE)",
      body: buildDeepCognitiveAnalysisInternal(internal),
    },
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
      parse: parseCognitiveErrorsResponse,
      tag: "deepCognitiveAnalysis",
    });
    const arr = parsed;
    const normalized = normalizeCognitiveErrorDetails(arr, uniq);
    const result = { errors: normalized.errors };
    return normalized.usedFallback ? markAiFallback(result, "partial") : result;
  } catch (e) {
    console.error("deep 인지오류 상세 분석 실패(JSON):", e);
    return markAiFallback(fallbackCognitiveErrorDetail(uniq));
  }
}
