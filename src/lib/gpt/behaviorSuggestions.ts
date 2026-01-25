// src/lib/gpt/behaviorSuggestions.ts
import type { CognitiveBehaviorId } from "../constants/behaviors";
import { callGptText } from "./client";
import { cleanText, extractJsonObject } from "./cognitiveRank";

type BehaviorMeta = {
  id: CognitiveBehaviorId;
  replacement_title: string;
  category: string;
  description: string;
  usage_description: string;
};

export type BehaviorSuggestionItem = {
  behaviorId: CognitiveBehaviorId;
  suggestion: string;
};

type LlmResponseShape = {
  suggestions?: Array<{
    behaviorId?: CognitiveBehaviorId;
    suggestion?: string;
  }>;
};

// const SYSTEM_PROMPT = `
// 너는 한국어로 답하는 인지치료 상담가다.
// 인지행동치료(CBT) 관점에서 행동기법을 제안하는 전문가 역할을 한다.
// 이전 진행상황으로 [상황], [감정/자동사고], [대안사고], [인지오류], [행동기법 목록]이 제공된다.
// [행동기법 목록]에는 해당 행동기법의 [이름], [설명], [사용방법]이 포함되어 있다.

// 너의 목표:
// - 행동기법 목록의 각 항목에 대해 "행동 제안"을 3~5문장으로 작성한다.
// - 과장된 긍정이나 근거 없는 낙관은 금지한다.

// 출력 규칙:
// - 오직 JSON만 출력한다. (설명/주석/코드블록/불릿 금지)
// - behaviorId는 입력 목록에 있는 값만 사용한다.
// - suggestions 배열은 행동기법 목록의 순서를 유지한다.
// - suggestion은 반드시 3~5문장으로 작성한다.
//   - suggestion의 한 문장은 반드시 구체적인 현재 상황, 감정과 연결되어야 한다.
//   - suggestion의 한 문장은 반드시 대안사고의 내용을 포함하여 작성되어야 한다.
//   - suggestion은 행동기법 목록의 [설명]/[사용방법]의 서술을 절대 그대로 반복하지 않는다. 동어반복을 반드시 피한다.
//   - suggestion은 사용자가 오늘 실행할 수 있는 구체적인 작은 행동으로 제시되어야 한다.

// 출력 스키마:
// {
//   "suggestions": [
//     { "behaviorId": "DOUBLE_STANDARD", "suggestion": "..." }
//   ]
// }
// `.trim();
const SYSTEM_PROMPT = `
You are a cognitive-behavioral therapy (CBT) counselor who responds in Korean.
You are an expert who suggests behavioral techniques from a CBT perspective.
You are given the prior context: [Situation], [Emotions/Automatic Thoughts], [Alternative Thought], [Cognitive Distortions], and [Behavior Technique List].
The [Behavior Technique List] includes each technique's [Name], [Description], and [How to Use].

Your goal:
- For each item in the behavior technique list, write a "behavioral suggestion" in 3–5 sentences.
- Do NOT use exaggerated positivity or baseless optimism.

Output rules:
- Output JSON only. (No explanations, comments, code blocks, or bullet points.)
- behaviorId must use only values that appear in the input list.
- The suggestions array must preserve the order of the behavior technique list.
- suggestion must be written in 3–5 sentences.
  - One sentence must explicitly connect to the user's specific current situation and emotion.
  - One sentence must explicitly include the content of the alternative thought.
  - Never repeat the wording of the [Description]/[How to Use] from the technique list verbatim. Avoid redundancy and tautology.
  - Suggestions must be concrete, small actions the user can do today.

Output schema:
{
  "suggestions": [
    { "behaviorId": "DOUBLE_STANDARD", "suggestion": "..." }
  ]
}

Language constraint:
- All string values in the JSON MUST be written in Korean.
`.trim();

// const SYSTEM_PROMPT_SINGLE = `
// 너는 한국어로 답하는 인지치료 상담가다.
// 인지행동치료(CBT) 관점에서 행동기법을 제안하는 전문가 역할을 한다.
// 이전 진행상황으로 [상황], [감정/자동사고], [대안사고], [인지오류], [행동기법 1개]가 제공된다.
// [행동기법 1개]에는 해당 행동기법의 [이름], [설명], [사용방법]이 포함되어 있다.

// 너의 목표:
// - 제공된 행동기법 1개에 대해 "행동 제안"을 3~5문장으로 작성한다.
// - 과장된 긍정이나 근거 없는 낙관은 금지한다.

// 출력 규칙:
// - 오직 JSON만 출력한다. (설명/주석/코드블록/불릿 금지)
// - behaviorId는 입력에 있는 값만 사용한다.
// - suggestion은 반드시 3~5문장으로 작성한다.
//   - suggestion의 한 문장은 반드시 구체적인 현재 상황, 감정과 연결되어야 한다.
//   - suggestion의 한 문장은 반드시 대안사고의 내용을 포함하여 작성되어야 한다.
//   - suggestion은 행동기법 목록의 [설명]/[사용방법]의 서술을 절대 그대로 반복하지 않는다. 동어반복을 반드시 피한다.
//   - suggestion은 사용자가 오늘 실행할 수 있는 구체적인 작은 행동으로 제시되어야 한다.

