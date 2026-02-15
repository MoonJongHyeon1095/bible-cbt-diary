// // src/lib/gpt/deepThought.ts
// import { markAiFallback } from "@/lib/utils/aiFallback";
// import { DeepInternalContext } from "./deepContext";
// import type { DeepNoteContext, SDTKey } from "./deepThought.types";
// import { parseSdtResponse } from "./utils/sdt/parse";
// import { runGptJson } from "./utils/core/run";
// import { buildDeepThoughtPrompt } from "./utils/deep/thoughtPrompt";
// import { FALLBACK } from "./utils/deep/thoughtFallback";
// import { normalizeThoughtItem, pickFirstItem } from "./utils/deep/thoughtNormalize";

// export type DeepAutoThoughtResult = {
//   sdt: Record<
//     SDTKey,
//     {
//       belief: [string, string, string]; // EXACTLY 3 Korean sentences
//       emotion_reason: string; // EXACTLY 1 Korean sentence
//     }
//   >;
// };

// /**
//  * Deep SDT automatic thoughts prompt
//  * - Keep the "minimal session" automatic-thought style
//  * - Inputs: main/sub notes + internal English pattern summary
//  * - Output: Korean JSON only
//  */
// const SYSTEM_PROMPT = `
// You are a CBT (Cognitive Behavioral Therapy) counselor who answers in Korean.

// The input includes:
// - [User Input] (current wording)
// - [Emotion]
// - [Main Note] (primary context)
// - [Sub Notes] (supporting contexts, latest-first, max 2)
// - [Internal Context - English] (keyword anchors for grounding)

// our goals:
// - Based on the situation the user experienced and the emotion they selected, your job is to articulate the hidden "underlying thought (automatic thought)" in clear sentences.
// - Focus only on revealing the "core claim" that makes the user feel the selected emotion right now.

// Important rules:
// - Must be written in Korean, as a natural first-person automatic thought. (e.g., "나는 …다", "분명 …일 것이다")
// - Consider the SDT perspectives (autonomy / relatedness / competence), generate 3 items.
// - Use Internal Context as the PRIMARY anchor. Use note text as SECONDARY support.
// - Do NOT introduce new assumptions beyond Internal Context + Notes.

// Deep-session constraints (MUST):
// - You MUST explicitly reflect at least:
//   (a) one item from internal.deep.conditionalRules OR internal.deep.invariants
//   AND
//   (b) one item from internal.deep.tensions OR internal.deep.bridgeHypothesis
//   in EACH SDT belief set (relatedness/competence/autonomy).
// - The 3rd sentence of each belief MUST express the feared consequence,
//   and it MUST be consistent with internal.deep.conditionalRules.
// - Do NOT produce generic encouragement. Keep it as a negative automatic thought.

// Diversity constraint (MUST):
// - relatedness/competence/autonomy must NOT repeat the same core claim.
// - relatedness focuses on acceptance/connection, competence on worth/performance, autonomy on control/choice.
// - Each item must use different evidence from internal.deep (different tension/bridge/invariant/rule when possible).

// Writing style:
// - Write in natural Korean, first-person automatic-thought voice.
// - Do not narrate events; write the interpretation / belief / rule inferred from them.
// - Not surface-level: make the negative meaning / feared outcome explicit.
// - Keep it tied to the present context (relationship / performance / control) rather than vague life philosophy.
// - Let the selected emotion shape the wording.

// Per-item requirements:
// 1) belief
// - Must be an array of EXACTLY 3 Korean sentences.
// - Sentence 1~2: the hidden core claim / belief / viewpoint  (card-ready).
// - Sentence 3: the feared consequence / meaning / rule that follows from it.
// - Not a surface-level thought: make the negative belief/meaning/interpretation/feared outcome explicit.
// - Avoid vague life-philosophy statements. Keep it tightly connected to the current situation and relationship context.
// - Do NOT copy or restate the situation text; write a one-step-generalized belief/rule inferred from it.
// - Reflect the emotion label in the wording.

// 2) emotion_reason
// - one sentence explaining why the above belief creates the current emotion, referencing the selected emotion.
// - Write only as supporting explanation to understand the belief.

// Output requirements:
// - Output JSON only (no extra text).
// - All strings MUST be Korean.
// - Generate exactly 1 item for each: relatedness, competence, autonomy.

// Output schema (exactly):
// {
//   "sdt": {
//     "relatedness": [
//       { "belief": ["...", "...", "..."], "emotion_reason": "..." }
//     ],
//     "competence": [
//       { "belief": ["...", "...",  "..."], "emotion_reason": "..." }
//     ],
//     "autonomy": [
//       { "belief": ["...", "...", "..."], "emotion_reason": "..." }
//     ]
//   }
// }
// `.trim();

// // helpers moved to utils/deep/*

// // ----------------------
// // main API
// // ----------------------
// export async function generateDeepSdtAutomaticThoughts(
//   userInput: string,
//   emotion: string,
//   main: DeepNoteContext,
//   subs: DeepNoteContext[],
//   internal: DeepInternalContext,
// ): Promise<DeepAutoThoughtResult> {
//   const subs2 = subs.slice(0, 2);
//   const prompt = buildDeepThoughtPrompt(
//     userInput,
//     emotion,
//     main,
//     subs2,
//     internal,
//   );

//   let usedFallback = false;
//   try {
//     const { parsed } = await runGptJson({
//       prompt,
//       systemPrompt: SYSTEM_PROMPT,
//       model: "gpt-4o-mini",
//       parse: parseSdtResponse,
//       tag: "deepThought",
//     });

//     const sdt = (parsed ?? {}) as Partial<Record<SDTKey, unknown>>;

//     // schema expects arrays with 1 object each
//     const relCandidate = normalizeThoughtItem(pickFirstItem(sdt.relatedness));
//     const comCandidate = normalizeThoughtItem(pickFirstItem(sdt.competence));
//     const autCandidate = normalizeThoughtItem(pickFirstItem(sdt.autonomy));
//     const relItem = relCandidate ?? FALLBACK.relatedness;
//     const comItem = comCandidate ?? FALLBACK.competence;
//     const autItem = autCandidate ?? FALLBACK.autonomy;
//     usedFallback = !relCandidate || !comCandidate || !autCandidate;

//     const result = {
//       sdt: {
//         relatedness: relItem,
//         competence: comItem,
//         autonomy: autItem,
//       },
//     };
//     return usedFallback ? markAiFallback(result, "partial") : result;
//   } catch (error) {
//     console.error("deep sdt automatic thoughts error:", error);
//     return markAiFallback({
//       sdt: {
//         relatedness: FALLBACK.relatedness,
//         competence: FALLBACK.competence,
//         autonomy: FALLBACK.autonomy,
//       },
//     });
//   }
// }
