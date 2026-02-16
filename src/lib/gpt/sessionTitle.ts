"use client";

import { callGptText } from "./client";

const SYSTEM_PROMPT = `
You generate concise Korean diary titles.

Rules:
- Output only one title line in Korean.
- Do not include quotes, markdown, numbering, emoji, or explanations.
- Keep it natural and specific to the incident and emotion.
- Keep length within 24 Korean characters if possible.
- Tone should be playful, witty, and light like a daily-life comedy animation.
- Do not be mean, cynical, or mocking toward the user.
- Prefer punchy phrasing with mild twist words, but keep emotional sincerity.
`.trim();

function normalizeTitle(raw: string): string {
  return raw
    .replace(/[`"'“”‘’]/g, "")
    .split("\n")[0]
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

export async function generateSessionNoteTitle(params: {
  incident: string;
  emotion: string;
}) {
  const incident = params.incident.trim();
  const emotion = params.emotion.trim();

  if (!incident || !emotion) return "";

  const prompt = `[Incident]\n${incident}\n\n[Emotion]\n${emotion}\n\n[Task]\n위 내용을 바탕으로 위트 있는 기록 제목 1개를 생성하세요.\n너무 과장하지 말고, 공감 가능한 장난기 톤으로 작성하세요.`;
  const raw = await callGptText(prompt, {
    systemPrompt: SYSTEM_PROMPT,
    model: "gpt-4o-mini",
  });
  return normalizeTitle(raw);
}