// 출력 스키마:
// {
//   "suggestions": [
//     { "behaviorId": "DOUBLE_STANDARD", "suggestion": "..." }
//   ]
// }
// `.trim();
const SYSTEM_PROMPT_SINGLE = `
You are a cognitive-behavioral therapy (CBT) counselor who responds in Korean.
You are an expert who suggests behavioral techniques from a CBT perspective.
You are given the prior context: [Situation], [Emotions/Automatic Thoughts], [Alternative Thought], [Cognitive Distortions], and [One Behavior Technique].
The [One Behavior Technique] includes the technique's [Name], [Description], and [How to Use].

Your goal:
- For the single provided behavior technique, write a "behavioral suggestion" in 3–5 sentences.
- Do NOT use exaggerated positivity or baseless optimism.

Output rules:
- Output JSON only. (No explanations, comments, code blocks, or bullet points.)
- behaviorId must use only the value that appears in the input.
- suggestion must be written in 3–5 sentences.
  - One sentence must explicitly connect to the user's specific current situation and emotion.
  - One sentence must explicitly include the content of the alternative thought.
  - Never repeat the wording of the [Description]/[How to Use] verbatim. Avoid redundancy and tautology.
  - The suggestion must be a concrete, small action the user can do today.

Output schema:
{
  "suggestions": [
    { "behaviorId": "DOUBLE_STANDARD", "suggestion": "..." }
  ]
}

Language constraint:
- All string values in the JSON MUST be written in Korean.
`.trim();

function buildFallbackSuggestion(behavior: BehaviorMeta) {
  return `지금 상황에 맞게 ${behavior.replacement_title}을(를) 1회만 적용해 보세요. ${behavior.usage_description}`;
}

export async function generateBehaviorSuggestions(
  situation: string,
  emotionThoughtPairs: Array<{
    emotion: string;
    intensity: number | null;
    thought: string;
  }>,
  selectedAlternativeThought: string,
  cognitiveErrors: Array<{ title: string; detail?: string }>,
  behaviors: BehaviorMeta[],
): Promise<BehaviorSuggestionItem[]> {
  const emotionThoughtText = emotionThoughtPairs
    .map((pair) => {
      const intensity = pair.intensity != null ? `(${pair.intensity}/100)` : "";
      const thought = pair.thought
        ? ` / Automatic Thought: ${pair.thought}`
        : "";
      return `- ${pair.emotion}${intensity}${thought}`;
    })
    .join("\n");

  const cognitiveErrorText = cognitiveErrors
    .map((err) => (err.detail ? `${err.title}: ${err.detail}` : err.title))
    .join(", ");

  const behaviorsText = behaviors
    .map((b, index) =>
      `
${index + 1}) behaviorId: ${b.id}
Name: ${b.replacement_title}
Description: ${b.description}
How to Use: ${b.usage_description}
`.trim(),
    )
    .join("\n\n");

  const prompt = `
[Situation]
${situation}

[Emotions/Automatic Thoughts]
${emotionThoughtText || "- (없음)"}

[Selected Alternative Thought]
${selectedAlternativeThought || "(없음)"}

[Cognitive Distortions]
${cognitiveErrorText || "(없음)"}

[Behavior Techniques]
${behaviorsText}
`.trim();

  try {
    const systemPrompt =
      behaviors.length === 1 ? SYSTEM_PROMPT_SINGLE : SYSTEM_PROMPT;
    const raw = await callGptText(prompt, {
      systemPrompt,
      model: "gpt-4o-mini",
    });

    const jsonText = extractJsonObject(raw);
    if (!jsonText) throw new Error("No JSON object in LLM output (behavior)");

    const parsed = JSON.parse(jsonText) as LlmResponseShape;
    const arr = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];

    const byId = new Map<CognitiveBehaviorId, string>();
    for (const item of arr) {
      if (!item?.behaviorId) continue;
      if (!behaviors.some((b) => b.id === item.behaviorId)) continue;
      const s = cleanText(item?.suggestion);
      if (!s) continue;
      if (byId.has(item.behaviorId)) continue;
      byId.set(item.behaviorId, s);
    }

    return behaviors.map((behavior) => ({
      behaviorId: behavior.id,
      suggestion: byId.get(behavior.id) ?? buildFallbackSuggestion(behavior),
    }));
  } catch (e) {
    console.error("행동 제안 생성 실패(JSON):", e);
    return behaviors.map((behavior) => ({
      behaviorId: behavior.id,
      suggestion: buildFallbackSuggestion(behavior),
    }));
  }
}
