// src/lib/gpt/deepThought.types.ts

export type SDTKey = "relatedness" | "competence" | "autonomy";

export type DeepNoteContext = {
  id: number;
  triggerText: string;
  emotions: string[];
  automaticThoughts: string[];
  cognitiveErrors: Array<{ title: string; detail: string }>;
  alternatives: string[];
};

export function buildDeepNoteContext(note: {
  id: number;
  trigger_text: string;
  emotion_tags?: string[];
  inner_belief?: string;
  error_label?: string;
  error_description?: string;
  alternative?: string;
  thought_details?: Array<{ emotion: string; automatic_thought: string }>;
  error_details?: Array<{ error_label: string; error_description: string }>;
  alternative_details?: Array<{ alternative: string }>;
}): DeepNoteContext {
  const emotionsFromLegacy = (note.thought_details ?? [])
    .map((detail) => detail.emotion)
    .filter(Boolean);
  const thoughtsFromLegacy = (note.thought_details ?? [])
    .map((detail) => detail.automatic_thought)
    .filter(Boolean);
  const errorsFromLegacy = (note.error_details ?? []).map((detail) => ({
    title: detail.error_label,
    detail: detail.error_description,
  }));
  const alternativesFromLegacy = (note.alternative_details ?? [])
    .map((detail) => detail.alternative)
    .filter(Boolean);

  return {
    id: note.id,
    triggerText: note.trigger_text,
    emotions: note.emotion_tags?.length ? note.emotion_tags : emotionsFromLegacy,
    automaticThoughts: note.inner_belief ? [note.inner_belief] : thoughtsFromLegacy,
    cognitiveErrors:
      note.error_label || note.error_description
        ? [
            {
              title: note.error_label ?? "",
              detail: note.error_description ?? "",
            },
          ]
        : errorsFromLegacy,
    alternatives: note.alternative ? [note.alternative] : alternativesFromLegacy,
  };
}
