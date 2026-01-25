// src/lib/gpt/deepInternalContext.ts
import { callGptText } from "./client";
import { cleanText, extractJsonObject } from "./cognitiveRank";
import type { DeepNoteContext } from "./deepThought.types";

export type DeepInternalContext = {
  patternSummary: {
    repeatedThemes: [string, string];
    triggerPatterns: [string, string];
    emotionShifts: [string];
    distortionPatterns: [string, string];
    alternativePatterns: [string];
  };
  openQuestions: [string, string];
  nextStepHint: string;
};

type LlmPatternSummary = {
  repeatedThemes?: unknown;
  triggerPatterns?: unknown;
  emotionShifts?: unknown;
  distortionPatterns?: unknown;
  alternativePatterns?: unknown;
};

type LlmResponseShape = {
  patternSummary?: unknown;
  openQuestions?: unknown;
  nextStepHint?: unknown;
};

const SYSTEM_PROMPT = `
You are a CBT (Cognitive Behavioral Therapy) counselor.
This output is INTERNAL ONLY (not shown to end users).

You will receive:
- [Main Note]
- [Sub Notes] (supporting contexts, latest first, max 2)

Goal:
Create a compact structured context object for downstream AI steps.

Hard rules:
- Output language: ALL strings must be in English only. Do NOT output Korean.
- Do NOT quote note text. Paraphrase only.
- Sub notes are latest-first and at most 2.

patternSummary MUST be exactly these counts:
- repeatedThemes: exactly 2 items
- triggerPatterns: exactly 2 items
- emotionShifts: exactly 1 item
- distortionPatterns: exactly 2 items (use standard CBT distortion names if possible)
- alternativePatterns: exactly 1 item (what helps, when it fails)

openQuestions:
- Exactly 2 brief, non-judgmental English questions.

nextStepHint:
- One short English sentence for the next module.

Strict format:
- Output JSON only. No extra text.

Output schema (exactly):
{
  "patternSummary": {
    "repeatedThemes": ["...", "..."],
    "triggerPatterns": ["...", "..."],
    "emotionShifts": ["..."],
    "distortionPatterns": ["...", "..."],
    "alternativePatterns": ["..."]
  },
  "openQuestions": ["...", "..."],
  "nextStepHint": "..."
}
`.trim();

// ----------------------
// helpers
// ----------------------
function normalizeTextValue(v: unknown): string {
  return typeof v === "string" ? cleanText(v) : "";
}

function normalizeStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  const arr = v.map(cleanText).filter(Boolean);
  return arr.slice(0, max);
}

function formatNote(note: DeepNoteContext) {
  const emotions = note.emotions.filter(Boolean).join(", ");
  const thoughts = note.automaticThoughts.filter(Boolean).join(" / ");
  const errors = note.cognitiveErrors
    .map((err) => (err.detail ? `${err.title}: ${err.detail}` : err.title))
    .filter(Boolean)
    .join(" / ");
  const alternatives = note.alternatives.filter(Boolean).join(" / ");

  // keys shortened for token saving
  return `- id: ${note.id}
- trigger: ${note.triggerText}
- emotions: ${emotions}
- thoughts: ${thoughts}
- errors: ${errors}
- alts: ${alternatives}`.trim();
}

export function formatDeepInternalContext(ctx: DeepInternalContext) {
  const ps = ctx.patternSummary;
  return `patternSummary:
- themes: ${ps.repeatedThemes.join(" | ")}
- triggers: ${ps.triggerPatterns.join(" | ")}
- shift: ${ps.emotionShifts.join(" | ")}
- distortions: ${ps.distortionPatterns.join(" | ")}
- alts: ${ps.alternativePatterns.join(" | ")}

openQuestions:
- ${ctx.openQuestions[0]}
- ${ctx.openQuestions[1]}

nextStepHint:
- ${ctx.nextStepHint}`.trim();
}

function normalizePatternSummary(
  v: unknown,
): DeepInternalContext["patternSummary"] {
  const obj = (
    v && typeof v === "object" ? (v as LlmPatternSummary) : {}
  ) as LlmPatternSummary;

  const repeatedThemes = normalizeStringArray(obj.repeatedThemes, 2);
  const triggerPatterns = normalizeStringArray(obj.triggerPatterns, 2);
  const emotionShifts = normalizeStringArray(obj.emotionShifts, 1);
  const distortionPatterns = normalizeStringArray(obj.distortionPatterns, 2);
  const alternativePatterns = normalizeStringArray(obj.alternativePatterns, 1);

  // fixed-count fallback
  const fb = {
    repeatedThemes: [
      "Interpretation quickly jumps to a negative conclusion.",
      "Concerns about relationships, performance, or control recur.",
    ],
    triggerPatterns: [
      "Ambiguous or delayed feedback from others.",
      "Unclear standards or high expectations.",
    ],
    emotionShifts: ["Tension escalates into anxiety and withdrawal."],
    distortionPatterns: ["Mind reading", "Catastrophizing"],
    alternativePatterns: [
      "Evidence-checking helps, but is hard to apply under pressure.",
    ],
  } as const;

  return {
    repeatedThemes: [
      repeatedThemes[0] || fb.repeatedThemes[0],
      repeatedThemes[1] || fb.repeatedThemes[1],
    ],
    triggerPatterns: [
      triggerPatterns[0] || fb.triggerPatterns[0],
      triggerPatterns[1] || fb.triggerPatterns[1],
    ],
    emotionShifts: [emotionShifts[0] || fb.emotionShifts[0]],
    distortionPatterns: [
      distortionPatterns[0] || fb.distortionPatterns[0],
      distortionPatterns[1] || fb.distortionPatterns[1],
    ],
    alternativePatterns: [alternativePatterns[0] || fb.alternativePatterns[0]],
  };
}

function normalizeOpenQuestions(v: unknown): [string, string] {
  const qs = normalizeStringArray(v, 2);
  const fb: [string, string] = [
    "What is the specific worst-case outcome you fear right now?",
    "What is one piece of evidence for and one piece of evidence against that conclusion?",
  ];
  return [qs[0] ? cleanText(qs[0]) : fb[0], qs[1] ? cleanText(qs[1]) : fb[1]];
}

// ----------------------
// main API
// ----------------------
export async function generateDeepInternalContext(
  main: DeepNoteContext,
  subs: DeepNoteContext[],
): Promise<DeepInternalContext> {
  const subs2 = subs.slice(0, 2);

  const prompt = `
[Main Note]
${formatNote(main)}

[Sub Notes] (latest first, max 2)
${subs2.map(formatNote).join("\n\n") || "(none)"}
`.trim();

  try {
    const raw = await callGptText(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
    });

    const jsonText = extractJsonObject(raw);
    if (!jsonText) throw new Error("No JSON object in LLM output");

    const parsed = JSON.parse(jsonText) as LlmResponseShape;

    const patternSummary = normalizePatternSummary(parsed.patternSummary);
    const openQuestions = normalizeOpenQuestions(parsed.openQuestions);
    const nextStepHint =
      normalizeTextValue(parsed.nextStepHint) ||
      "Rank likely distortions, then generate alternatives and a small behavioral experiment.";

    return { patternSummary, openQuestions, nextStepHint };
  } catch (error) {
    console.error("deep internal context error:", error);
    return {
      patternSummary: normalizePatternSummary({}),
      openQuestions: normalizeOpenQuestions([]),
      nextStepHint:
        "Rank likely distortions, then generate alternatives and a small behavioral experiment.",
    };
  }
}
