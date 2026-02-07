// src/lib/gpt/deepCognitiveRank.ts
import { defaultRank, type CognitiveErrorRankResult } from "./cognitiveRank";
import { parseCognitiveRankResponse } from "./utils/cognitive/parseRank";
import { formatCognitiveErrorsReference } from "./utils/cognitive/prompt";
import { normalizeCognitiveRank } from "./utils/cognitive/rankNormalize";
import { buildPrompt } from "./utils/core/prompt";
import { runGptJson } from "./utils/core/run";

const COGNITIVE_ERRORS_REFERENCE = formatCognitiveErrorsReference();

const RANK_SYSTEM_PROMPT = `
You are an expert who ranks the likelihood of "cognitive distortions" from a Cognitive Behavioral Therapy (CBT) perspective.

The input is provided as [Situation] and [Automatic Thought].
You will also receive a Cognitive Distortion Reference (index, name, description).
Your goals:
- Sort all 10 cognitive distortions below in order from most likely to least likely. (Include all indices 1–10, no duplicates.)
- "evidenceQuote": MUST be copied verbatim from [Automatic Thought]. (No paraphrasing or summarizing.)
- "reason": Explain (1–2 sentences) why that distortion is plausible, based on the evidenceQuote and situation, but WITHOUT copying or quoting the evidenceQuote text.

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

export async function rankDeepCognitiveErrors(
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
      tag: "deepCognitiveRank",
    });
    const arr = parsed;
    return normalizeCognitiveRank(arr);
  } catch (e) {
    console.error("deep 인지오류 랭킹 실패(JSON):", e);
    return defaultRank();
  }
}
