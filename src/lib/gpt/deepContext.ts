// src/lib/gpt/deepInternalContext.ts
import { markAiFallback } from "@/lib/utils/aiFallback";
import type { DeepNoteContext } from "./deepThought.types";
import { runGptJson } from "./utils/core/run";
import { getFallbackDeepInternalContext } from "./utils/deep/contextFallback";
import { normalizeCbt, normalizeDeep, normalizeSalient } from "./utils/deep/contextNormalize";
import { buildDeepContextPrompt } from "./utils/deep/contextPrompt";
import { parseDeepContextResponse } from "./utils/deep/parseContext";

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
  deep: {
    repeatingPatterns: string[]; // 2–4: 반복되는 해석/패턴
    tensions: string[]; // 1–3: 노트들 간 충돌/불일치
    invariants: string[]; // 1–3: 거의 항상 유지되는 규칙/전제
    conditionalRules: string[]; // 1–2: "If ... then ..." 형태 규칙
    leveragePoints: string[]; // 1–2: 가장 작은 개입 지점
    bridgeHypothesis: string[]; // 1–2: 과거→현재 연결 가설
  };
};

const SYSTEM_PROMPT = `
You are a CBT (Cognitive Behavioral Therapy) counselor.
This output is INTERNAL ONLY (not shown to end users).

You will receive:
- [Main Note]
- [Sub Notes] (supporting contexts, latest first, max 2)

Goal:
Create a compact structured context object optimized for a DEEP SESSION (graph operation).
Deep session means the user is re-processing the main note through 1–2 related past notes.
Therefore, you must extract cross-note patterns, tensions, and a small set of actionable leverage points.

Hard rules:
- Output language: ALL strings must be in English only. Do NOT output Korean.
- Do NOT quote note text. Use short phrases/keywords only.
- Use only information grounded in the notes. Do NOT add new facts/assumptions.
- Sub notes are latest-first and at most 2.

salient:
- actors/events/needs/threats/emotions: 2–4 short keywords each when possible.

cbt:
- topDistortions: 1–2 standard CBT distortion names when possible.
- coreBeliefsHypothesis: 1–2 brief hypotheses.

deep (MOST IMPORTANT):
- repeatingPatterns: 2–4 short phrases describing repeating interpretation patterns across notes.
- tensions: 1–3 short phrases describing mismatches or contradictions across notes
  (e.g., same trigger → different emotion, or same fear expressed differently).
- invariants: 1–3 short phrases describing what stays constant (core theme).
- conditionalRules: 1–2 "If ... then ..." rules capturing the feared meaning.
- leveragePoints: 1–2 smallest change points (what to test/shift first).
- bridgeHypothesis: 1–2 hypotheses linking past notes to the current main note.

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
  "deep": {
    "repeatingPatterns": ["..."],
    "tensions": ["..."],
    "invariants": ["..."],
    "conditionalRules": ["If ... then ..."],
    "leveragePoints": ["..."],
    "bridgeHypothesis": ["..."]
  },
}
`.trim();

// ----------------------
// main API
// ----------------------
export async function generateDeepInternalContext(
  main: DeepNoteContext,
  subs: DeepNoteContext[],
): Promise<DeepInternalContext> {
  const prompt = buildDeepContextPrompt(main, subs);

  try {
    const { parsed } = await runGptJson({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
      parse: parseDeepContextResponse,
      tag: "deepContext",
    });

    const salient = normalizeSalient(parsed.salient);
    const cbt = normalizeCbt(parsed.cbt);
    const deep = normalizeDeep(parsed.deep);
    return { salient, cbt, deep };
  } catch (error) {
    console.error("deep internal context error:", error);
    return markAiFallback(getFallbackDeepInternalContext());
  }
}
