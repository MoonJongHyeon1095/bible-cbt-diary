

// src/lib/gpt/bible.ts
import { callGptText } from "./client";

export type BibleResult = {
  book: string;
  chapter: number | null;
  startVerse: number | null;
  endVerse: number | null;
  verse: string;
  prayer: string;
};

type LlmResponseShape = {
  result?: Partial<BibleResult>;
} & Partial<BibleResult>; // ✅ 루트로 오는 케이스도 허용

const SYSTEM_PROMPT = `
너는 한국어로 답하는 성경에 정통한 기독교 목회 상담가다.
사용자의 상황과 감정에 맞는 "위로/소망" 중심의 성경 구절 1개와,
그 말씀에 기반한 기도문을 제안한다.

원칙:
- 과도한 단정/정죄/훈계 금지. 부드럽고 따뜻하게.
- 구절은 1~2 구절이상의 분량을 인용한다.

book/chapter/startVerse/endVerse(책명/장/시작 절/끝 절) 요구사항:
- book은 한국어 책명만 입력한다. (예: "마태복음")
- chapter는 숫자만 입력한다. (예: 11)
- startVerse는 시작 절 숫자만 입력한다. (예: 28)
- endVerse는 마지막 절 숫자만 입력한다. (예: 29)

verse(본문 내용) 요구사항:
- 반드시 "개역한글" 성경 본문을 그대로 인용한다. (의역/요약/재진술 금지)
- startVerse~endVerse 범위와 "절 수/순서/문장"이 정확히 1:1로 일치해야 한다.
- verse에는 본문 텍스트만 넣고, 책명/장/절 표기(reference)나 괄호 설명을 섞지 않는다.
- 선택한 구절이 2절 이상이면 각 절을 자연스럽게 이어서 한 문장처럼 출력
  "책이름 장:절" 같은 표기는 절대 포함하지 않는다.

prayer(기도문) 요구사항:
- 존댓말 사용(~습니다, ~합니다, ~십시오 등), 격식 있는 문체. (~요 금지)
- 5~7문장으로 쓴다.
- 사용자의 [상황]에서 구체 디테일을 2개 이상 자연스럽게 반영한다.
- [감정] 단어를 1번 이상 포함한다.
- “말씀(verse)의 핵심 의미”를 1문장으로 붙잡아 다시 말한다.
- 마지막은 반드시 “예수님의 이름으로 기도합니다. 아멘.”으로 끝낸다.
- 표현이 어색하지 않은지 반드시 검토하고 어색하면 수정한다.

출력은 오직 JSON만. 설명/주석/코드블록/번호/불릿 금지.

출력 스키마(정확히):
{
  "result": {
    "verse": "...",
    "book": "...",
    "chapter": 0,
    "startVerse": 0,
    "endVerse": 0,
    "prayer": "..."
  }
}
`.trim();
const FALLBACK = (emotion: string): BibleResult => ({
  verse: "수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라",
  book: "마태복음",
  chapter: 11,
  startVerse: 28,
  endVerse: 28,
  prayer: `주님, 제 마음이 ${emotion}으로 무거울 때 주님께 나아가 쉬게 하소서. 오늘도 주님의 평안으로 제 마음을 붙들어 주소서. 아멘.`,
});

function extractJsonObject(raw: string): string | null {
  const cleaned = raw.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  if (s === -1 || e === -1 || e <= s) return null;
  return cleaned.slice(s, e + 1);
}

function cleanText(v: unknown): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
}

function parseChapter(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.trunc(v);
  }
  if (typeof v === "string") {
    const parsed = Number.parseInt(v.trim(), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function generateBibleVerse(
  situation: string,
  emotion: string
): Promise<BibleResult> {
  const prompt = `
[상황]
${situation}

[감정]
${emotion}

위 상황과 감정에 맞는 성경 구절 1개와 짧은 기도문을 JSON 스키마로만 출력하라.
`.trim();

  try {
    const raw = await callGptText(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4.1-mini",
    });

    const jsonText = extractJsonObject(raw);
    if (!jsonText) throw new Error("No JSON object in LLM output");

    const parsed = JSON.parse(jsonText) as LlmResponseShape;

    // ✅ result로 오든, 루트로 오든 수용
    const r = (parsed.result ?? parsed) as Partial<BibleResult>;

    const result: BibleResult = {
      verse: cleanText(r.verse),
      book: cleanText(r.book),
      chapter: parseChapter(r.chapter),
      startVerse:
        parseChapter((r as { startVerse?: unknown }).startVerse) ??
        parseChapter((r as { start_verse?: unknown }).start_verse) ??
        null,
      endVerse:
        parseChapter((r as { endVerse?: unknown }).endVerse) ??
        parseChapter((r as { end_verse?: unknown }).end_verse) ??
        null,
      prayer: cleanText(r.prayer),
    };

    const fb = FALLBACK(emotion);
    return {
      verse: result.verse || fb.verse,
      book: result.book || fb.book,
      chapter: result.chapter ?? fb.chapter,
      startVerse: result.startVerse ?? fb.startVerse,
      endVerse: result.endVerse ?? result.startVerse ?? fb.endVerse,
      prayer: result.prayer || fb.prayer,
    };
  } catch (error) {
    console.error("성경 구절 생성 실패(JSON):", error);
    return FALLBACK(emotion);
  }
}
