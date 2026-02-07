import type { DeepInternalContext } from "../../deepContext";
import type { DeepNoteContext } from "../../deepThought.types";
import { formatDeepNote } from "./noteFormat";
import { buildDeepCognitiveAnalysisInternal } from "./analysisPrompt";

export function buildDeepThoughtPrompt(
  userInput: string,
  emotion: string,
  main: DeepNoteContext,
  subs: DeepNoteContext[],
  internal: DeepInternalContext,
): string {
  const subs2 = subs.slice(0, 2);

  const internalDeepFirst = buildDeepCognitiveAnalysisInternal(internal);

  return [
    "[User Input]",
    userInput,
    "",
    "[Emotion]",
    emotion,
    "",
    "[Main Note]",
    formatDeepNote(main, "thought"),
    "",
    "[Sub Notes] (past contexts to compare against, latest first, max 2)",
    subs2.map((note) => formatDeepNote(note, "thought")).join("\n\n") || "(none)",
    "",
    "[Internal Context - English] (DO NOT IGNORE)",
    internalDeepFirst,
  ]
    .join("\n")
    .trim();
}
