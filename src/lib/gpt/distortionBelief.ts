import { COGNITIVE_ERRORS } from "@/lib/constants/errors";
import { markAiFallback } from "@/lib/utils/aiFallback";
import type { DeepInternalContext } from "./deepContext";
import { buildPrompt } from "./utils/core/prompt";
import { runGptJson } from "./utils/core/run";
import { parseJsonObject } from "./utils/core/json";
import { normalizeTextValue } from "./utils/core/text";
import { buildDeepCognitiveAnalysisInternal } from "./utils/deep/analysisPrompt";

export type DistortionCardGenerationResult = {
  innerBelief: string;
  analysis: string;
  emotionReason: string;
};

type RawResponse = {
  result?: {
    innerBelief?: unknown;
    inner_belief?: unknown;
    analysis?: unknown;
    emotionReason?: unknown;
    emotion_reason?: unknown;
  };
  innerBelief?: unknown;
  inner_belief?: unknown;
  analysis?: unknown;
  emotionReason?: unknown;
  emotion_reason?: unknown;
};

const MINIMAL_SYSTEM_PROMPT = `
You are a CBT (Cognitive Behavioral Therapy) counselor who answers in Korean.

You will receive:
- [Situation]
- [Emotion]
- [Selected Distortion]
- [Selected Distortion Description]
- optional [User Hint]

Goal:
Generate BOTH:
1) one inner-belief paragraph,
2) one distortion-analysis paragraph,
3) one emotion-reason sentence.

Rules for innerBelief:
- Korean only, first-person automatic-thought voice.
- Exactly 4 Korean sentences in one paragraph.
- Sentence 1-2: hidden core claim/belief/viewpoint (card-ready).
- Sentence 3-4: feared consequence/meaning/rule that follows from the belief.
- Do NOT stay on surface thought; make negative interpretation and feared outcome explicit.
- Avoid vague life-philosophy statements.
- Keep tightly connected to current situation and relationship context.
- Do NOT copy or restate the situation text verbatim.
- Reflect situation + emotion + selected distortion.
- If User Hint exists, prioritize it without breaking anchors.
- NEVER include the selected distortion title text verbatim.
- Do NOT use label-like wording such as naming a cognitive distortion category.

Rules for analysis:
- Korean only, exactly 3 to 5 sentences in one paragraph.
- Do NOT provide textbook definition.
- MUST use [Selected Distortion Description] as the analysis rubric.
- Map the innerBelief wording to the distortion description and explain where the mismatch/inference jump happens.
- Do not write a generic CBT comment that could fit any distortion.
- Include at least one sentence that explicitly connects the user's belief pattern to the selected distortion's defining mechanism.
- Final sentence must mention emotion intensification risk and include one specific clarifying question.

Rules for emotionReason:
- Korean only, exactly 1 sentence.
- Explain why the above innerBelief creates the current emotion.
- Must reference the selected emotion label explicitly.
- Write only as supporting explanation for understanding the belief.

Output JSON only:
{
  "innerBelief": "...",
  "analysis": "...",
  "emotionReason": "..."
}
`.trim();

const DEEP_SYSTEM_PROMPT = `
You are a CBT (Cognitive Behavioral Therapy) counselor who answers in Korean.

You will receive:
- [Situation]
- [Emotion]
- [Selected Distortion]
- [Selected Distortion Description]
- optional [User Hint]
- [Internal Context - English]

Goal:
Generate BOTH:
1) one inner-belief paragraph,
2) one distortion-analysis paragraph,
3) one emotion-reason sentence.

Anchor priority (MUST):
1) internal.deep (conditionalRules, invariants, tensions, bridgeHypothesis) is PRIMARY.
2) Situation/Emotion/Selected Distortion are SECONDARY anchors.
3) User Hint (if provided) refines wording but must not break anchors.

Rules for innerBelief:
- Korean only, first-person automatic-thought voice.
- Exactly 4 Korean sentences in one paragraph.
- Sentence 1-2: hidden core claim/belief/viewpoint (card-ready).
- Sentence 3-4: negative consequence/meaning/rule that follows from the belief.
- Do NOT stay on surface thought; make negative interpretation and feared outcome explicit.
- Avoid vague life-philosophy statements.
- Keep tightly connected to current situation and relationship context.
- Do NOT copy or restate the situation text verbatim.
- Must be consistent with internal.deep.conditionalRules/invariants/tensions.
- NEVER include the selected distortion title text verbatim.
- Do NOT use label-like wording such as naming a cognitive distortion category.

Rules for analysis:
- Korean only, exactly 3 to 5 sentences in one paragraph.
- Do NOT provide textbook definition.
- MUST use [Selected Distortion Description] as the analysis rubric.
- Map the innerBelief wording to the distortion description and explain where the mismatch/inference jump happens.
- Do not write a generic CBT comment that could fit any distortion.
- Include at least one sentence that explicitly connects the user's belief pattern to the selected distortion's defining mechanism.
- Explicitly reflect at least one internal.deep conditional rule/invariant and one tension/bridge hypothesis.
- Final sentence must mention emotion intensification risk and include one specific clarifying question.

Rules for emotionReason:
- Korean only, exactly 1 sentence.
- Explain why the above innerBelief creates the current emotion.
- Must reference the selected emotion label explicitly.
- Write only as supporting explanation for understanding the belief.

Output JSON only:
{
  "innerBelief": "...",
  "analysis": "...",
  "emotionReason": "..."
}
`.trim();

const buildFallbackInnerBelief = (emotion: string) =>
  `${emotion}을 느끼는 지금 나는 작은 단서만으로도 내가 이미 불리한 위치에 있다고 믿게 된다. 상대의 반응을 곧 나의 가치 판단으로 받아들이며 스스로를 먼저 낮춰 버린다. 이렇게 해석이 굳어지면 결국 관계에서 내가 먼저 밀려나거나 버려질 거라고 예상하게 된다. 그 예상을 피하려고 더 조급하게 판단할수록 두려움이 더 커진다.`;

