// src/lib/gpt/deepInternalContext.ts
import { callGptText } from "./client";
import type { DeepNoteContext } from "./deepThought.types";
import { cleanText } from "./utils/text";
import { parseDeepContextResponse } from "./utils/llm/deepContext";
import { markAiFallback } from "@/lib/utils/aiFallback";

export type DeepInternalContext = {
  salient: {
    actors: string[];
    events: string[];
    needs: string[];
    threats: string[];
    emotions: string[];
  };
  cbt: {
    topDistortions: string[];
    coreBeliefsHypothesis: string[];
  };
  openQuestions: [string, string];
  nextStepHint: string;
};

type LlmSalient = {
  actors?: unknown;
  events?: unknown;
  needs?: unknown;
  threats?: unknown;
  emotions?: unknown;
};

type LlmCbt = {
  topDistortions?: unknown;
  coreBeliefsHypothesis?: unknown;
};

const SYSTEM_PROMPT = `
You are a CBT (Cognitive Behavioral Therapy) counselor.
This output is INTERNAL ONLY (not shown to end users).

You will receive:
- [Main Note]
- [Sub Notes] (supporting contexts, latest first, max 2)

Goal:
Create a compact structured keyword context object for downstream AI steps.

Hard rules:
- Output language: ALL strings must be in English only. Do NOT output Korean.
- Do NOT quote note text. Use short phrases/keywords only.
- Sub notes are latest-first and at most 2.

Use only information grounded in the notes. Do NOT add new assumptions.

salient:
- actors/events/needs/threats/emotions: 2–4 short keywords each when possible.

cbt:
- topDistortions: 1–2 standard CBT distortion names when possible.
- coreBeliefsHypothesis: 1–2 brief hypotheses.

openQuestions:
- Exactly 2 brief, non-judgmental English questions.

nextStepHint:
- One short English sentence for the next module.

Strict format:
- Output JSON only. No extra text.

Output schema (exactly):
{
  "salient": {
    "actors": ["..."],
    "events": ["..."],
    "needs": ["..."],
    "threats": ["..."],
    "emotions": ["..."]
  },
  "cbt": {
    "topDistortions": ["..."],
    "coreBeliefsHypothesis": ["..."]
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
  const salient = ctx.salient;
  const cbt = ctx.cbt;
  return `salient:
- actors: ${salient.actors.join(" | ")}
- events: ${salient.events.join(" | ")}
- needs: ${salient.needs.join(" | ")}
- threats: ${salient.threats.join(" | ")}
- emotions: ${salient.emotions.join(" | ")}

cbt:
- topDistortions: ${cbt.topDistortions.join(" | ")}
- coreBeliefsHypothesis: ${cbt.coreBeliefsHypothesis.join(" | ")}

openQuestions:
- ${ctx.openQuestions[0]}
- ${ctx.openQuestions[1]}

nextStepHint:
- ${ctx.nextStepHint}`.trim();
}

function normalizeSalient(v: unknown): DeepInternalContext["salient"] {
  const obj =
    v && typeof v === "object" ? (v as LlmSalient) : ({} as LlmSalient);

  const actors = normalizeStringArray(obj.actors, 4);
  const events = normalizeStringArray(obj.events, 4);
  const needs = normalizeStringArray(obj.needs, 4);
  const threats = normalizeStringArray(obj.threats, 4);
  const emotions = normalizeStringArray(obj.emotions, 4);

  const fb = {
    actors: ["self"],
    events: ["unclear situation"],
    needs: ["clarity"],
    threats: ["rejection"],
    emotions: ["anxiety"],
  } as const;

  return {
    actors: actors.length > 0 ? actors : [...fb.actors],
    events: events.length > 0 ? events : [...fb.events],
    needs: needs.length > 0 ? needs : [...fb.needs],
    threats: threats.length > 0 ? threats : [...fb.threats],
    emotions: emotions.length > 0 ? emotions : [...fb.emotions],
  };
}

function normalizeCbt(v: unknown): DeepInternalContext["cbt"] {
  const obj = v && typeof v === "object" ? (v as LlmCbt) : ({} as LlmCbt);
  const topDistortions = normalizeStringArray(obj.topDistortions, 2);
  const coreBeliefsHypothesis = normalizeStringArray(
    obj.coreBeliefsHypothesis,
    2,
  );

  const fb = {
    topDistortions: ["Mind reading"],
    coreBeliefsHypothesis: ["I am not enough"],
  } as const;

  return {
    topDistortions:
      topDistortions.length > 0 ? topDistortions : [...fb.topDistortions],
    coreBeliefsHypothesis:
      coreBeliefsHypothesis.length > 0
        ? coreBeliefsHypothesis
        : [...fb.coreBeliefsHypothesis],
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

export function getFallbackDeepInternalContext(): DeepInternalContext {
  return {
    salient: normalizeSalient({}),
    cbt: normalizeCbt({}),
    openQuestions: normalizeOpenQuestions([]),
    nextStepHint:
      "Rank likely distortions, then generate alternatives and a small behavioral experiment.",
  };
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

    const parsed = parseDeepContextResponse(raw);
    if (!parsed) throw new Error("No JSON object in LLM output");

    const salient = normalizeSalient(parsed.salient);
    const cbt = normalizeCbt(parsed.cbt);
    const openQuestions = normalizeOpenQuestions(parsed.openQuestions);
    const nextStepHint =
      normalizeTextValue(parsed.nextStepHint) ||
      "Rank likely distortions, then generate alternatives and a small behavioral experiment.";

    return { salient, cbt, openQuestions, nextStepHint };
  } catch (error) {
    console.error("deep internal context error:", error);
    return markAiFallback(getFallbackDeepInternalContext());
  }
}
