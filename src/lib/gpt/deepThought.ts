// src/lib/gpt/deepThought.ts
import { callGptText } from "./client";

export type DeepNoteContext = {
  id: number;
  triggerText: string;
  emotions: string[];
  automaticThoughts: string[];
  cognitiveErrors: Array<{ title: string; detail: string }>;
  alternatives: string[];
};

export type DeepThoughtResult = {
  autoThought: string;
  summary: string;
};

type LlmResponseShape = {
  autoThought?: unknown;
  summary?: unknown;
};

const SYSTEM_PROMPT = `
You are a CBT (Cognitive Behavioral Therapy) counselor who answers in Korean.

You will receive:
- [User Input] (the user's current wording)
- [Emotion]
- [Main Note] (primary context)
- [Sub Notes] (supporting contexts, ordered by latest first)

Your tasks:
1) Generate ONE new automatic thought sentence (1-2 Korean sentences, first-person) that integrates the main note and sub notes.
2) Generate a concise summary (3-5 Korean sentences) that captures repeated themes, emotions, distortions, and alternative patterns across the notes.
   - The summary is for later AI steps, not for end users.
   - Mention the main note as the center and note that sub notes are ordered latest-first.

Strict rules:
- Output JSON only.
- No extra text before/after JSON.
- All output must be in Korean.

Output schema:
{
  "autoThought": "...",
  "summary": "..."
}
`.trim();

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

function formatNote(note: DeepNoteContext) {
  const emotions = note.emotions.filter(Boolean).join(", ");
  const thoughts = note.automaticThoughts.filter(Boolean).join(" / ");
  const errors = note.cognitiveErrors
    .map((err) => (err.detail ? `${err.title}: ${err.detail}` : err.title))
    .filter(Boolean)
    .join(" / ");
  const alternatives = note.alternatives.filter(Boolean).join(" / ");

  return `- id: ${note.id}\n- trigger: ${note.triggerText}\n- emotions: ${emotions}\n- automatic_thoughts: ${thoughts}\n- cognitive_errors: ${errors}\n- alternatives: ${alternatives}`.trim();
}

export async function generateDeepAutoThoughtAndSummary(
  userInput: string,
  emotion: string,
  main: DeepNoteContext,
  subs: DeepNoteContext[],
): Promise<DeepThoughtResult> {
  const prompt = `
[User Input]
${userInput}

[Emotion]
${emotion}

[Main Note]
${formatNote(main)}

[Sub Notes] (latest first)
${subs.map(formatNote).join("\n\n") || "(none)"}
`.trim();

  try {
    const raw = await callGptText(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
    });
    const jsonText = extractJsonObject(raw);
    if (!jsonText) throw new Error("No JSON object in LLM output");

    const parsed = JSON.parse(jsonText) as LlmResponseShape;
    const autoThought = cleanText(parsed.autoThought);
    const summary = cleanText(parsed.summary);

    if (!autoThought || !summary) {
      throw new Error("Missing deep thought fields");
    }

    return { autoThought, summary };
  } catch (error) {
    console.error("deep auto thought error:", error);
    return {
      autoThought: userInput.trim() || "지금 마음이 복잡하고 불안하다.",
      summary:
        "메인 노트를 중심으로 여러 기록이 연결되어 있습니다. 최근 기록일수록 상황의 압박감이 강하게 반복됩니다. 비슷한 감정과 해석이 반복되어 왜곡이 강화될 수 있습니다. 대안사고가 일부 존재하지만 지금 상황에서는 충분히 적용되지 못한 흐름입니다.",
    };
  }
}