const buildFallbackAnalysis = (distortionTitle: string) =>
  `${distortionTitle} 관점에서 보면 현재 문장은 일부 단서를 전체 의미로 확대해 결론을 빠르게 확정하는 흐름을 보입니다. 이렇게 해석이 굳어지면 사실 확인보다 예측이 먼저 작동해 감정 반응이 더 강해질 수 있습니다. 판단을 확정하기 전에 근거와 해석을 분리해 확인하면 왜곡 강도를 낮출 수 있습니다. 이 흐름이 이어지면 감정이 더 커질 수 있는데, 지금 결론을 직접 지지하는 증거는 정확히 무엇인가요?`;

const buildFallbackEmotionReason = (emotion: string) =>
  `이 믿음은 작은 단서도 위협으로 해석하게 만들어 ${emotion} 감정을 빠르게 증폭시킵니다.`;

function sanitizeInnerBelief(
  innerBelief: string,
  distortionTitle: string,
): string {
  if (!innerBelief) return "";
  if (!distortionTitle.trim()) return innerBelief;
  return innerBelief.split(distortionTitle).join("이 해석").trim();
}

function parseDistortionCard(raw: string): DistortionCardGenerationResult | null {
  const parsed = parseJsonObject<RawResponse>(raw);
  if (!parsed) return null;
  const obj = parsed.result ?? parsed;
  return {
    innerBelief: normalizeTextValue(obj.innerBelief ?? obj.inner_belief),
    analysis: normalizeTextValue(obj.analysis),
    emotionReason: normalizeTextValue(obj.emotionReason ?? obj.emotion_reason),
  };
}

export async function generateDistortionCard(
  situation: string,
  emotion: string,
  distortionTitle: string,
  userHint?: string,
): Promise<DistortionCardGenerationResult> {
  const meta = COGNITIVE_ERRORS.find((item) => item.title === distortionTitle);
  const prompt = buildPrompt([
    { title: "Situation", body: situation },
    { title: "Emotion", body: emotion },
    { title: "Selected Distortion", body: distortionTitle },
    {
      title: "Selected Distortion Description",
      body: meta?.description ?? "",
      emptyFallback: "(none)",
    },
    {
      title: "User Hint",
      body: userHint ?? "",
      emptyFallback: "(none)",
    },
  ]);

  try {
    const { parsed } = await runGptJson({
      prompt,
      systemPrompt: MINIMAL_SYSTEM_PROMPT,
      model: "gpt-4o-mini",
      parse: parseDistortionCard,
      tag: "distortionCard",
      requireParsed: true,
    });

    const innerBelief = sanitizeInnerBelief(
      parsed.innerBelief.trim(),
      distortionTitle,
    );
    const analysis = parsed.analysis.trim();
    const emotionReason = parsed.emotionReason.trim();

    if (!innerBelief || !analysis || !emotionReason) {
      return markAiFallback({
        innerBelief: innerBelief || buildFallbackInnerBelief(emotion),
        analysis: analysis || buildFallbackAnalysis(distortionTitle),
        emotionReason: emotionReason || buildFallbackEmotionReason(emotion),
      });
    }

    return { innerBelief, analysis, emotionReason };
  } catch (error) {
    console.error("distortion card generation failed:", error);
    return markAiFallback({
      innerBelief: buildFallbackInnerBelief(emotion),
      analysis: buildFallbackAnalysis(distortionTitle),
      emotionReason: buildFallbackEmotionReason(emotion),
    });
  }
}

export async function generateDeepDistortionCard(
  situation: string,
  emotion: string,
  distortionTitle: string,
  internalContext: DeepInternalContext,
  userHint?: string,
): Promise<DistortionCardGenerationResult> {
  const meta = COGNITIVE_ERRORS.find((item) => item.title === distortionTitle);
  const prompt = buildPrompt([
    { title: "Situation", body: situation },
    { title: "Emotion", body: emotion },
    { title: "Selected Distortion", body: distortionTitle },
    {
      title: "Selected Distortion Description",
      body: meta?.description ?? "",
      emptyFallback: "(none)",
    },
    {
      title: "User Hint",
      body: userHint ?? "",
      emptyFallback: "(none)",
    },
    {
      title: "Internal Context - English (PRIMARY ANCHOR)",
      body: buildDeepCognitiveAnalysisInternal(internalContext),
    },
  ]);

  try {
    const { parsed } = await runGptJson({
      prompt,
      systemPrompt: DEEP_SYSTEM_PROMPT,
      model: "gpt-4o-mini",
      parse: parseDistortionCard,
      tag: "deepDistortionCard",
      requireParsed: true,
    });

    const innerBelief = sanitizeInnerBelief(
      parsed.innerBelief.trim(),
      distortionTitle,
    );
    const analysis = parsed.analysis.trim();
    const emotionReason = parsed.emotionReason.trim();

    if (!innerBelief || !analysis || !emotionReason) {
      return markAiFallback({
        innerBelief: innerBelief || buildFallbackInnerBelief(emotion),
        analysis: analysis || buildFallbackAnalysis(distortionTitle),
        emotionReason: emotionReason || buildFallbackEmotionReason(emotion),
      });
    }

    return { innerBelief, analysis, emotionReason };
  } catch (error) {
    console.error("deep distortion card generation failed:", error);
    return markAiFallback({
      innerBelief: buildFallbackInnerBelief(emotion),
      analysis: buildFallbackAnalysis(distortionTitle),
      emotionReason: buildFallbackEmotionReason(emotion),
    });
  }
}
