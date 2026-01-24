export type EmotionNote = {
  id: number;
  title: string;
  trigger_text: string;
  behavior: string | null;
  created_at: string;
  emotion_labels?: string[];
  error_labels?: string[];
  behavior_labels?: string[];
};

export type EmotionNoteWithDetails = EmotionNote & {
  thought_details: EmotionNoteDetail[];
  error_details: EmotionNoteErrorDetail[];
  alternative_details: EmotionNoteAlternativeDetail[];
  behavior_details: EmotionNoteBehaviorDetail[];
};

export type EmotionNoteDetail = {
  id: number;
  note_id: number;
  automatic_thought: string;
  emotion: string;
  created_at: string;
};

export type EmotionNoteErrorDetail = {
  id: number;
  note_id: number;
  error_label: string;
  error_description: string;
  created_at: string;
};

export type EmotionNoteAlternativeDetail = {
  id: number;
  note_id: number;
  alternative: string;
  created_at: string;
};

export type EmotionNoteBehaviorDetail = {
  id: number;
  note_id: number;
  behavior_label: string;
  behavior_description: string;
  error_tags: string[] | null;
  created_at: string;
};
