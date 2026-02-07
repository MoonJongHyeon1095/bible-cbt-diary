// src/lib/gpt/deepAlternative.ts
import type { AlternativeThought } from "./utils/alternatives/meta";
import { toResultByTechnique } from "./utils/alternatives/meta";
import { type DeepInternalContext } from "./deepContext";
import { parseAlternativesResponse } from "./utils/alternatives/parse";
import { assembleAlternatives } from "./utils/alternatives/assemble";
import { markAiFallback } from "@/lib/utils/aiFallback";
import { buildPrompt } from "./utils/core/prompt";
import { runGptJson } from "./utils/core/run";
import { buildDeepCognitiveAnalysisInternal } from "./utils/deep/analysisPrompt";

const SYSTEM_PROMPT = `
You are a CBT (Cognitive Behavioral Therapy) counselor who answers in Korean.

Based on the user's [Situation], [Emotion], [Negative Automatic Thought], [Identified Cognitive Distortions], [Internal Context - English],
and [Previous Alternatives], generate exactly ONE alternative thought for each of the three techniques below.

[Internal Context - English format]
- deep (PRIMARY): repeatingPatterns / tensions / invariants / conditionalRules / leveragePoints / bridgeHypothesis
- secondary: salient.actors/events/needs/threats/emotions, cbt.topDistortions/coreBeliefsHypothesis

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

  const prompt = buildPrompt([
    { title: "Situation", body: situation },
    { title: "Emotion", body: emotion },
    { title: "Negative Automatic Thought", body: thought },
    {
      title: "Internal Context - English (DO NOT IGNORE)",
      body: buildDeepCognitiveAnalysisInternal(internal),
    },
    { title: "Identified Cognitive Distortions", body: cognitiveErrorText },
    {
      title: "Previous Alternatives",
      body: previousAltText,
      emptyFallback: "(none)",
    },
  ]);

  try {
    const { parsed } = await runGptJson({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
      parse: parseAlternativesResponse,
      tag: "deepAlternative",
    });
    const arr = parsed;
    const normalized = assembleAlternatives(arr);
    const result = normalized.result;
    return normalized.usedFallback ? markAiFallback(result, "partial") : result;
  } catch (error) {
    console.error("deep alternative error:", error);
    return markAiFallback(toResultByTechnique({}));
  }
}
