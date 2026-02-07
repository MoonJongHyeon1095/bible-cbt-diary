import type { DeepNoteContext } from "../../deepThought.types";

type DeepNoteFormatVariant = "context" | "thought";

export function formatDeepNote(
  note: DeepNoteContext,
  variant: DeepNoteFormatVariant,
): string {
  const emotions = note.emotions.filter(Boolean).join(", ");
  const thoughts = note.automaticThoughts.filter(Boolean).join(" / ");
  const errors = note.cognitiveErrors
    .map((err) => (err.detail ? `${err.title}: ${err.detail}` : err.title))
    .filter(Boolean)
    .join(" / ");
  const alternatives = note.alternatives.filter(Boolean).join(" / ");

  if (variant === "context") {
    // keys shortened for token saving
    return `- id: ${note.id}\n- trigger: ${note.triggerText}\n- emotions: ${emotions}\n- thoughts: ${thoughts}\n- errors: ${errors}\n- alts: ${alternatives}`.trim();
  }

  return `- id: ${note.id}\n- trigger: ${note.triggerText}\n- emotions: ${emotions}\n- automatic_thoughts: ${thoughts}\n- cognitive_errors: ${errors}\n- alternatives: ${alternatives}`.trim();
}
