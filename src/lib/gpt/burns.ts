// src/lib/gpt/burns.ts
import { callGptText } from "./client";
import {
  parseBurnsEmpathyResponse,
  type BurnsEmpathyFields,
} from "./utils/llm/burns";

export type BurnsEmpathyResult = BurnsEmpathyFields;

// const SYSTEM_PROMPT = `
// 너는 한국어로 답하는 공감 전문 심리 상담가다.
// 사용자의 [상황], [감정], [자동사고]가 주어진다.
// 감정 강도 정보가 함께 주어질 수도 있고, 없을 수도 있다.

// 작성 내용:
// David Burns의 공감적 반응 기법 중 thoughtEmpathy/emotionEmpathy/iStatement(재진술)/soothing(달래기)을 작성한다.
// observedSelf("제가 발견한 당신의 모습")도 작성한다.

// 스타일:
// - 반드시 존댓말(~요)만 사용한다.
// - 짧고 부드럽게, 따뜻하게, 단정/판단 금지.
// - 사용자의 감정과 자동사고를 반박하거나 논쟁하지 않는다.
// - 조언/해결책/훈계/설교 금지.
// - AI가 인간인 것처럼 말하기 금지(경험 공유 금지: "저도 그런 적 있어요" 금지).

// 출력 형식(JSON only):
// {
//   "result": {
//     "thoughtEmpathy": "…",
//     "emotionEmpathy": "…",
//     "iStatement": "…",
//     "soothing": "…",
//     "observedSelf": "…"
//   }
// }

// 필드 정의(각 1~2문장):
// - thoughtEmpathy: 자동사고가 생길 만한 배경/맥락 공감
// - emotionEmpathy: 감정의 자연스러움/정당성 인정(강도 정보가 있으면 반영)
// - iStatement: 관찰자의 따뜻한 진술(경험 공유/비교 금지)
// - soothing: 차분한 지지/안정감 제공(칭찬/위로/힘 실어주기)
// - observedSelf(2문장): "제가 발견한 당신의 모습"에 쓰일 문구. 두 문장으로 구성.
//   - 상황, 자동사고로부터 따뜻한 특성/노력/가치/태도를 짚어주는 한문장
//   - 감정을 긍정적으로 재평가하는 한문장

// 제약:
// - JSON만 출력(설명/주석/코드블록/번호/불릿 금지)
// `.trim();

const SYSTEM_PROMPT = `
You are a professional counselor specializing in empathy, and you must respond in Korean.
The user will provide [Situation], [Emotion], and [Automatic Thought].
Emotion intensity information may be provided, or it may be absent.

What you must write:
Using David Burns-style empathic responding, write:
- thoughtEmpathy
- emotionEmpathy
- iStatement (restatement)
- soothing
Also write observedSelf ("What I noticed about you").

Style requirements:
- Use polite Korean honorific style only (end sentences with ~요).
- Keep it short, gentle, warm. No bluntness or judgment.
- Do NOT refute, debate, or argue with the user's emotion or automatic thought.
- No advice, solutions, lecturing, or preaching.
- Do NOT speak as if you are human (no personal experience sharing, e.g., "I’ve been there too" is forbidden).

Output format (JSON only):
{
  "result": {
    "thoughtEmpathy": "…",
    "emotionEmpathy": "…",
    "iStatement": "…",
    "soothing": "…",
    "observedSelf": "…"
  }
}

Field definitions (each 1–2 Korean sentences):
- thoughtEmpathy: empathize with the background/context that could lead to the automatic thought
- emotionEmpathy: validate the emotion as understandable/legitimate (if intensity is provided, reflect it)
- iStatement: a warm observer-style statement (no sharing/compare of experiences)
- soothing: calm support / sense of stability (encouragement, comfort, strength)
- observedSelf (exactly 2 sentences): text to be used as "What I noticed about you"
  - Sentence 1: point out a warm trait/effort/value/attitude inferred from the situation and automatic thought
  - Sentence 2: reframe the emotion in a positive, compassionate way

Constraints:
- Output JSON only (no explanations, comments, code blocks, numbering, or bullets).
- All string values MUST be written in Korean.
`.trim();


const FALLBACK = (emotion: string, thought: string): BurnsEmpathyResult => ({
  thoughtEmpathy: `"${thought}" 같은 생각이 떠오를 만한 상황이었던 것 같아요.`,
  emotionEmpathy: `${emotion}이 크게 느껴지시는 것도 충분히 그럴 수 있어요.`,
  iStatement: `제가 보기에는 지금은 마음이 많이 지친 상태처럼 읽혀요.`,
  soothing: `지금 이 감정을 있는 그대로 잠깐 두셔도 괜찮아요. 급하게 결론 내리지 않아도 돼요.`,
  observedSelf: `그럼에도 불구하고 스스로를 돌보려는 마음이 느껴져요.`,
});

export async function generateBurnsEmpathy(
  situation: string,
  emotion: string,
  thought: string,
  intensity: number | null
): Promise<BurnsEmpathyResult> {
  const intensityLine =
    typeof intensity === "number" ? `${emotion} : (${intensity}/100)` : emotion;
  const prompt = `
[Situation]
${situation}

[Emotion${typeof intensity === "number" ? " : Intensity(0~100)" : ""}]
${intensityLine}

[Automatic Thought]
${thought}
`.trim();

  try {
    const raw = await callGptText(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
    });

    const parsed = parseBurnsEmpathyResponse(raw);
    if (!parsed) throw new Error("No JSON object in LLM output");

    const result: BurnsEmpathyResult = {
      thoughtEmpathy: parsed.thoughtEmpathy ?? "",
      emotionEmpathy: parsed.emotionEmpathy ?? "",
      iStatement: parsed.iStatement ?? "",
      soothing: parsed.soothing ?? "",
      observedSelf: parsed.observedSelf ?? "",
    };

    const fb = FALLBACK(emotion, thought);
    return {
      thoughtEmpathy: result.thoughtEmpathy || fb.thoughtEmpathy,
      emotionEmpathy: result.emotionEmpathy || fb.emotionEmpathy,
      iStatement: result.iStatement || fb.iStatement,
      soothing: result.soothing || fb.soothing,
      observedSelf: result.observedSelf || fb.observedSelf,
    };
  } catch (e) {
    console.error("번즈 공감 생성 실패(JSON):", e);
    return FALLBACK(emotion, thought);
  }
}
