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
  thought_details?: Array<{ emotion: string; automatic_thought: string }>;
  error_details?: Array<{ error_label: string; error_description: string }>;
  alternative_details?: Array<{ alternative: string }>;
}): DeepNoteContext {
  return {
    id: note.id,
    triggerText: note.trigger_text,
    emotions: (note.thought_details ?? [])
      .map((detail) => detail.emotion)
      .filter(Boolean),
    automaticThoughts: (note.thought_details ?? [])
      .map((detail) => detail.automatic_thought)
      .filter(Boolean),
    cognitiveErrors: (note.error_details ?? []).map((detail) => ({
      title: detail.error_label,
      detail: detail.error_description,
    })),
    alternatives: (note.alternative_details ?? [])
      .map((detail) => detail.alternative)
      .filter(Boolean),
  };
}
