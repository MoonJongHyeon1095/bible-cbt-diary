import {
  COGNITIVE_BEHAVIORS,
  type CognitiveBehaviorId
} from "@/lib/constants/behaviors";
import { getRecommendedBehaviors } from "@/lib/constants/errorBehaviorMap";
import { COGNITIVE_ERRORS, type CognitiveErrorId } from "@/lib/constants/errors";
import { markAiFallback } from "@/lib/utils/aiFallback";
import { parseBehaviorSuggestionsResponse } from "./utils/behavior/parse";
import { buildPrompt } from "./utils/core/prompt";
import { runGptJson } from "./utils/core/run";
import { cleanText } from "./utils/core/text";

type BehaviorMeta = (typeof COGNITIVE_BEHAVIORS)[number];

export type BehaviorSuggestionItem = {
  behaviorId: CognitiveBehaviorId;
  suggestion: string;
  checks: string[];
};

const SYSTEM_PROMPT = `
You are a CBT counselor responding in Korean.
You are given [Situation], [Emotion/Thought], [Alternative Thought], [Cognitive Distortion], and [Behavior Technique List].

Goal:
- For each behavior technique, create:
  1) a behavioral suggestion in 3-5 Korean sentences
  2) a checklist with 1-3 concrete items the user can actually complete today

Output rules:
- Output JSON only.
- behaviorId values must exist in input list.
- Keep suggestions array order identical to input behavior list order.
- suggestion must include the user's current situation/emotion and alternative thought.
- checks must be short, action-oriented Korean phrases.
- checks length must be 1-3.
- Avoid exaggerated optimism and avoid copying behavior description text verbatim.

Output schema:
{
  "suggestions": [
    {
      "behaviorId": "DOUBLE_STANDARD",
      "suggestion": "...",
      "checks": ["...", "..."]
    }
  ]
}
`.trim();

const DEFAULT_ERROR_ID: CognitiveErrorId = "ALL_OR_NOTHING";

function resolveErrorIdFromLabel(errorLabel: string): CognitiveErrorId {
  const normalized = String(errorLabel ?? "").trim();
  if (!normalized) return DEFAULT_ERROR_ID;

  const exact = COGNITIVE_ERRORS.find((item) => item.title === normalized);
  if (exact) return exact.id;

  return DEFAULT_ERROR_ID;
}

export function pickBehaviorsForErrorLabel(errorLabel: string): BehaviorMeta[] {
  const errorId = resolveErrorIdFromLabel(errorLabel);
  return getRecommendedBehaviors(errorId).slice(0, 3);
}

function fallbackChecks(behavior: BehaviorMeta): string[] {
  return [
    `${behavior.replacement_title} 1회 시도`,
    "실행 전후 감정 점수 0~100 기록",
    "실행 후 한 줄 느낀점 작성",
  ];
}

function fallbackSuggestion(behavior: BehaviorMeta): string {
  return `${behavior.replacement_title}을(를) 오늘 한 번만 실험하듯 시도해 보세요. ${behavior.usage_description}`;
}

export async function generateBehaviorSuggestionsWithChecks(input: {
  situation: string;
  emotionTags: string[];
  thought: string;
  alternativeThought: string;
  errorLabel: string;
  errorDescription: string;
  behaviors: BehaviorMeta[];
  noteProposal?: boolean;
}): Promise<BehaviorSuggestionItem[]> {
  const behaviors = input.behaviors.length > 0 ? input.behaviors : pickBehaviorsForErrorLabel(input.errorLabel);
  const behaviorText = behaviors
    .map(
      (item, index) =>
        `${index + 1}) behaviorId: ${item.id}\nName: ${item.replacement_title}\nDescription: ${item.description}\nHow to Use: ${item.usage_description}`,
    )
    .join("\n\n");

  const prompt = buildPrompt([
    { title: "Situation", body: input.situation },
    {
      title: "Emotion/Thought",
      body: `Emotions: ${(input.emotionTags ?? []).join(", ")}\nThought: ${input.thought}`,
      emptyFallback: "Emotions: (없음)\nThought: (없음)",
    },
    { title: "Alternative Thought", body: input.alternativeThought, emptyFallback: "(없음)" },
    {
      title: "Cognitive Distortion",
      body: [input.errorLabel, input.errorDescription].filter(Boolean).join(" / "),
      emptyFallback: "(없음)",
    },
    { title: "Behavior Technique List", body: behaviorText },
  ]);

  try {
    const { parsed } = await runGptJson({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
      noteProposal: input.noteProposal,
      parse: (raw) => parseBehaviorSuggestionsResponse<CognitiveBehaviorId>(raw),
      tag: "behaviorSuggestion",
    });

    const byId = new Map<CognitiveBehaviorId, BehaviorSuggestionItem>();
    for (const item of parsed ?? []) {
      if (!item?.behaviorId) continue;
      if (!behaviors.some((behavior) => behavior.id === item.behaviorId)) continue;
      const suggestion = cleanText(item.suggestion);
      const checks = Array.isArray(item.checks)
        ? item.checks.map((check) => cleanText(check)).filter((check) => check.length > 0).slice(0, 3)
        : [];
      if (!suggestion) continue;
      if (byId.has(item.behaviorId)) continue;
      byId.set(item.behaviorId, {
        behaviorId: item.behaviorId,
        suggestion,
        checks: checks.length > 0 ? checks : fallbackChecks(behaviors.find((behavior) => behavior.id === item.behaviorId)!),
      });
    }

    const merged = behaviors.map((behavior) => {
      const fromAi = byId.get(behavior.id);
      if (fromAi) return fromAi;
      return {
        behaviorId: behavior.id,
        suggestion: fallbackSuggestion(behavior),
        checks: fallbackChecks(behavior),
      };
    });
    const usedFallback = merged.some((item) => !byId.has(item.behaviorId));
    return usedFallback ? markAiFallback(merged, "partial") : merged;
  } catch (error) {
    console.error("행동 제안 생성 실패:", error);
    return markAiFallback(
      behaviors.map((behavior) => ({
        behaviorId: behavior.id,
        suggestion: fallbackSuggestion(behavior),
        checks: fallbackChecks(behavior),
      })),
    );
  }
}
