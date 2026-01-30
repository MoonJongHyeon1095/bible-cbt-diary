// src/lib/gpt/deepCognitiveRank.ts
import { callGptText } from "./client";
import {
  cleanText,
  defaultRank,
  extractJsonObject,
  isValidIndex,
  type CognitiveErrorRankResult,
  type ErrorIndex,
} from "./cognitiveRank";

type RankLlmResponseShape = {
  ranked?: Array<{
    index?: ErrorIndex;
    reason?: string;
    evidenceQuote?: string;
  }>;
};

const RANK_SYSTEM_PROMPT = `
You are an expert who ranks the likelihood of "cognitive distortions" from a Cognitive Behavioral Therapy (CBT) perspective.

The input is provided as [Situation] and [Automatic Thought].
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
   (e.g., “…로 보입니다.” / “…로 의심됩니다.” / “…에 해당합니다.”).

Output schema:
{
  "ranked": [
    { "index": 1, "evidenceQuote": "...", "reason": "..." }
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

export async function rankDeepCognitiveErrors(
  situation: string,
  thought: string,
): Promise<CognitiveErrorRankResult> {
  const prompt = `
[Situation]
${situation}

[Automatic Thought]
${thought}
`.trim();

  try {
    const raw = await callGptText(prompt, {
      systemPrompt: RANK_SYSTEM_PROMPT,
      model: "gpt-4o-mini",
    });

    const jsonText = extractJsonObject(raw);
    if (!jsonText) throw new Error("No JSON object in LLM output (rank)");

    const parsed = JSON.parse(jsonText) as RankLlmResponseShape;
    const arr = Array.isArray(parsed?.ranked) ? parsed.ranked : [];

    const seen = new Set<number>();
    const ranked: CognitiveErrorRankResult["ranked"] = [];

    for (const item of arr) {
      const idx = item?.index;
      if (!isValidIndex(idx)) continue;
      if (seen.has(idx)) continue;

      seen.add(idx);

      const reason =
        cleanText(item?.reason) || "가능성을 평가했지만 근거가 제한적입니다.";
      const evidenceQuote = cleanText(item?.evidenceQuote);

      ranked.push({
        index: idx,
        reason,
        ...(evidenceQuote ? { evidenceQuote } : {}),
      });
    }

    if (ranked.length !== 10) return defaultRank();

    return { ranked };
  } catch (e) {
    console.error("deep 인지오류 랭킹 실패(JSON):", e);
    return defaultRank();
  }
}
