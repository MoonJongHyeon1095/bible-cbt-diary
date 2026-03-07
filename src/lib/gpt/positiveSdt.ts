import { getSdtRecommendedBehaviors } from "@/lib/constants/sdt-behavior-map";
import { SDT_NEEDS_BY_KEY, type SdtKey } from "@/lib/constants/sdt";
import { markAiFallback } from "@/lib/utils/aiFallback";
import { buildPrompt } from "./utils/core/prompt";
import { parseJsonObject } from "./utils/core/json";
import { runGptJson } from "./utils/core/run";
import { normalizeTextValue } from "./utils/core/text";

export type PositiveSdtCardGenerationResult = {
  innerBelief: string;
  empathyText: string;
  behaviorLabel: string;
  behaviorDescription: string;
  behaviorChecklist: string[];
  reflectionQuestion: string;
};

type RawResponse = {
  inner_belief?: unknown;
  innerBelief?: unknown;
  empathy_text?: unknown;
  empathyText?: unknown;
  behavior_label?: unknown;
  behaviorLabel?: unknown;
  behavior_description?: unknown;
  behaviorDescription?: unknown;
  behavior_check_list?: unknown;
  behaviorChecklist?: unknown;
  reflection_question?: unknown;
  reflectionQuestion?: unknown;
  result?: {
    inner_belief?: unknown;
    innerBelief?: unknown;
    empathy_text?: unknown;
    empathyText?: unknown;
    behavior_label?: unknown;
    behaviorLabel?: unknown;
    behavior_description?: unknown;
    behaviorDescription?: unknown;
    behavior_check_list?: unknown;
    behaviorChecklist?: unknown;
    reflection_question?: unknown;
    reflectionQuestion?: unknown;
  };
};

const SYSTEM_PROMPT = `
You are a positive psychology based emotion coaching expert who answers in Korean.

You will receive:
- [User Journal]
- [Selected Emotions]
- [SDT Label]
- [SDT Definition]
- [SDT Description]
- [Available Behavior Techniques]
- optional [User Hint]

Goal:
Generate one supportive positive-emotion coaching card grounded in the provided SDT axis.

Tone rules:
- Warm, accepting, emotionally attuned.
- Validate the user's positive emotion first.
- Invite gently. Avoid commanding or clinical tone.

Content rules:
1) inner_belief
- Korean only.
- Exactly 2 to 4 sentences.
- Express the user's inner belief/claim/viewpoint implied by the journal and emotions.
- Must reflect the supplied SDT axis.

2) empathy_text
- Korean only.
- Exactly 2 to 3 sentences.
- Warmly affirm the user's emotion while supporting the inner_belief.
- Must mention at least one selected emotion label.

3) behavior_label
- Must be exactly one item from [Available Behavior Techniques].

4) behavior_description
- Korean only.
- Exactly 3 to 5 sentences.
- Must personalize the chosen behavior technique to the user's journal and selected emotions.
- Must include one immediate action and one deeper follow-up action.
- Do not output the checklist here as a list.

5) behavior_check_list
- Korean only.
- JSON array with 2 to 3 short checklist strings.
- Each item must be concrete and executable within daily life.

6) reflection_question
- Korean only.
- Exactly 1 sentence.
- Ask one reflective question grounded in the journal and the positive emotion.

User hint rule:
- If [User Hint] exists, prioritize it while staying faithful to the journal and SDT axis.

Output JSON only:
{
  "inner_belief": "...",
  "empathy_text": "...",
  "behavior_label": "...",
  "behavior_description": "...",
  "behavior_check_list": ["...", "..."],
  "reflection_question": "..."
}
`.trim();

