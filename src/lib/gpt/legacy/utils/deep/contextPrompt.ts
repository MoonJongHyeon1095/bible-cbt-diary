import type { DeepNoteContext } from "../../deepThought.types";
import { formatDeepNote } from "./noteFormat";

export function buildDeepContextPrompt(
  main: DeepNoteContext,
  subs: DeepNoteContext[],
): string {
  const subs2 = subs.slice(0, 2);

  return [
    "[Main Note] (current focus)",
    formatDeepNote(main, "context"),
    "",
    "[Sub Notes] (past contexts to compare against, latest first, max 2)",
    subs2.map((note) => formatDeepNote(note, "context")).join("\n\n") || "(none)",
  ]
    .join("\n")
    .trim();
}