const keyBlock = (raw: string, key: string) => {
  const pattern = new RegExp(
    `(?:^|\\n)\\s*["']?${key}["']?\\s*[:：]\\s*([\\s\\S]*?)(?=\\n\\s*["']?(?:inner_belief|innerBelief|empathy_text|empathyText|behavior_label|behaviorLabel|behavior_description|behaviorDescription|behavior_check_list|behaviorChecklist|reflection_question|reflectionQuestion)["']?\\s*[:：]|$)`,
    "i",
  );
  const match = raw.match(pattern);
  if (!match) return "";
  return normalizeTextValue(
    match[1]
      .trim()
      .replace(/^["'`]+/, "")
      .replace(/["'`]+$/, ""),
  );
};

const normalizeChecklist = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeTextValue(item))
    .filter((item) => item.length > 0)
    .slice(0, 3);
};

function parsePositiveSdtCard(raw: string): PositiveSdtCardGenerationResult | null {
  const parsed = parseJsonObject<RawResponse>(raw);
  const obj = parsed?.result ?? parsed;

  if (obj) {
    return {
      innerBelief: normalizeTextValue(obj.inner_belief ?? obj.innerBelief),
      empathyText: normalizeTextValue(obj.empathy_text ?? obj.empathyText),
      behaviorLabel: normalizeTextValue(obj.behavior_label ?? obj.behaviorLabel),
      behaviorDescription: normalizeTextValue(
        obj.behavior_description ?? obj.behaviorDescription,
      ),
      behaviorChecklist: normalizeChecklist(
        obj.behavior_check_list ?? obj.behaviorChecklist,
      ),
      reflectionQuestion: normalizeTextValue(
        obj.reflection_question ?? obj.reflectionQuestion,
      ),
    };
  }

  const normalized = raw.replace(/\r\n/g, "\n");
  const checklistMatch =
    normalized.match(/["']?(?:behavior_check_list|behaviorChecklist)["']?\s*[:：]\s*(\[[\s\S]*?\])/i);
  const checklist = checklistMatch ? normalizeChecklist(parseJsonObject<unknown>(checklistMatch[1])) : [];

  const innerBelief = keyBlock(normalized, "inner_belief") || keyBlock(normalized, "innerBelief");
  const empathyText = keyBlock(normalized, "empathy_text") || keyBlock(normalized, "empathyText");
  const behaviorLabel = keyBlock(normalized, "behavior_label") || keyBlock(normalized, "behaviorLabel");
  const behaviorDescription =
    keyBlock(normalized, "behavior_description") || keyBlock(normalized, "behaviorDescription");
  const reflectionQuestion =
    keyBlock(normalized, "reflection_question") || keyBlock(normalized, "reflectionQuestion");

  if (!innerBelief || !empathyText || !behaviorLabel || !behaviorDescription || !reflectionQuestion) {
    return null;
  }

  return {
    innerBelief,
    empathyText,
    behaviorLabel,
    behaviorDescription,
    behaviorChecklist: checklist,
    reflectionQuestion,
  };
}

function buildFallbackResult(sdtKey: SdtKey, emotion: string) {
  const need = SDT_NEEDS_BY_KEY[sdtKey];
  const behavior = getSdtRecommendedBehaviors(sdtKey)[0];

  return {
    innerBelief: `이 ${emotion} 감정은 내 삶에서 중요한 것이 살아 있다는 신호일 수 있다. 나는 지금의 경험을 통해 ${need.label}의 의미를 분명하게 느끼고 있다.`,
    empathyText: `${emotion}을 느낀 지금의 마음은 충분히 소중합니다. 이 감정은 스쳐 지나갈 일이 아니라, 지금 나에게 중요한 가치와 연결되어 있다는 뜻일 수 있습니다.`,
    behaviorLabel: behavior.behavior_label,
    behaviorDescription: `${behavior.action} 지금의 경험에 맞게 한 가지를 골라 가볍게 적어보세요. 그리고 ${behavior.advanced_action} 오늘의 감정을 더 오래 붙잡는 작은 연결점이 될 수 있습니다.`,
    behaviorChecklist: [
      "지금 감정을 만든 핵심 장면 한 가지를 적기",
      "오늘 바로 할 수 있는 작은 실천 한 가지 정하기",
    ],
    reflectionQuestion: `지금의 ${emotion}은 내가 무엇을 중요하게 여기고 있다는 사실을 어떻게 보여주나요?`,
  };
}

export async function generatePositiveSdtCard(
  journal: string,
  emotions: string,
  sdtKey: SdtKey,
  userHint?: string,
): Promise<PositiveSdtCardGenerationResult> {
  const need = SDT_NEEDS_BY_KEY[sdtKey];
  const behaviors = getSdtRecommendedBehaviors(sdtKey);
  const behaviorText = behaviors
    .map(
      (behavior) =>
        `${behavior.behavior_label}\n- 설명: ${behavior.description}\n- 실행: ${behavior.action}\n- 심화: ${behavior.advanced_action}`,
    )
    .join("\n\n");

  const prompt = buildPrompt([
    { title: "User Journal", body: journal },
    { title: "Selected Emotions", body: emotions },
    { title: "SDT Label", body: need.label },
    { title: "SDT Definition", body: need.summary },
    { title: "SDT Description", body: need.description },
    { title: "Available Behavior Techniques", body: behaviorText },
    { title: "User Hint", body: userHint ?? "", emptyFallback: "(none)" },
  ]);

  try {
    const { parsed } = await runGptJson({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
      parse: parsePositiveSdtCard,
      tag: "positiveSdtCard",
      requireParsed: false,
    });

    if (!parsed) {
      return markAiFallback(buildFallbackResult(sdtKey, emotions));
    }

    const fallback = buildFallbackResult(sdtKey, emotions);
    return {
      innerBelief: parsed.innerBelief.trim() || fallback.innerBelief,
      empathyText: parsed.empathyText.trim() || fallback.empathyText,
      behaviorLabel: parsed.behaviorLabel.trim() || fallback.behaviorLabel,
      behaviorDescription:
        parsed.behaviorDescription.trim() || fallback.behaviorDescription,
      behaviorChecklist:
        parsed.behaviorChecklist.length > 0
          ? parsed.behaviorChecklist
          : fallback.behaviorChecklist,
      reflectionQuestion:
        parsed.reflectionQuestion.trim() || fallback.reflectionQuestion,
    };
  } catch (error) {
    console.error("positive SDT card generation failed:", error);
    return markAiFallback(buildFallbackResult(sdtKey, emotions));
  }
}
